<?php

namespace Tests\Unit;

use App\Services\ItemNutrientCalculator;
use PHPUnit\Framework\TestCase;

class ItemNutrientCalculatorTest extends TestCase
{
    public function test_all_nutrients_are_scaled_from_100_grams(): void
    {
        $food = ['protein_g' => 14, 'iron_mg' => 3.05, 'zinc_mg' => 2.05, 'calcium_mg' => 81, 'b12_ug' => 0.4];

        $this->assertSame([
            'protein_total_g' => 21.0, 'iron_total_mg' => 4.575, 'zinc_total_mg' => 3.075,
            'calcium_total_mg' => 121.5, 'b12_total_ug' => 0.6,
        ], (new ItemNutrientCalculator())->calculate($food, 150));
    }

    public function test_small_portions_are_rounded_to_three_decimal_places(): void
    {
        $result = (new ItemNutrientCalculator())->calculate(['protein_g' => 14.9, 'b12_ug' => 0.019], 98);

        $this->assertSame(14.602, $result['protein_total_g']);
        $this->assertSame(0.019, $result['b12_total_ug']);
        $this->assertSame(0.001, (new ItemNutrientCalculator())->calculate(['protein_g' => 14.9], 0.01)['protein_total_g']);
    }

    public function test_unknown_values_stay_null_and_zero_stays_zero(): void
    {
        $result = (new ItemNutrientCalculator())->calculate(['protein_g' => 0, 'iron_mg' => null], 150);

        $this->assertSame(0.0, $result['protein_total_g']);
        $this->assertNull($result['iron_total_mg']);
        $this->assertNull($result['b12_total_ug']);
        $this->assertSame(array_fill_keys(array_values(ItemNutrientCalculator::FIELDS), null),
            (new ItemNutrientCalculator())->calculate(null, 150));
    }
}
