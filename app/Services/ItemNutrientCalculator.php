<?php

namespace App\Services;

class ItemNutrientCalculator
{
    public const FIELDS = [
        'protein_g' => 'protein_total_g',
        'iron_mg' => 'iron_total_mg',
        'zinc_mg' => 'zinc_total_mg',
        'calcium_mg' => 'calcium_total_mg',
        'b12_ug' => 'b12_total_ug',
    ];

    /** Les valeurs du catalogue sont pour 100 g ; null signifie un apport inconnu. */
    public function calculate(?array $food, float $weightG): array
    {
        $totals = [];

        foreach (self::FIELDS as $source => $column) {
            $value = $food[$source] ?? null;
            $totals[$column] = $value === null ? null : round($value * $weightG / 100, 3);
        }

        return $totals;
    }
}
