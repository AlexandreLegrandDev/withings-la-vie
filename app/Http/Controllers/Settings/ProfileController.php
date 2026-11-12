<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Services\NutritionTargetCalculator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /** Paramètres du compte : prénom, email, régime, sexe, date de naissance et taille. */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('settings/profile', [
            'account' => [
                ...$user->only(['name', 'email', 'diet_status', 'sex', 'height_cm']),
                'date_of_birth' => $user->date_of_birth?->toDateString(),
            ],
        ]);
    }

    public function update(ProfileUpdateRequest $request, NutritionTargetCalculator $calculator): RedirectResponse
    {
        $user = $request->user();
        $user->fill($request->validated());

        if ($user->isDirty('diet_status')) {
            $user->transition_started_on = $user->diet_status === 'transition' ? today()->toDateString() : null;
        }

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        // Le besoin en calcium dépend de l'âge
        if ($user->isDirty('date_of_birth')) {
            $calculator->refresh($user);
        }

        $user->save();

        return to_route('profile.edit');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
