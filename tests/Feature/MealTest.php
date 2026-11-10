<?php

namespace Tests\Feature;

use App\Models\Meal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MealTest extends TestCase
{
    use RefreshDatabase;

    public function test_meals_page_lists_todays_meal_ids()
    {
        $user = User::factory()->create();
        $lunch = $user->meals()->create(['meal_date' => Carbon::today('Europe/Paris')->toDateString(), 'type' => 'lunch']);
        // Un repas d'un autre jour ne doit pas apparaître
        $user->meals()->create(['meal_date' => Carbon::today('Europe/Paris')->subDay()->toDateString(), 'type' => 'dinner']);

        $this->actingAs($user)->get('/repas')->assertInertia(fn (Assert $page) => $page
            ->component('meals')
            ->where('mealIds.lunch', $lunch->id)
            ->where('mealIds.breakfast', null)
            ->where('mealIds.dinner', null)
        );
    }

    public function test_clicking_a_meal_creates_it_once_and_opens_its_page()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/repas', ['type' => 'snack'])->assertRedirect();
        $meal = Meal::sole();
        $this->assertSame('snack', $meal->type);

        // Second clic : on retrouve le même repas au lieu d'en créer un autre
        $this->post('/repas', ['type' => 'snack'])->assertRedirect("/repas/{$meal->id}");
        $this->assertSame(1, Meal::count());

        $this->get("/repas/{$meal->id}")->assertInertia(fn (Assert $page) => $page
            ->component('meals/show')
            ->where('meal.type', 'snack')
        );
    }

    public function test_unknown_meal_type_is_rejected()
    {
        $this->actingAs(User::factory()->create())->post('/repas', ['type' => 'brunch'])->assertSessionHasErrors('type');
        $this->assertSame(0, Meal::count());
    }

    public function test_users_cannot_see_someone_elses_meal()
    {
        $meal = User::factory()->create()->meals()->create(['meal_date' => '2026-11-10', 'type' => 'lunch']);

        $this->actingAs(User::factory()->create())->get("/repas/{$meal->id}")->assertNotFound();
    }
}
