<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Données en dur pour démarrer : à remplacer par des modèles Eloquent (Ingredient, Recipe…).
    Route::get('pesee', function () {
        return Inertia::render('weighing', [
            'ingredients' => [
                ['id' => 1, 'name' => 'Riz basmati cru', 'per100g' => ['kcal' => 350, 'proteins' => 8, 'carbs' => 78, 'fats' => 0.6]],
                ['id' => 2, 'name' => 'Blanc de poulet', 'per100g' => ['kcal' => 110, 'proteins' => 23, 'carbs' => 0, 'fats' => 1.5]],
                ['id' => 3, 'name' => 'Brocoli', 'per100g' => ['kcal' => 34, 'proteins' => 2.8, 'carbs' => 7, 'fats' => 0.4]],
                ['id' => 4, 'name' => 'Huile d\'olive', 'per100g' => ['kcal' => 900, 'proteins' => 0, 'carbs' => 0, 'fats' => 100]],
            ],
        ]);
    })->name('weighing');

    Route::get('journal', function () {
        return Inertia::render('journal');
    })->name('journal');

    Route::get('recettes', function () {
        return Inertia::render('recipes', [
            'recipes' => [
                ['id' => 1, 'title' => 'Poulet, riz et brocoli', 'description' => 'Le classique équilibré.', 'kcal' => 520],
                ['id' => 2, 'title' => 'Salade de lentilles', 'description' => 'Riche en fibres et en protéines végétales.', 'kcal' => 430],
            ],
        ]);
    })->name('recipes');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
