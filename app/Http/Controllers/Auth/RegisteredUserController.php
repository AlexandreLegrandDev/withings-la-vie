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
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            // Pas de champ « confirmer le mot de passe » sur la maquette : l'œil permet de vérifier ce qu'on tape.
            'password' => ['required', Rules\Password::defaults()],
            'date_of_birth' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:today'],
            'sex' => ['nullable', 'string', 'max:24'],
            'height_cm' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'diet_status' => ['nullable', 'string', 'max:24'],
            'transition_started_on' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:today'],
            'protein_target_g' => ['nullable', 'numeric', 'decimal:0,3', 'min:0', 'max:9999999.999'],
            'iron_target_mg' => ['nullable', 'numeric', 'decimal:0,3', 'min:0', 'max:9999999.999'],
            'calcium_target_mg' => ['nullable', 'numeric', 'decimal:0,3', 'min:0', 'max:9999999.999'],
            'zinc_target_mg' => ['nullable', 'numeric', 'decimal:0,3', 'min:0', 'max:9999999.999'],
            'b12_target_ug' => ['nullable', 'numeric', 'decimal:0,3', 'min:0', 'max:9999999.999'],
            'b12_reminder_interval_days' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'weight_kg' => ['nullable', 'numeric', 'decimal:0,2', 'gt:0', 'max:9999.99'],
        ]);

        $transition_started_on = ($validated['diet_status'] ?? null) === 'transition'
            ? now()->toDateString()
            : null;

        $calculator = new NutritionTargetCalculator();

        $targets = [
            'protein_target_g' => isset($validated['weight_kg'])
                ? $calculator->protein((float) $validated['weight_kg'])
                : null,
            'calcium_target_mg' => isset($validated['date_of_birth'])
                ? $calculator->calcium($validated['date_of_birth'])
                : null,
        ];

        $protein_target_g = $targets['protein_target_g'];
        $iron_target_mg = 11;
        $calcium_target_mg = $targets['calcium_target_mg'];
        $zinc_target_mg = 11;
        $b12_target_ug = 4;


        $user = DB::transaction(function () use (
            $validated,
            $protein_target_g,
            $iron_target_mg,
            $calcium_target_mg,
            $zinc_target_mg,
            $b12_target_ug,
            $transition_started_on,
        ) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'date_of_birth' => $validated['date_of_birth'] ?? null,
                'sex' => $validated['sex'] ?? null,
                'height_cm' => $validated['height_cm'] ?? null,
                'diet_status' => $validated['diet_status'] ?? null,
                'transition_started_on' => $transition_started_on ?? null,
                'protein_target_g' => $protein_target_g ?? null,
                'iron_target_mg' => $iron_target_mg ?? null,
                'calcium_target_mg' => $calcium_target_mg ?? null,
                'zinc_target_mg' => $zinc_target_mg ?? null,
                'b12_target_ug' => $b12_target_ug ?? null,
                'b12_reminder_interval_days' => $validated['b12_reminder_interval_days'] ?? null,
            ]);

            if (isset($validated['weight_kg'])) {
                $user->weightEntries()->create([
                    'weight_kg' => $validated['weight_kg'],
                    'recorded_at' => now(),
                ]);
            }

            return $user;
        });

        event(new Registered($user));

        Auth::login($user);

        return to_route('dashboard');
    }
}
