<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MealItemNutritionTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalogue_nutrients_are_saved_for_the_portion_and_client_totals_are_ignored(): void
    {
        $user = User::factory()->create();
        $meal = $user->meals()->create(['meal_date' => '2026-11-11', 'type' => 'lunch', 'protein_total_g' => 12]);

        $this->actingAs($user)->post("/repas/{$meal->id}/ingredients", [
            'food_key' => 'la-vie-tofu-fume', 'food_name' => 'Nom falsifié', 'weight_g' => 98,
            'protein_total_g' => 999, 'b12_total_ug' => 999,
        ])->assertSessionHasNoErrors()->assertRedirect("/repas/{$meal->id}");

        $item = $meal->items()->sole();
        $this->assertSame('la-vie-tofu-fume', $item->food_key);
        $this->assertSame('Tofu fumé au bois de hêtre', $item->food_name);
        $this->assertSame('98.00', $item->weight_g);
        $this->assertSame('14.602', $item->protein_total_g);
        $this->assertSame('1.960', $item->iron_total_mg);
        $this->assertSame('1.372', $item->zinc_total_mg);
        $this->assertSame('60.760', $item->calcium_total_mg);
        $this->assertSame('0.019', $item->b12_total_ug);
        $this->assertSame('12.000', $meal->fresh()->protein_total_g);
    }

    public function test_unknown_nutrients_remain_null_when_an_item_is_added(): void
    {
        $user = User::factory()->create();
        $meal = $user->meals()->create(['meal_date' => '2026-11-11', 'type' => 'lunch']);

        $this->actingAs($user)->post("/repas/{$meal->id}/ingredients", [
            'food_key' => 'la-vie-lardons', 'food_name' => 'Lardons végétaux', 'weight_g' => 150,
        ])->assertSessionHasNoErrors();

        $item = $meal->items()->sole();
        $this->assertSame('21.000', $item->protein_total_g);
        $this->assertSame('4.575', $item->iron_total_mg);
        $this->assertNull($item->b12_total_ug);
    }

    public function test_editing_the_weight_recalculates_all_nutrients_for_legacy_items(): void
    {
        $user = User::factory()->create();
        $meal = $user->meals()->create(['meal_date' => '2026-11-11', 'type' => 'lunch']);
        $item = $meal->items()->create(['food_name' => 'Tofu fumé au bois de hêtre', 'weight_g' => 98]);

        $this->actingAs($user)->patch("/repas/{$meal->id}/ingredients/{$item->id}", ['weight_g' => 100])
            ->assertSessionHasNoErrors();

        $item->refresh();
        $this->assertSame('la-vie-tofu-fume', $item->food_key);
        $this->assertSame('14.900', $item->protein_total_g);
        $this->assertSame('2.000', $item->iron_total_mg);
        $this->assertSame('1.400', $item->zinc_total_mg);
        $this->assertSame('62.000', $item->calcium_total_mg);
        $this->assertSame('0.019', $item->b12_total_ug);
    }

    public function test_foods_outside_the_catalogue_can_be_added_with_unknown_nutrients(): void
    {
        $user = User::factory()->create();
        $meal = $user->meals()->create(['meal_date' => '2026-11-11', 'type' => 'lunch']);
        $this->actingAs($user)->post("/repas/{$meal->id}/ingredients", [
            'food_name' => 'Mon ingrédient maison', 'weight_g' => 50,
        ])->assertSessionHasNoErrors();

        $item = $meal->items()->sole();
        $this->assertNull($item->food_key);
        foreach (['protein_total_g', 'iron_total_mg', 'zinc_total_mg', 'calcium_total_mg', 'b12_total_ug'] as $field) {
            $this->assertNull($item->$field);
        }
    }

    public function test_invalid_catalogue_keys_and_overprecise_weights_are_rejected(): void
    {
        $user = User::factory()->create();
        $meal = $user->meals()->create(['meal_date' => '2026-11-11', 'type' => 'lunch']);
        $this->actingAs($user)->post("/repas/{$meal->id}/ingredients", [
            'food_key' => 'does-not-exist', 'food_name' => 'Inconnu', 'weight_g' => 100,
        ])->assertSessionHasErrors('food_key');
        $this->post("/repas/{$meal->id}/ingredients", [
            'food_name' => 'Tofu fumé au bois de hêtre', 'weight_g' => '98.123',
        ])->assertSessionHasErrors('weight_g');
        $this->assertDatabaseCount('meal_items', 0);
    }
}
