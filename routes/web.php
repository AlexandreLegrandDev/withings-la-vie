<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Les pages de l'appli, réservées aux utilisateurs connectés.
// Route::inertia(URL, page React) affiche resources/js/pages/<page>.tsx.
// Quand une page aura besoin de données, on passera à Route::get(...) + Inertia::render(page, [données]).
Route::middleware(['auth'])->group(function () {
    Route::inertia('/', 'today')->name('today');
    Route::inertia('repas', 'meals')->name('meals');
    Route::inertia('suivi', 'tracking')->name('tracking');
    Route::inertia('profil', 'profile')->name('profile');

    // Le starter kit redirige vers « dashboard » après la connexion : on renvoie vers l'accueil.
    Route::redirect('dashboard', '/')->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
