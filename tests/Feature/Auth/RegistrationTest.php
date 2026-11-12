<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'diet_status' => 'vegetarian',
            'date_of_birth' => now()->subYears(30)->toDateString(),
            'sex' => 'female',
            'height_cm' => '170',
            'weight_kg' => '70',
            ...$overrides,
        ];
    }

    public function test_registration_screen_can_be_rendered()
    {
        $this->get('/register')->assertStatus(200);
    }

    public function test_new_users_can_register_with_a_complete_vegetarian_profile(): void
    {
        $response = $this->post('/register', $this->payload());

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('today', absolute: false));
        $user = User::where('email', 'test@example.com')->firstOrFail();
        $this->assertAuthenticatedAs($user);
        $this->assertSame('vegetarian', $user->diet_status);
        $this->assertNull($user->transition_started_on);
        $this->assertSame('58.100', $user->protein_target_g);
        $this->assertSame('950.000', $user->calcium_target_mg);
        $this->assertSame('11.000', $user->iron_target_mg);
        $this->assertDatabaseHas('weight_entries', ['user_id' => $user->id, 'weight_kg' => 70]);
    }

    public function test_transition_start_date_is_saved_when_registering(): void
    {
        $this->travelTo(now()->setDate(2026, 11, 23));

        $this->post('/register', $this->payload(['diet_status' => 'transition']))->assertSessionHasNoErrors();

        $user = User::where('email', 'test@example.com')->firstOrFail();
        $this->assertSame('2026-11-23', $user->transition_started_on->toDateString());
    }

    public function test_profile_fields_are_required(): void
    {
        $this->post('/register', $this->payload(['sex' => '', 'weight_kg' => '', 'diet_status' => '']))
            ->assertSessionHasErrors(['sex', 'weight_kg', 'diet_status']);
        $this->assertGuest();
    }

    public function test_first_step_is_checked_before_going_further(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        // Mot de passe trop court et email déjà pris : erreurs dès l'étape 1, en français
        $this->from('/register')->post('/register/identifiants', [
            'name' => 'Test', 'email' => 'taken@example.com', 'password' => 'court',
        ])->assertRedirect('/register')->assertSessionHasErrors([
            'email' => 'Cette adresse email est déjà utilisée.',
            'password' => 'Ton mot de passe doit contenir au moins 8 caractères.',
        ]);

        $this->from('/register')->post('/register/identifiants', [
            'name' => 'Test', 'email' => 'new@example.com', 'password' => 'password',
        ])->assertRedirect('/register')->assertSessionHasNoErrors();

        // Rien n'est créé tant que l'inscription n'est pas terminée
        $this->assertDatabaseMissing('users', ['email' => 'new@example.com']);
        $this->assertGuest();
    }
}
