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
     */
    public function index(Request $request, DailyIntake $dailyIntake): Response
    {
        $user = $request->user();
        $period = $request->query('periode') === 'mois' ? 'month' : 'week';
        $today = CarbonImmutable::today(MealController::TIMEZONE);

        [$start, $end] = $period === 'week'
            ? [$today->startOfWeek(CarbonImmutable::MONDAY), $today->endOfWeek(CarbonImmutable::SUNDAY)->startOfDay()]
            : [$today->startOfMonth(), $today->endOfMonth()->startOfDay()];

        // Seulement les jours déjà commencés : les jours à venir ne comptent pas dans les moyennes
        $days = $dailyIntake->forPeriod($user, $start->toDateString(), $today->toDateString());

        return Inertia::render('tracking', [
            'period' => $period,
            'start' => $start->toDateString(),
            'end' => $end->toDateString(),
            'bars' => $period === 'week' ? $this->dayBars($start, $today, $days) : $this->weekBars($start, $end, $today, $days),
            'average' => $this->average(array_column($days, 'percent')),
            'nutrients' => $this->nutrientAverages($days),
            'streak' => $this->streak($user, $today),
        ]);
    }

    /** Une barre par jour de la semaine ; null pour les jours à venir. */
    private function dayBars(CarbonImmutable $start, CarbonImmutable $today, array $days): array
    {
        return collect(range(0, 6))->map(function ($i) use ($start, $today, $days) {
            $date = $start->addDays($i)->toDateString();

            return [
                'label' => self::DAY_LETTERS[$i],
                'value' => $days[$date]['percent'] ?? null,
                'current' => $date === $today->toDateString(),
            ];
        })->all();
    }

    /** Une barre par semaine du mois (moyenne des jours déjà passés), libellée « 3–9 ». */
    private function weekBars(CarbonImmutable $start, CarbonImmutable $end, CarbonImmutable $today, array $days): array
    {
        $bars = [];
        for ($weekStart = $start; $weekStart <= $end; $weekStart = $weekStart->addWeek()->startOfWeek(CarbonImmutable::MONDAY)) {
            $weekEnd = $weekStart->endOfWeek(CarbonImmutable::SUNDAY)->startOfDay()->min($end);
            $dates = collect(CarbonPeriod::create($weekStart, $weekEnd))->map->toDateString();

            $bars[] = [
                'label' => $weekStart->day === $weekEnd->day ? (string) $weekStart->day : $weekStart->day.'–'.$weekEnd->day,
                'value' => $this->average($dates->map(fn ($d) => $days[$d]['percent'] ?? null)->filter(fn ($p) => $p !== null)->all()),
                'current' => $today->between($weekStart, $weekEnd),
            ];
        }

        return $bars;
    }

    /** Moyenne de chaque nutriment sur les jours de la période, du mieux couvert au moins couvert. */
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

    /** Moyenne arrondie, ou null s'il n'y a aucune valeur (ex. semaine pas encore commencée). */
    private function average(array $values): ?int
    {
        return $values ? (int) round(array_sum($values) / count($values)) : null;
    }
}
