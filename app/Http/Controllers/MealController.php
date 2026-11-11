<?php

namespace App\Http\Controllers;

use App\Models\Meal;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MealController extends Controller
{
    /** Fuseau utilisé pour savoir quel jour on est (l'appli stocke en UTC, mais « aujourd'hui » est celui de la France). */
    private const TIMEZONE = 'Europe/Paris';

    /** Page Repas : les 4 repas du jour, avec l'id de ceux qui existent déjà en base (null sinon). */
    public function index(Request $request): Response
    {
        $meals = $request->user()->meals()
            ->whereDate('meal_date', $this->today())
            ->get(['id', 'type', 'created_at', 'finished_at'])
            ->keyBy('type');

        return Inertia::render('meals', [
            // Ex. { breakfast: 12, lunch: null, snack: null, dinner: null }
            'mealIds' => collect(Meal::TYPES)->mapWithKeys(fn ($type) => [$type => $meals->get($type)?->id]),
            'mealDates' => collect(Meal::TYPES)->mapWithKeys(fn ($type) => [
                $type => [
                    'created_at' => $meals->get($type)?->created_at,
                    'finished_at' => $meals->get($type)?->finished_at,
                ],
            ]),
        ]);
    }

    /** Clic sur un repas pas encore créé : crée le repas du jour de ce type (ou le reprend s'il existe), puis ouvre sa page. */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(Meal::TYPES)],
        ]);

        $meals = $request->user()->meals();
        $attributes = ['meal_date' => $this->today(), 'type' => $validated['type']];

        // whereDate : retrouve le repas quel que soit le format de date stocké (« 2026-11-10 » ou « 2026-11-10 00:00:00 »)
        $meal = $meals->clone()->whereDate('meal_date', $attributes['meal_date'])->where('type', $attributes['type'])->first()
            ?? $meals->create($attributes);

        return to_route('meals.show', $meal);
    }

    /** Page d'un repas précis (/repas/{id}). */
    public function show(Request $request, Meal $meal): Response
    {
        // Un utilisateur ne peut voir que ses propres repas
        abort_unless($meal->user_id === $request->user()->id, 404);

        return Inertia::render('meals/show', [
            'meal' => [
                'id' => $meal->id,
                'type' => $meal->type,
                'date' => $meal->meal_date->toDateString(),
                'finished_at' => $meal->finished_at,
            ],
        ]);
    }

    private function today(): string
    {
        return Carbon::today(self::TIMEZONE)->toDateString();
    }
}
