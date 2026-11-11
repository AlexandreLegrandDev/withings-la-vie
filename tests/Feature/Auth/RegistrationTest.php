<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered()
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register()
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
            'protein_target_g' => null,
            'calcium_target_mg' => null,
            'transition_started_on' => null,
        ]);
        $this->assertDatabaseCount('weight_entries', 0);
    }

    public function test_new_users_can_register_with_a_complete_vegetarian_profile(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'diet_status' => 'vegetarian',
            'date_of_birth' => now()->subYears(30)->toDateString(),
            'sex' => 'female',
            'height_cm' => '170',
            'weight_kg' => '70',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('dashboard', absolute: false));
        $user = User::where('email', 'test@example.com')->firstOrFail();
        $this->assertAuthenticatedAs($user);
        $this->assertSame('vegetarian', $user->diet_status);
        $this->assertNull($user->transition_started_on);
        $this->assertSame('58.100', $user->protein_target_g);
        $this->assertSame('950.000', $user->calcium_target_mg);
        $this->assertDatabaseHas('weight_entries', [
            'user_id' => $user->id,
            'weight_kg' => 70,
        ]);
    }

    public function test_transition_start_date_is_saved_when_registering(): void
    {
        $this->travelTo(now()->setDate(2026, 11, 23));

        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'diet_status' => 'transition',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('dashboard', absolute: false));
        $user = User::where('email', 'test@example.com')->firstOrFail();
        $this->assertAuthenticatedAs($user);
        $this->assertSame('2026-11-23', $user->transition_started_on->toDateString());
    }
}
