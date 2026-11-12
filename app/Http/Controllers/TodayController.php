<?php

namespace App\Http\Controllers;

use App\Models\Meal;
use App\Services\DailyIntake;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class TodayController extends Controller
{
    /** Page d'accueil « Aujourd'hui » : avancement du jour, apports par nutriment et repas en cours. */
    public function index(Request $request, DailyIntake $dailyIntake): Response
    {
        $user = $request->user();
        $today = today()->toDateString();

        // Repas en cours = repas du jour commencé mais pas encore terminé (le plus récemment modifié s'il y en a plusieurs)
        $current = Meal::forDay($user, $today)
            ->reject(fn (array $entry) => $entry['meal']->finished_at !== null)
            ->sortByDesc(fn (array $entry) => $entry['meal']->updated_at)
            ->first();

        return Inertia::render('today', [
            'date' => $today,
            'intake' => $dailyIntake->forUser($user, $today),
            'currentMeal' => $current ? [
                'id' => $current['meal']->id,
                'type' => $current['meal']->type,
                'number' => $current['number'],
                'items_count' => $current['meal']->items()->count(),
            ] : null,
        ]);
    }

    /**
     * Page « Bilan de la journée » (/bilan, ou /bilan?date=AAAA-MM-JJ pour un jour passé, depuis la page Suivi) :
     * chaque nutriment du jour, atteint ou non, et les repas de ce jour.
     */
    public function summary(Request $request, DailyIntake $dailyIntake): Response
    {
        $request->validate(['date' => ['sometimes', 'date_format:Y-m-d', 'before_or_equal:today']]);

        $user = $request->user();
        $date = Carbon::parse($request->query('date', today()->toDateString()))->toDateString();

        return Inertia::render('day-summary', [
            'date' => $date,
            'isToday' => $date === today()->toDateString(),
            'intake' => $dailyIntake->forUser($user, $date),
            'meals' => Meal::forDay($user, $date)->map(fn (array $entry) => MealController::summary($entry, $dailyIntake))->values(),
        ]);
    }
}
