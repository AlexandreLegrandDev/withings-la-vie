<?php

namespace App\Http\Controllers;

use App\Services\NutritionTargetCalculator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $weights = $user->weightEntries()->orderByDesc('recorded_at')->orderByDesc('id')
            ->limit(60)->get()->reverse()->values();

        return Inertia::render('profile', [
            'profile' => [
                ...$user->only(['name', 'sex', 'diet_status', 'height_cm', 'protein_target_g', 'iron_target_mg',
                    'b12_target_ug', 'calcium_target_mg', 'zinc_target_mg']),
                'transition_days' => $user->diet_status === 'transition' && $user->transition_started_on
                    ? max(0, (int) $user->transition_started_on->diffInDays(today())) : null,
            ],
            'weights' => $weights->map(fn ($entry) => [
                'id' => $entry->id,
                'weight_kg' => (float) $entry->weight_kg,
                'recorded_at' => $entry->recorded_at->toIso8601String(),
            ]),
        ]);
    }

    /** Nouvelle pesée : ajoutée à l'historique, et le besoin en protéines (0,83 g/kg) suit le nouveau poids. */
    public function storeWeight(Request $request, NutritionTargetCalculator $calculator): RedirectResponse
    {
        $validated = $request->validate([
            'weight_kg' => ['required', 'numeric', 'decimal:0,2', 'min:20', 'max:300'],
        ]);

        $user = $request->user();
        DB::transaction(function () use ($user, $validated, $calculator) {
            $user->weightEntries()->create([
                'weight_kg' => $validated['weight_kg'],
                'recorded_at' => now(),
            ]);
            $calculator->refresh($user);
            $user->save();
        });

        return to_route('profile');
    }

    public function connectKitchenScale(Request $request): RedirectResponse
    {
        return $this->setKitchenScaleConnection($request, true);
    }

    public function disconnectKitchenScale(Request $request): RedirectResponse
    {
        return $this->setKitchenScaleConnection($request, false);
    }

    private function setKitchenScaleConnection(Request $request, bool $connected): RedirectResponse
    {
        $validated = $request->validate([
            // « back » : on reste sur la page en cours (ex. connexion pendant l'ajout d'un aliment)
            'return_to' => ['sometimes', Rule::in(['profile', 'meals', 'back'])],
        ]);

        $request->user()->update(['kitchen_scale_connected' => $connected]);

        $returnTo = $validated['return_to'] ?? 'profile';

        return $returnTo === 'back' ? back() : to_route($returnTo);
    }
}
