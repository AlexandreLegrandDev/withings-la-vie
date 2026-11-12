<?php

namespace App\Http\Controllers;

use App\Models\Meal;
use App\Models\MealItem;
use App\Services\FoodCatalogue;
use App\Services\FoodSuggester;
use App\Services\ItemNutrientCalculator;
use App\Services\MealNutrientCalculator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Aliments d'un repas (« Dans l'assiette »).
 *
 * Les apports sont calculés depuis le catalogue JSON pour le poids de chaque portion.
 * Les totaux du repas sont synchronisés après chaque modification de l'assiette.
 */
class MealItemController extends Controller
{
    /** Page « Choisir un aliment » pour ce repas (?aliment=clé : aliment déjà choisi, depuis une suggestion). */
    public function create(Request $request, Meal $meal, FoodCatalogue $catalogue, FoodSuggester $suggester): Response
    {
        abort_unless($meal->user_id === $request->user()->id, 404);

        $foods = collect($catalogue->all())->map(fn (array $food, string $key) => [
            'key' => $key,
            'name' => $food['name'],
            'category' => FoodCatalogue::isLaVie($food) ? 'la_vie' : 'base',
            'badge' => $food['brand'] ?? null,
            'per100g' => FoodCatalogue::per100g($food),
            'estimated' => FoodCatalogue::estimatedFields($food),
        ])->values();

        $preselected = $request->query('aliment');

        return Inertia::render('meals/add-food', [
            'meal' => ['id' => $meal->id, 'type' => $meal->type],
            'suggestions' => $suggester->forDay($request->user(), $meal->meal_date->toDateString()),
            'foods' => $foods,
            'preselected' => is_string($preselected) && $catalogue->find($preselected) ? $preselected : null,
        ]);
    }

    public function store(Request $request, Meal $meal, FoodCatalogue $catalogue, ItemNutrientCalculator $calculator, MealNutrientCalculator $mealCalculator): RedirectResponse
    {
        abort_unless($meal->user_id === $request->user()->id, 404);

        $validated = $request->validate([
            'food_key' => ['nullable', 'string', 'max:100', Rule::in(array_keys($catalogue->all()))],
            'food_name' => ['required', 'string', 'max:255'],
            'weight_g' => ['required', 'numeric', 'decimal:0,2', 'gt:0', 'max:5000'],
        ]);

        $key = $validated['food_key'] ?? $catalogue->keyForName($validated['food_name']);
        $food = $catalogue->find($key);
        DB::transaction(function () use ($meal, $key, $food, $validated, $calculator, $mealCalculator) {
            // Sérialise les modifications de l'assiette pour conserver des totaux cohérents.
            $lockedMeal = $meal->newQuery()->whereKey($meal->id)->lockForUpdate()->firstOrFail();
            $meal->items()->create([
                'food_key' => $key,
                'food_name' => $food['name'] ?? $validated['food_name'],
                'weight_g' => $validated['weight_g'],
                ...$calculator->calculate($food, (float) $validated['weight_g']),
            ]);
            $mealCalculator->sync($lockedMeal);
        });

        // Retour sur la page du repas, où l'aliment apparaît dans « Dans l'assiette »
        return to_route('meals.show', $meal);
    }

    public function update(Request $request, Meal $meal, MealItem $item, FoodCatalogue $catalogue, ItemNutrientCalculator $calculator, MealNutrientCalculator $mealCalculator): RedirectResponse
    {
        abort_unless($meal->user_id === $request->user()->id && $item->meal_id === $meal->id, 404);

        $validated = $request->validate([
            'weight_g' => ['required', 'numeric', 'decimal:0,2', 'gt:0', 'max:5000'],
        ]);
        $key = $item->food_key ?? $catalogue->keyForName($item->food_name);
        DB::transaction(function () use ($meal, $item, $validated, $key, $catalogue, $calculator, $mealCalculator) {
            $lockedMeal = $meal->newQuery()->whereKey($meal->id)->lockForUpdate()->firstOrFail();
            $item->update([
                'weight_g' => $validated['weight_g'],
                'food_key' => $key,
                ...$calculator->calculate($catalogue->find($key), (float) $validated['weight_g']),
            ]);
            $mealCalculator->sync($lockedMeal);
        });

        return back();
    }

    public function destroy(Request $request, Meal $meal, MealItem $item, MealNutrientCalculator $mealCalculator): RedirectResponse
    {
        abort_unless($meal->user_id === $request->user()->id && $item->meal_id === $meal->id, 404);

        DB::transaction(function () use ($meal, $item, $mealCalculator) {
            $lockedMeal = $meal->newQuery()->whereKey($meal->id)->lockForUpdate()->firstOrFail();
            $item->delete();
            $mealCalculator->sync($lockedMeal);
        });

        return back();
    }
}
