<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\DailyIntake;
use Carbon\CarbonImmutable;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TrackingController extends Controller
{
    /** Initiale de chaque jour sous les barres de la semaine (lundi → dimanche). */
    private const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

    /**
     * Page « Ton suivi » : couverture des besoins jour par jour (semaine) ou semaine par semaine (mois),
     * série de jours suivis et moyenne par nutriment sur la période.
     *
     * ?periode=mois pour le mois, ?date=AAAA-MM-JJ pour une semaine ou un mois passé (n'importe quel jour de la période).
     *
     * Un jour à 0 % (rien noté, souvent un oubli) ne compte pas dans les moyennes, pour ne pas décourager.
     */
    public function index(Request $request, DailyIntake $dailyIntake): Response
    {
        $request->validate(['date' => ['sometimes', 'date_format:Y-m-d', 'before_or_equal:today']]);

        $user = $request->user();
        $period = $request->query('periode') === 'mois' ? 'month' : 'week';
        $today = CarbonImmutable::today();
        $anchor = $request->has('date') ? CarbonImmutable::parse($request->query('date'))->startOfDay() : $today;

        [$start, $end] = $period === 'week'
            ? [$anchor->startOfWeek(CarbonImmutable::MONDAY), $anchor->endOfWeek(CarbonImmutable::SUNDAY)->startOfDay()]
            : [$anchor->startOfMonth(), $anchor->endOfMonth()->startOfDay()];

        // Seulement les jours déjà commencés : les jours à venir ne comptent pas
        $lastDay = $end->min($today);
        $days = $dailyIntake->forPeriod($user, $start->toDateString(), $lastDay->toDateString());
        $trackedDays = array_filter($days, fn ($day) => $day['percent'] > 0);

        $previous = $period === 'week' ? $start->subWeek() : $start->subMonth();
        $next = $period === 'week' ? $start->addWeek() : $start->addMonth();

        return Inertia::render('tracking', [
            'period' => $period,
            'start' => $start->toDateString(),
            'end' => $end->toDateString(),
            'previousDate' => $previous->toDateString(),
            'nextDate' => $next <= $today ? $next->toDateString() : null,
            'bars' => $period === 'week' ? $this->dayBars($start, $today, $days) : $this->weekBars($start, $end, $today, $days),
            'average' => $this->average(array_column($trackedDays, 'percent')),
            'nutrients' => $this->nutrientAverages($trackedDays),
            'streak' => $this->streak($user, $today),
        ]);
    }

    /** Une barre par jour de la semaine ; null pour les jours à venir. Un clic ouvre le bilan du jour. */
    private function dayBars(CarbonImmutable $start, CarbonImmutable $today, array $days): array
    {
        return collect(range(0, 6))->map(function ($i) use ($start, $today, $days) {
            $date = $start->addDays($i)->toDateString();

            return [
                'label' => self::DAY_LETTERS[$i],
                'date' => $date,
                'value' => $days[$date]['percent'] ?? null,
                'current' => $date === $today->toDateString(),
            ];
        })->all();
    }

    /**
     * Une barre par semaine du mois, libellée « 3–9 » : moyenne des jours suivis,
     * 0 si des jours sont passés sans rien de noté, null si la semaine n'a pas commencé. Un clic ouvre la semaine.
     */
    private function weekBars(CarbonImmutable $start, CarbonImmutable $end, CarbonImmutable $today, array $days): array
    {
        $bars = [];
        for ($weekStart = $start; $weekStart <= $end; $weekStart = $weekStart->addWeek()->startOfWeek(CarbonImmutable::MONDAY)) {
            $weekEnd = $weekStart->endOfWeek(CarbonImmutable::SUNDAY)->startOfDay()->min($end);
            $percents = collect(CarbonPeriod::create($weekStart, $weekEnd))
                ->map(fn ($day) => $days[$day->toDateString()]['percent'] ?? null)
                ->filter(fn ($percent) => $percent !== null);

            $bars[] = [
                'label' => $weekStart->day === $weekEnd->day ? (string) $weekStart->day : $weekStart->day.'–'.$weekEnd->day,
                'date' => $weekStart->toDateString(),
                'value' => $percents->isEmpty() ? null : ($this->average($percents->filter()->all()) ?? 0),
                'current' => $today->between($weekStart, $weekEnd),
            ];
        }

        return $bars;
    }

    /** Moyenne de chaque nutriment sur les jours suivis, du mieux couvert au moins couvert. */
    private function nutrientAverages(array $days): array
    {
        return collect($days)
            ->flatMap(fn ($day) => $day['nutrients'])
            ->groupBy('key')
            ->map(fn ($values) => [
                'key' => $values->first()['key'],
                'label' => $values->first()['label'],
                'percent' => (int) round($values->avg('percent')),
            ])
            ->sortByDesc('percent')
            ->values()
            ->all();
    }

    /**
     * Nombre de jours d'affilée avec au moins un aliment enregistré, jusqu'à aujourd'hui.
     * Si rien n'est encore noté aujourd'hui, la série en cours (jusqu'à hier) n'est pas perdue.
     */
    private function streak(User $user, CarbonImmutable $today): int
    {
        $trackedDays = $user->meals()
            ->whereHas('items')
            ->whereDate('meal_date', '<=', $today->toDateString())
            ->selectRaw('DATE(meal_date) as day')
            ->distinct()
            ->orderByDesc('day')
            ->limit(366)
            ->pluck('day')
            ->flip();

        $day = $trackedDays->has($today->toDateString()) ? $today : $today->subDay();
        $streak = 0;
        while ($trackedDays->has($day->toDateString())) {
            $streak++;
            $day = $day->subDay();
        }

        return $streak;
    }

    /** Moyenne arrondie, ou null s'il n'y a aucune valeur. */
    private function average(array $values): ?int
    {
        return $values ? (int) round(array_sum($values) / count($values)) : null;
    }
}
