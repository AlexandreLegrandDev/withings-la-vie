<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TodayTest extends TestCase
{
    use RefreshDatabase;

    private function userWithTargets(): User
    {
        return User::factory()->create([
            'protein_target_g' => 50,
            'iron_target_mg' => 10,
            'b12_target_ug' => 4,
            'calcium_target_mg' => null, // pas de besoin : le calcium ne doit pas s'afficher
            'zinc_target_mg' => 10,
        ]);
    }

    public function test_home_sums_todays_meals_against_targets()
    {
        $user = $this->userWithTargets();
        $today = Carbon::today('Europe/Paris')->toDateString();

        $user->meals()->create(['meal_date' => $today, 'type' => 'breakfast', 'finished_at' => now(),
            'protein_total_g' => 20, 'iron_total_mg' => 2, 'zinc_total_mg' => 10]);
        $lunch = $user->meals()->create(['meal_date' => $today, 'type' => 'lunch',
            'protein_total_g' => 10, 'iron_total_mg' => 1]);
        // Un repas d'hier ne compte pas
        $user->meals()->create(['meal_date' => Carbon::today('Europe/Paris')->subDay()->toDateString(), 'type' => 'dinner',
            'protein_total_g' => 100, 'b12_total_ug' => 100]);

        $this->actingAs($user)->get('/')->assertInertia(fn (Assert $page) => $page
            ->component('today')
            ->where('date', $today)
            ->has('intake.nutrients', 4)
            // Protéines 30/50 = 60 %, fer 3/10 = 30 %, B12 0 %, zinc 100 % → moyenne 47,5 → 48
            ->where('intake.nutrients.0.key', 'protein')
            ->where('intake.nutrients.0.percent', 60)
            ->where('intake.percent', 48)
            ->where('intake.missing', ['de la B12', 'du fer'])
            ->where('currentMeal.id', $lunch->id)
            ->where('currentMeal.items_count', 0)
        );
    }

    public function test_home_without_meals_starts_at_zero()
    {
        $this->actingAs($this->userWithTargets())->get('/')->assertInertia(fn (Assert $page) => $page
            ->where('intake.percent', 0)
            ->where('currentMeal', null)
        );
    }
}
