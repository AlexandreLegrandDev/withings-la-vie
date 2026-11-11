<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
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
                ...$user->only(['name', 'sex', 'diet_status', 'protein_target_g', 'iron_target_mg',
                    'b12_target_ug', 'calcium_target_mg', 'zinc_target_mg']),
                'transition_weeks' => $user->transition_started_on
                    ? max(0, (int) $user->transition_started_on->diffInWeeks(now())) : null,
            ],
            'weights' => $weights->map(fn ($entry) => [
                'id' => $entry->id,
                'weight_kg' => (float) $entry->weight_kg,
                'recorded_at' => $entry->recorded_at->toIso8601String(),
            ]),
        ]);
    }
}
