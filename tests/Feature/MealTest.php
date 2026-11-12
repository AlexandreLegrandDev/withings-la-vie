<?php

namespace Tests\Feature;

use App\Models\Meal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MealTest extends TestCase
{
    use RefreshDatabase;

    public function test_meals_page_lists_todays_meals_with_their_real_share_of_the_day()
    {
        $user = User::factory()->create(['protein_target_g' => 100, 'iron_target_mg' => 10]);
        // 30 g de protéines (30 %) et 5 mg de fer (50 %) → ce déjeuner couvre 40 % de la journée
        $lunch = $user->meals()->create(['meal_date' => today()->toDateString(), 'type' => 'lunch', 'protein_total_g' => 30, 'iron_total_mg' => 5]);
        // Un repas d'un autre jour ne doit pas apparaître
        $user->meals()->create(['meal_date' => today()->subDay()->toDateString(), 'type' => 'dinner']);

        $this->actingAs($user)->get('/repas')->assertInertia(fn (Assert $page) => $page
            ->component('meals')
            ->has('meals', 1)
            ->where('meals.0.id', $lunch->id)
            ->where('meals.0.status', 'in_progress')
            ->where('meals.0.share', 35)
            ->where('meals.0.dayPercent', 40)
            ->where('shares.breakfast', 25)
        );
    }

    public function test_clicking_a_meal_creates_it_once_and_opens_its_page()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/repas', ['type' => 'lunch'])->assertRedirect();
        $meal = Meal::sole();
        $this->assertSame('lunch', $meal->type);

        // Second clic : on retrouve le même repas au lieu d'en créer un autre
        $this->post('/repas', ['type' => 'lunch'])->assertRedirect("/repas/{$meal->id}");
        $this->assertSame(1, Meal::count());

        $this->get("/repas/{$meal->id}")->assertInertia(fn (Assert $page) => $page
            ->component('meals/show')
            ->where('meal.type', 'lunch')
            ->where('meal.isToday', true)
        );
    }

    public function test_several_snacks_can_be_added_and_share_the_snack_part_of_the_day()
    {
        $user = User::factory()->create(['protein_target_g' => 100]);
        $this->actingAs($user);

        $this->post('/repas', ['type' => 'snack']);
        $this->post('/repas', ['type' => 'snack']); // reprend la première collation
        $this->assertSame(1, $user->meals()->count());

        $this->post('/repas', ['type' => 'snack', 'new' => true]);
        $this->post('/repas', ['type' => 'lunch', 'new' => true]); // « new » ne vaut que pour les collations
        $this->post('/repas', ['type' => 'lunch']);
        $this->assertSame(2, $user->meals()->where('type', 'snack')->count());
        $this->assertSame(1, $user->meals()->where('type', 'lunch')->count());

        $second = $user->meals()->where('type', 'snack')->latest('id')->first();
        $this->get('/repas')->assertInertia(fn (Assert $page) => $page
            ->has('meals', 3)
            ->where('meals.0.type', 'lunch')
            ->where('meals.1.number', 1)
            ->where('meals.2.number', 2)
            ->where('meals.2.share', 5) // les 10 % des collations sont partagés
        );
        $this->get("/repas/{$second->id}")->assertInertia(fn (Assert $page) => $page
            ->where('meal.number', 2)
            ->where('meal.share', 5)
            ->where('intake.nutrients.0.target', 5)
        );
        $this->get('/')->assertInertia(fn (Assert $page) => $page->has('currentMeal.number'));
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
        $meal = $user->meals()->create(['meal_date' => '2026-11-10', 'type' => 'lunch', 'protein_total_g' => 21, 'iron_total_mg' => 7]);
        $meal->items()->create(['food_name' => 'Lentilles cuites', 'weight_g' => 150, 'protein_total_g' => 21, 'iron_total_mg' => 7]);

        $this->actingAs($user)->get("/repas/{$meal->id}")->assertInertia(fn (Assert $page) => $page
            ->component('meals/show')
            ->where('meal.share', 35)
            ->where('meal.isToday', false)
            ->has('intake.nutrients', 2)
            ->where('intake.nutrients.0.percent', 60)
            // Fer : 7 mg pour 3,5 mg prévus → plafonné à 100 pour l'avancement, 200 % affichés
            ->where('intake.nutrients.1.percent', 100)
            ->where('intake.nutrients.1.actualPercent', 200)
            ->where('intake.missing', ['des protéines'])
            // Part réelle de la journée : protéines 21 %, fer 70 % → 46 %
            ->where('intake.dayPercent', 46)
            ->where('items.0.food_name', 'Lentilles cuites')
        );
    }

    public function test_suggestions_fill_the_days_gaps_with_vegetarian_foods()
    {
        $user = User::factory()->create(['protein_target_g' => 60, 'iron_target_mg' => 11, 'b12_target_ug' => 4, 'zinc_target_mg' => 11, 'calcium_target_mg' => 950]);
        $meal = $user->meals()->create(['meal_date' => today()->toDateString(), 'type' => 'lunch']);

        $this->actingAs($user)->get("/repas/{$meal->id}")->assertInertia(function (Assert $page) {
            $page->has('suggestions', 3);
            $suggestions = $page->toArray()['props']['suggestions'];
            $this->assertNotEmpty(array_filter($suggestions, fn ($s) => $s['badge'] === 'La Vie'));
            foreach ($suggestions as $suggestion) {
                $this->assertDoesNotMatchRegularExpression('/\b(boeuf|bœuf|poulet|porc|thon|saumon|poisson)\b/iu', $suggestion['name']);
                $this->assertSame(100, $suggestion['weight_g']);
                $this->assertStringStartsWith('+', $suggestion['benefits']);
            }
        });

        // Les mêmes aliments sont proposés sur « Choisir un aliment », où une suggestion peut être présélectionnée
        $this->get("/repas/{$meal->id}/ingredients/ajouter?aliment=la-vie-tofu-fume")->assertInertia(fn (Assert $page) => $page
            ->has('suggestions', 3)
            ->where('preselected', 'la-vie-tofu-fume'));
        $this->get("/repas/{$meal->id}/ingredients/ajouter?aliment=inconnu")->assertInertia(fn (Assert $page) => $page
            ->where('preselected', null));
    }

    public function test_no_suggestions_once_the_day_is_complete()
    {
        $user = User::factory()->create(['protein_target_g' => 10, 'iron_target_mg' => null, 'b12_target_ug' => null, 'zinc_target_mg' => null, 'calcium_target_mg' => null]);
        $meal = $user->meals()->create(['meal_date' => today()->toDateString(), 'type' => 'lunch', 'protein_total_g' => 12]);

        $this->actingAs($user)->get("/repas/{$meal->id}")->assertInertia(fn (Assert $page) => $page->where('suggestions', []));
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
            ->where('foods.0.estimated', ['iron_mg', 'zinc_mg', 'calcium_mg'])
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
