<?php

namespace App\Http\Controllers;

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
