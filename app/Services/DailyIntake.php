<?php

namespace App\Services;

use App\Models\Meal;
use App\Models\User;
use Carbon\CarbonPeriod;

/**
 * Bilan des apports : ce qui a été mangé (somme des totaux des repas) comparé
 * aux besoins de l'utilisateur (colonnes *_target des users).
 */
class DailyIntake
{
    public function __construct(private MealNutrientCalculator $mealCalculator) {}

    /**
     * Les nutriments suivis, dans l'ordre d'affichage.
     * clé => [libellé, colonne du total dans meals, colonne du besoin dans users, unité, article pour « il te manque … »]
     */
    public const NUTRIENTS = [
        'protein' => ['Protéines', 'protein_total_g', 'protein_target_g', 'g', 'des protéines'],
        'iron' => ['Fer', 'iron_total_mg', 'iron_target_mg', 'mg', 'du fer'],
        'b12' => ['Vitamine B12', 'b12_total_ug', 'b12_target_ug', 'µg', 'de la B12'],
        'calcium' => ['Calcium', 'calcium_total_mg', 'calcium_target_mg', 'mg', 'du calcium'],
        'zinc' => ['Zinc', 'zinc_total_mg', 'zinc_target_mg', 'mg', 'du zinc'],
    ];

    /**
     * Bilan d'une journée (AAAA-MM-JJ).
     *
     * @return array{percent: int, nutrients: list<array<string, mixed>>, missing: list<string>}
     */
    public function forUser(User $user, string $date): array
    {
        $totals = $user->meals()
            ->whereDate('meal_date', $date)
            ->selectRaw($this->sums())
            ->first();

        return $this->compare($totals, $user);
    }

    /**
     * Bilan de chaque jour entre $from et $to inclus (AAAA-MM-JJ), en une seule requête.
     * Un jour sans repas vaut 0 %.
     *
     * @return array<string, array{percent: int, nutrients: list<array<string, mixed>>, missing: list<string>}> clé = date
     */
    public function forPeriod(User $user, string $from, string $to): array
    {
        // whereDate : marche que la date soit stockée « 2026-11-10 » ou « 2026-11-10 00:00:00 »
        $totalsByDay = $user->meals()
            ->whereDate('meal_date', '>=', $from)
            ->whereDate('meal_date', '<=', $to)
            ->selectRaw("DATE(meal_date) as day, {$this->sums()}")
            ->groupBy('day')
            ->get()
            ->keyBy('day');

        $empty = (object) collect(self::NUTRIENTS)->mapWithKeys(fn ($n) => [$n[1] => 0])->all();

        $days = [];
        foreach (CarbonPeriod::create($from, $to) as $day) {
            $date = $day->toDateString();
            $days[$date] = $this->compare($totalsByDay->get($date) ?? $empty, $user);
        }

        return $days;
    }

    /**
     * Bilan d'un repas comparé à sa part prévue des besoins du jour (ex. déjeuner = 35 %),
     * avec en plus « dayPercent » : la part réelle des besoins du jour apportée par ce repas.
     *
     * @return array{percent: int, dayPercent: int, nutrients: list<array<string, mixed>>, missing: list<string>, hasUnknownNutrients: bool}
     */
    public function forMeal(Meal $meal, float $share): array
    {
        $summary = $this->mealCalculator->calculate($meal);
        $totals = (object) $summary['totals'];

        return [
            ...$this->compare($totals, $meal->user, $share / 100),
            'dayPercent' => $this->dayPercent($totals, $meal->user),
            'hasUnknownNutrients' => $summary['hasUnknownNutrients'],
        ];
    }

    /** Part des besoins du jour couverte par des totaux (ceux d'un repas, par exemple), de 0 à 100. */
    public function dayPercent(object $totals, User $user): int
    {
        return $this->compare($totals, $user)['percent'];
    }

    private function sums(): string
    {
        return collect(self::NUTRIENTS)->map(fn ($n) => "COALESCE(SUM({$n[1]}), 0) as {$n[1]}")->join(', ');
    }

    /**
     * Compare des totaux (colonnes *_total) aux besoins de l'utilisateur, multipliés par $factor.
     *
     * « percent » est plafonné à 100 pour les moyennes (manger 2x trop de fer ne compense pas le manque de B12),
     * « actualPercent » ne l'est pas, pour montrer un dépassement (ex. 134 %).
     *
     * @return array{percent: int, nutrients: list<array<string, mixed>>, missing: list<string>}
     */
    private function compare(object $totals, User $user, float $factor = 1.0): array
    {
        $nutrients = [];
        foreach (self::NUTRIENTS as $key => [$label, $totalColumn, $targetColumn, $unit]) {
            $target = (float) $user->{$targetColumn} * $factor;

            // Pas de besoin calculé (ex. calcium pour un mineur) : on n'affiche pas ce nutriment
            if ($target <= 0) {
                continue;
            }

            $eaten = (float) ($totals->{$totalColumn} ?? 0);
            $actualPercent = (int) round($eaten / $target * 100);

            $nutrients[] = [
                'key' => $key,
                'label' => $label,
                'unit' => $unit,
                'eaten' => round($eaten, 1),
                'target' => round($target, 1),
                'percent' => min(100, $actualPercent),
                'actualPercent' => $actualPercent,
            ];
        }

        // Avancement = moyenne des pourcentages (plafonnés) de chaque nutriment
        $percent = $nutrients ? (int) round(collect($nutrients)->avg('percent')) : 0;

        // Les 2 nutriments les plus en retard (sous 100 %), pour « Il te manque surtout du fer et de la B12 »
        $missing = collect($nutrients)
            ->where('percent', '<', 100)
            ->sortBy('percent')
            ->take(2)
            ->map(fn ($n) => self::NUTRIENTS[$n['key']][4])
            ->values()
            ->all();

        return ['percent' => $percent, 'nutrients' => $nutrients, 'missing' => $missing];
    }
}
