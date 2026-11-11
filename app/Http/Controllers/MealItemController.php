<?php

namespace App\Http\Controllers;

use App\Models\Meal;
use App\Models\MealItem;
use App\Services\FoodCatalogue;
use App\Services\ItemNutrientCalculator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Aliments d'un repas (« Dans l'assiette »).
 *
 * Les apports sont calculés depuis le catalogue JSON pour le poids de chaque portion.
 * L'agrégation des totaux du repas sera ajoutée séparément.
 */
class MealItemController extends Controller
{
    /** Page « Choisir un aliment » pour ce repas. */
    public function create(Request $request, Meal $meal, FoodCatalogue $catalogue): Response
    {
        abort_unless($meal->user_id === $request->user()->id, 404);

        $foods = collect($catalogue->all())->map(fn (array $food, string $key) => [
            'key' => $key,
            'name' => $food['name'],
            'category' => ($food['brand'] ?? null) === 'La Vie' ? 'la_vie' : 'base',
            'badge' => $food['brand'] ?? null,
            'nutrients' => '',
            'per100g' => collect(array_keys(ItemNutrientCalculator::FIELDS))
                ->mapWithKeys(fn ($field) => [$field => $food[$field] ?? null])->all(),
        ])->values();

        return Inertia::render('meals/add-food', [
            'meal' => ['id' => $meal->id, 'type' => $meal->type],
            // Les suggestions seront ajoutées ensuite.
            'suggestions' => [],
            'foods' => $foods,
        ]);
    }

    public function store(Request $request, Meal $meal, FoodCatalogue $catalogue, ItemNutrientCalculator $calculator): RedirectResponse
    {
        abort_unless($meal->user_id === $request->user()->id, 404);

        $validated = $request->validate([
            'food_key' => ['nullable', 'string', 'max:100', Rule::in(array_keys($catalogue->all()))],
            'food_name' => ['required', 'string', 'max:255'],
            'weight_g' => ['required', 'numeric', 'decimal:0,2', 'gt:0', 'max:5000'],
        ]);

        $key = $validated['food_key'] ?? $catalogue->keyForName($validated['food_name']);
        $food = $catalogue->find($key);
        $meal->items()->create([
            'food_key' => $key,
            'food_name' => $food['name'] ?? $validated['food_name'],
            'weight_g' => $validated['weight_g'],
            ...$calculator->calculate($food, (float) $validated['weight_g']),
        ]);
        // Le repas « bouge » : il redevient le repas en cours affiché sur l'accueil
        $meal->touch();

        // Retour sur la page du repas, où l'aliment apparaît dans « Dans l'assiette »
        return to_route('meals.show', $meal);
    }

    public function update(Request $request, Meal $meal, MealItem $item, FoodCatalogue $catalogue, ItemNutrientCalculator $calculator): RedirectResponse
    {
        abort_unless($meal->user_id === $request->user()->id && $item->meal_id === $meal->id, 404);

        $validated = $request->validate([
            'weight_g' => ['required', 'numeric', 'decimal:0,2', 'gt:0', 'max:5000'],
        ]);
        $key = $item->food_key ?? $catalogue->keyForName($item->food_name);
        $item->update([
            'weight_g' => $validated['weight_g'],
            'food_key' => $key,
            ...$calculator->calculate($catalogue->find($key), (float) $validated['weight_g']),
        ]);

        return back();
    }

    public function destroy(Request $request, Meal $meal, MealItem $item): RedirectResponse
    {
        abort_unless($meal->user_id === $request->user()->id && $item->meal_id === $meal->id, 404);

        $item->delete();

        return back();
    }
}
