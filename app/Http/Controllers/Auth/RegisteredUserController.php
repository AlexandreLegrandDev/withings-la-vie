<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\NutritionTargetCalculator;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Vérifie l'étape 1 (prénom, email, mot de passe) avant de passer à la suite :
     * une erreur s'affiche tout de suite, et pas seulement à la fin de l'inscription.
     */
    public function validateCredentials(Request $request): RedirectResponse
    {
        $request->validate($this->credentialRules());

        return back();
    }

    public function store(Request $request, NutritionTargetCalculator $calculator): RedirectResponse
    {
        $validated = $request->validate([
            ...$this->credentialRules(),
            ...self::profileRules(),
            'diet_status' => ['required', Rule::in(['transition', 'vegetarian'])],
            'weight_kg' => ['required', 'numeric', 'decimal:0,2', 'min:20', 'max:300'],
        ]);

        $user = DB::transaction(function () use ($validated, $calculator) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'date_of_birth' => $validated['date_of_birth'],
                'sex' => $validated['sex'],
                'height_cm' => $validated['height_cm'],
                'diet_status' => $validated['diet_status'],
                'transition_started_on' => $validated['diet_status'] === 'transition' ? today()->toDateString() : null,
                ...$calculator->targets((float) $validated['weight_kg'], $validated['date_of_birth']),
            ]);

            $user->weightEntries()->create([
                'weight_kg' => $validated['weight_kg'],
                'recorded_at' => now(),
            ]);

            return $user;
        });

        event(new Registered($user));

        Auth::login($user);

        return to_route('today');
    }

    /** Sexe, date de naissance et taille : mêmes règles à l'inscription et dans les paramètres. */
    public static function profileRules(): array
    {
        return [
            'sex' => ['required', Rule::in(['female', 'male'])],
            'date_of_birth' => ['required', 'date_format:Y-m-d', 'after:1900-01-01', 'before_or_equal:today'],
            'height_cm' => ['required', 'integer', 'min:100', 'max:250'],
        ];
    }

    private function credentialRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            // Pas de champ « confirmer le mot de passe » : l'œil permet de vérifier ce qu'on tape.
            'password' => ['required', Rules\Password::defaults()],
        ];
    }
}
