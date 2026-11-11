<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MealNutrientTotalsTest extends TestCase
{
    use RefreshDatabase;

    public function test_adding_changing_and_removing_ingredients_updates_totals_and_indicators(): void
    {
        $user = User::factory()->create([
            'protein_target_g' => 100, 'iron_target_mg' => 10, 'zinc_target_mg' => 10,
            'calcium_target_mg' => 1000, 'b12_target_ug' => 4,
        ]);
        $meal = $user->meals()->create(['meal_date' => now()->toDateString(), 'type' => 'lunch']);
        $this->actingAs($user);
        $payload = ['food_key' => 'la-vie-tofu-fume', 'food_name' => 'Tofu fumé au bois de hêtre', 'weight_g' => 100];

        $this->post("/repas/{$meal->id}/ingredients", $payload)->assertSessionHasNoErrors();
        $first = $meal->items()->sole();
        $this->get("/repas/{$meal->id}")->assertInertia(fn (Assert $page) => $page
            ->where('intake.hasUnknownNutrients', false)
            ->where('intake.nutrients.0.percent', 43)
            ->where('intake.nutrients.1.percent', 57)
            ->where('intake.nutrients.2.percent', 1)
            ->where('intake.nutrients.3.percent', 18)
            ->where('intake.nutrients.4.percent', 40));

        $this->post("/repas/{$meal->id}/ingredients", $payload)->assertSessionHasNoErrors();
        $meal->refresh();
        $this->assertSame('29.800', $meal->protein_total_g);
        $this->assertSame('4.000', $meal->iron_total_mg);
        $this->assertSame('2.800', $meal->zinc_total_mg);
        $this->assertSame('124.000', $meal->calcium_total_mg);
        $this->assertSame('0.038', $meal->b12_total_ug);
        $this->get("/repas/{$meal->id}")->assertInertia(fn (Assert $page) => $page
            ->where('intake.nutrients.0.percent', 85)
            ->where('intake.nutrients.1.percent', 100)
            ->where('intake.nutrients.4.percent', 80));

        $this->patch("/repas/{$meal->id}/ingredients/{$first->id}", ['weight_g' => 50])->assertSessionHasNoErrors();
        $this->assertSame('22.350', $meal->fresh()->protein_total_g);
        $this->get("/repas/{$meal->id}")->assertInertia(fn (Assert $page) => $page
            ->where('intake.nutrients.0.percent', 64)
            ->where('intake.nutrients.4.percent', 60));

        $this->delete("/repas/{$meal->id}/ingredients/{$first->id}")->assertRedirect();
        $this->assertSame('14.900', $meal->fresh()->protein_total_g);
        $last = $meal->items()->sole();
        $this->delete("/repas/{$meal->id}/ingredients/{$last->id}")->assertRedirect();
        $meal->refresh();
        foreach (['protein_total_g', 'iron_total_mg', 'zinc_total_mg', 'calcium_total_mg', 'b12_total_ug'] as $column) {
            $this->assertSame('0.000', $meal->$column);
        }
        $this->get("/repas/{$meal->id}")->assertInertia(fn (Assert $page) => $page
            ->where('intake.percent', 0)
            ->where('intake.hasUnknownNutrients', false));
    }

    public function test_existing_items_are_counted_on_read_and_unknown_apports_are_marked(): void
    {
        $user = User::factory()->create(['protein_target_g' => 100, 'b12_target_ug' => 4]);
        $meal = $user->meals()->create(['meal_date' => now()->toDateString(), 'type' => 'lunch']);
        $meal->items()->create(['food_name' => 'Aliment connu', 'weight_g' => 100, 'protein_total_g' => 14]);
        $meal->items()->create(['food_name' => 'Aliment inconnu', 'weight_g' => 50]);
        $otherMeal = $user->meals()->create(['meal_date' => now()->toDateString(), 'type' => 'dinner']);
        $otherMeal->items()->create(['food_name' => 'Autre repas', 'weight_g' => 100, 'protein_total_g' => 500]);

        $this->actingAs($user)->get("/repas/{$meal->id}")->assertInertia(fn (Assert $page) => $page
            ->where('intake.nutrients.0.percent', 40)
            ->where('intake.hasUnknownNutrients', true));
    }
}
