<?php

namespace App\Http\Controllers;

use App\Models\Meal;
use App\Models\MealItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Aliments d'un repas (« Dans l'assiette »).
 *
 * Pour l'instant on n'enregistre que le nom et le poids : les apports de l'aliment (protéines, fer…)
 * viendront de l'API des aliments, qui devra aussi mettre à jour les totaux du repas (meals.*_total).
 */
class MealItemController extends Controller
{
    /** Page « Choisir un aliment » pour ce repas. */
    public function create(Request $request, Meal $meal): Response
    {
        abort_unless($meal->user_id === $request->user()->id, 404);

        $catalogue = json_decode(file_get_contents(resource_path('data/catalogue-aliments.json')), true, 512, JSON_THROW_ON_ERROR);
        $foods = collect($catalogue)->map(fn (array $food, string $key) => [
            'key' => $key,
            'name' => $food['name'],
            'category' => ($food['brand'] ?? null) === 'La Vie' ? 'la_vie' : 'base',
            'badge' => $food['brand'] ?? null,
            'nutrients' => '',
        ])->values();

        return Inertia::render('meals/add-food', [
            'meal' => ['id' => $meal->id, 'type' => $meal->type],
            // Les suggestions et calculs nutritionnels seront ajoutés ensuite.
            'suggestions' => [],
            'foods' => $foods,
        ]);
    }

    public function store(Request $request, Meal $meal): RedirectResponse
    {
        abort_unless($meal->user_id === $request->user()->id, 404);

        $validated = $request->validate([
            'food_name' => ['required', 'string', 'max:255'],
            'weight_g' => ['required', 'numeric', 'gt:0', 'max:5000'],
        ]);

        $meal->items()->create($validated);
        // Le repas « bouge » : il redevient le repas en cours affiché sur l'accueil
        $meal->touch();

        // Retour sur la page du repas, où l'aliment apparaît dans « Dans l'assiette »
        return to_route('meals.show', $meal);
    }

    public function update(Request $request, Meal $meal, MealItem $item): RedirectResponse
    {
        abort_unless($meal->user_id === $request->user()->id && $item->meal_id === $meal->id, 404);

        $item->update($request->validate([
            'weight_g' => ['required', 'numeric', 'gt:0', 'max:5000'],
        ]));

        return back();
    }

    public function destroy(Request $request, Meal $meal, MealItem $item): RedirectResponse
    {
        abort_unless($meal->user_id === $request->user()->id && $item->meal_id === $meal->id, 404);

        $item->delete();

        return back();
    }
}
