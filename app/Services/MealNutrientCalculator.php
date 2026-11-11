<?php

namespace App\Services;

use App\Models\Meal;

class MealNutrientCalculator
{
    /** Somme des apports connus ; une valeur entièrement inconnue reste null. */
    public function calculate(Meal $meal): array
    {
        $columns = array_values(ItemNutrientCalculator::FIELDS);
        $items = $meal->items()->get($columns);
        $totals = [];
        $hasUnknownNutrients = false;

        foreach ($columns as $column) {
            $known = $items->pluck($column)->filter(fn ($value) => $value !== null);
            $hasUnknownNutrients = $hasUnknownNutrients || $known->count() < $items->count();
            $totals[$column] = $items->isEmpty() ? 0
                : ($known->isEmpty() ? null : round((float) $known->sum(), 3));
        }

        return ['totals' => $totals, 'hasUnknownNutrients' => $hasUnknownNutrients];
    }

    public function sync(Meal $meal): void
    {
        $meal->update($this->calculate($meal)['totals']);
    }
}
