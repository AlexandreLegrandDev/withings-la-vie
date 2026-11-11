<?php

namespace App\Http\Controllers;

use App\Models\Meal;
use App\Models\MealItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Aliments d'un repas (« Dans l'assiette »).
 *
 * Pour l'instant on n'enregistre que le nom et le poids : les apports de l'aliment (protéines, fer…)
 * viendront de l'API des aliments, qui devra aussi mettre à jour les totaux du repas (meals.*_total).
 */
class MealItemController extends Controller
{
    public function store(Request $request, Meal $meal): RedirectResponse
    {
        abort_unless($meal->user_id === $request->user()->id, 404);

        $validated = $request->validate([
            'food_name' => ['required', 'string', 'max:100'],
            'weight_g' => ['required', 'numeric', 'gt:0', 'max:5000'],
        ]);

        $meal->items()->create($validated);
        // Le repas « bouge » : il redevient le repas en cours affiché sur l'accueil
        $meal->touch();

        return back();
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
