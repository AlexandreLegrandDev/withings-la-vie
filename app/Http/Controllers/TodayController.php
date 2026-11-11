<?php

namespace App\Http\Controllers;

use App\Services\DailyIntake;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class TodayController extends Controller
{
    /** Page « Bilan de la journée » : chaque nutriment du jour, atteint ou non (ouverte depuis la carte « Ta journée »). */
    public function summary(Request $request, DailyIntake $dailyIntake): Response
    {
        $today = Carbon::today(MealController::TIMEZONE)->toDateString();

        return Inertia::render('day-summary', [
            'intake' => $dailyIntake->forUser($request->user(), $today),
        ]);
    }

    /** Page d'accueil « Aujourd'hui » : avancement du jour, apports par nutriment et repas en cours. */
    public function index(Request $request, DailyIntake $dailyIntake): Response
    {
        $user = $request->user();
        $today = Carbon::today(MealController::TIMEZONE)->toDateString();

        // Repas en cours = repas du jour commencé mais pas encore terminé (le plus récent s'il y en a plusieurs)
        $currentMeal = $user->meals()
            ->whereDate('meal_date', $today)
            ->whereNull('finished_at')
            ->withCount('items')
            ->latest('updated_at')
            ->first();

        return Inertia::render('today', [
            'date' => $today,
            'intake' => $dailyIntake->forUser($user, $today),
            'currentMeal' => $currentMeal ? [
                'id' => $currentMeal->id,
                'type' => $currentMeal->type,
                'items_count' => $currentMeal->items_count,
            ] : null,
        ]);
    }
}
