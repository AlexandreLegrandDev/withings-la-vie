<?php

namespace App\Services;

use App\Models\User;

/**
 * Bilan des apports d'une journée : ce qui a été mangé (somme des totaux des repas du jour)
 * comparé aux besoins calculés à l'inscription (colonnes *_target des users).
 *
 * Les totaux d'un repas (meals.protein_total_g, etc.) seront remplis par la page d'un repas
 * quand on pèsera les aliments : ce bilan se met alors à jour tout seul.
 */
class DailyIntake
{
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
     * @return array{
     *     percent: int,
     *     nutrients: list<array{key: string, label: string, unit: string, eaten: float, target: float, percent: int}>,
     *     missing: list<string>
     * }
     */
    public function forUser(User $user, string $date): array
    {
        $totals = $user->meals()
            ->whereDate('meal_date', $date)
            ->selectRaw(collect(self::NUTRIENTS)->map(fn ($n) => "COALESCE(SUM({$n[1]}), 0) as {$n[1]}")->join(', '))
            ->first();

        $nutrients = [];
        foreach (self::NUTRIENTS as $key => [$label, $totalColumn, $targetColumn, $unit]) {
            $target = (float) $user->{$targetColumn};

            // Pas de besoin calculé (ex. calcium pour un mineur) : on n'affiche pas ce nutriment
            if ($target <= 0) {
                continue;
            }

            $eaten = (float) $totals->{$totalColumn};

            $nutrients[] = [
                'key' => $key,
                'label' => $label,
                'unit' => $unit,
                'eaten' => round($eaten, 1),
                'target' => round($target, 1),
                // Plafonné à 100 : manger 2x trop de fer ne compense pas le manque de B12
                'percent' => (int) min(100, round($eaten / $target * 100)),
            ];
        }

        // Avancement du jour = moyenne des pourcentages de chaque nutriment
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
