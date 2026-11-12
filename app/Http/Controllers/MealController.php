<?php

namespace App\Http\Controllers;

use App\Models\Meal;
use App\Services\DailyIntake;
use App\Services\FoodSuggester;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MealController extends Controller
{
    /** Page Repas : les repas du jour déjà commencés, avec leur part prévue et leur part réelle de la journée. */
    public function index(Request $request, DailyIntake $dailyIntake): Response
    {
        $user = $request->user();

        return Inertia::render('meals', [
            'meals' => Meal::forDay($user, today()->toDateString())
                ->map(fn (array $entry) => self::summary($entry, $dailyIntake))
                ->values(),
            'shares' => Meal::SHARES,
        ]);
    }

    /**
     * Clic sur un repas pas encore créé : crée le repas du jour de ce type (ou reprend celui qui existe), puis ouvre sa page.
     * Avec « new », une collation supplémentaire est créée même s'il y en a déjà une.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(Meal::TYPES)],
            'new' => ['sometimes', 'boolean'],
        ]);

        $meals = $request->user()->meals();
        $attributes = ['meal_date' => today()->toDateString(), 'type' => $validated['type']];
        $addAnother = $validated['type'] === Meal::REPEATABLE_TYPE && ($validated['new'] ?? false);

        $meal = $addAnother ? null : $meals->clone()
            ->whereDate('meal_date', $attributes['meal_date'])
            ->where('type', $attributes['type'])
            ->orderBy('id')
            ->first();

        return to_route('meals.show', $meal ?? $meals->create($attributes));
    }

    /** Page d'un repas précis (/repas/{id}). */
    public function show(Request $request, Meal $meal, DailyIntake $dailyIntake, FoodSuggester $suggester): Response
    {
        abort_unless($meal->user_id === $request->user()->id, 404);

        $date = $meal->meal_date->toDateString();
        $entry = Meal::forDay($request->user(), $date)->firstWhere('meal.id', $meal->id);
        $day = $dailyIntake->forUser($request->user(), $date);

        return Inertia::render('meals/show', [
            'meal' => [
                'id' => $meal->id,
                'type' => $meal->type,
                'number' => $entry['number'],
                'date' => $date,
                'isToday' => $date === today()->toDateString(),
                'finished_at' => $meal->finished_at,
                'share' => $entry['share'],
            ],
            // Apports du repas comparés à sa part prévue (anneaux), et part réelle de la journée (dayPercent)
            'intake' => $dailyIntake->forMeal($meal, $entry['share']),
            // Aliments déjà dans l'assiette, du plus ancien au plus récent
            'items' => $meal->items()->oldest()->get(['id', 'food_key', 'food_name', 'weight_g']),
            // Nutriments les moins couverts de la journée, et aliments qui les comblent
            'dayMissing' => $day['missing'],
            'suggestions' => $suggester->forIntake($day),
        ]);
    }

    /** Bouton « Terminer » : le repas est marqué comme fini, puis retour à la liste des repas. */
    public function finish(Request $request, Meal $meal): RedirectResponse
    {
        abort_unless($meal->user_id === $request->user()->id, 404);

        $meal->update(['finished_at' => now()]);

        return to_route('meals');
    }

    /** Résumé d'un repas pour les listes (page Repas, bilan d'un jour). */
    public static function summary(array $entry, DailyIntake $dailyIntake): array
    {
        /** @var Meal $meal */
        $meal = $entry['meal'];

        return [
            'id' => $meal->id,
            'type' => $meal->type,
            'number' => $entry['number'],
            'status' => $meal->finished_at ? 'done' : 'in_progress',
            'share' => $entry['share'],
            'dayPercent' => $dailyIntake->dayPercent($meal, $meal->user),
        ];
    }
}
