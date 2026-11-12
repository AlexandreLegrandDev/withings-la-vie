<?php

use App\Http\Controllers\MealController;
use App\Http\Controllers\MealItemController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TodayController;
use App\Http\Controllers\TrackingController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/', [TodayController::class, 'index'])->name('today');
    Route::get('bilan', [TodayController::class, 'summary'])->name('today.summary');

    Route::get('repas', [MealController::class, 'index'])->name('meals');
    Route::post('repas', [MealController::class, 'store'])->name('meals.store');
    Route::get('repas/{meal}', [MealController::class, 'show'])->whereNumber('meal')->name('meals.show');
    Route::post('repas/{meal}/terminer', [MealController::class, 'finish'])->name('meals.finish');

    Route::get('repas/{meal}/ingredients/ajouter', [MealItemController::class, 'create'])->name('meals.items.create');
    Route::post('repas/{meal}/ingredients', [MealItemController::class, 'store'])->name('meals.items.store');
    Route::patch('repas/{meal}/ingredients/{item}', [MealItemController::class, 'update'])->name('meals.items.update');
    Route::delete('repas/{meal}/ingredients/{item}', [MealItemController::class, 'destroy'])->name('meals.items.destroy');

    Route::get('suivi', [TrackingController::class, 'index'])->name('tracking');

    Route::get('profil', [ProfileController::class, 'index'])->name('profile');
    Route::post('profil/poids', [ProfileController::class, 'storeWeight'])->name('profile.weight.store');
    Route::post('profil/balance-cuisine/connecter', [ProfileController::class, 'connectKitchenScale'])->name('profile.kitchen-scale.connect');
    Route::post('profil/balance-cuisine/deconnecter', [ProfileController::class, 'disconnectKitchenScale'])->name('profile.kitchen-scale.disconnect');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
