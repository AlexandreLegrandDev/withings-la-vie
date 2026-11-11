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

    public function test_meal_page_compares_meal_totals_to_its_share_of_the_day()
    {
        $user = User::factory()->create(['protein_target_g' => 100, 'iron_target_mg' => 10]);
        // Déjeuner = 35 % du jour → objectifs du repas : 35 g de protéines, 3,5 mg de fer
        $meal = $user->meals()->create(['meal_date' => '2026-11-10', 'type' => 'lunch', 'protein_total_g' => 21, 'iron_total_mg' => 3.5]);
        $meal->items()->create(['food_name' => 'Lentilles cuites', 'weight_g' => 150, 'protein_total_g' => 21, 'iron_total_mg' => 3.5]);

        $this->actingAs($user)->get("/repas/{$meal->id}")->assertInertia(fn (Assert $page) => $page
            ->component('meals/show')
            ->where('meal.share', 35)
            ->has('intake.nutrients', 2)
            ->where('intake.nutrients.0.percent', 60)
            ->where('intake.nutrients.1.percent', 100)
            ->where('intake.missing', ['des protéines'])
            ->where('items.0.food_name', 'Lentilles cuites')
            ->where('suggestions', [])
        );
    }

    public function test_add_food_page_is_only_for_the_meal_owner()
    {
        $user = User::factory()->create();
        $meal = $user->meals()->create(['meal_date' => '2026-11-10', 'type' => 'lunch']);

        $this->actingAs($user)->get("/repas/{$meal->id}/ingredients/ajouter")->assertInertia(fn (Assert $page) => $page
            ->component('meals/add-food')
            ->where('meal.id', $meal->id)
            ->has('foods', count(json_decode(file_get_contents(resource_path('data/catalogue-aliments.json')), true, 512, JSON_THROW_ON_ERROR)))
            ->where('foods.0.key', 'la-vie-lardons')
            ->where('foods.0.name', 'Lardons végétaux')
            ->where('foods.0.category', 'la_vie')
            ->where('foods.0.badge', 'La Vie')
        );

        $this->actingAs(User::factory()->create())->get("/repas/{$meal->id}/ingredients/ajouter")->assertNotFound();
    }

    public function test_catalogue_ingredients_with_long_names_can_be_added(): void
    {
        $catalogue = json_decode(file_get_contents(resource_path('data/catalogue-aliments.json')), true, 512, JSON_THROW_ON_ERROR);
        $food = collect($catalogue)->first(fn ($entry) => mb_strlen($entry['name']) > 100);
        $this->assertNotNull($food);
        $user = User::factory()->create();
        $meal = $user->meals()->create(['meal_date' => '2026-11-11', 'type' => 'lunch']);

        $this->actingAs($user)->post("/repas/{$meal->id}/ingredients", [
            'food_name' => $food['name'], 'weight_g' => 150,
        ])->assertSessionHasNoErrors()->assertRedirect("/repas/{$meal->id}");

        $this->assertDatabaseHas('meal_items', [
            'meal_id' => $meal->id, 'food_name' => $food['name'], 'weight_g' => 150,
        ]);
    }

    public function test_foods_can_be_added_and_removed()
    {
        $user = User::factory()->create();
        $meal = $user->meals()->create(['meal_date' => '2026-11-10', 'type' => 'lunch']);

        $this->actingAs($user)->post("/repas/{$meal->id}/ingredients", ['food_name' => 'Tofu', 'weight_g' => 100])
            ->assertRedirect("/repas/{$meal->id}");
        $item = $meal->items()->sole();
        $this->assertSame('Tofu', $item->food_name);

        $this->delete("/repas/{$meal->id}/ingredients/{$item->id}")->assertRedirect();
        $this->assertSame(0, $meal->items()->count());
    }

    public function test_food_needs_a_name_and_a_positive_weight()
    {
        $user = User::factory()->create();
        $meal = $user->meals()->create(['meal_date' => '2026-11-10', 'type' => 'lunch']);

        $this->actingAs($user)->post("/repas/{$meal->id}/ingredients", ['food_name' => '', 'weight_g' => 0])
            ->assertSessionHasErrors(['food_name', 'weight_g']);
    }

    public function test_users_cannot_add_food_to_someone_elses_meal()
    {
        $meal = User::factory()->create()->meals()->create(['meal_date' => '2026-11-10', 'type' => 'lunch']);

        $this->actingAs(User::factory()->create())->post("/repas/{$meal->id}/ingredients", ['food_name' => 'Tofu', 'weight_g' => 100])
            ->assertNotFound();
    }

    public function test_finishing_a_meal()
    {
        $user = User::factory()->create();
        $meal = $user->meals()->create(['meal_date' => '2026-11-10', 'type' => 'lunch']);

        $this->actingAs($user)->post("/repas/{$meal->id}/terminer")->assertRedirect('/repas');
        $this->assertNotNull($meal->fresh()->finished_at);
    }

    public function test_users_cannot_see_someone_elses_meal()
    {
        $meal = User::factory()->create()->meals()->create(['meal_date' => '2026-11-10', 'type' => 'lunch']);

        $this->actingAs(User::factory()->create())->get("/repas/{$meal->id}")->assertNotFound();
    }
}
