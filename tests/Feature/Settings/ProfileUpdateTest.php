<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_becoming_vegetarian_clears_the_transition_date(): void
    {
        $user = User::factory()->create([
            'diet_status' => 'transition',
            'transition_started_on' => now()->subDays(10)->toDateString(),
        ]);

        $this->actingAs($user)->patch('/settings/profile', [
            'name' => $user->name, 'email' => $user->email, 'diet_status' => 'vegetarian',
        ])->assertSessionHasNoErrors()->assertRedirect('/settings/profile');

        $this->assertSame('vegetarian', $user->fresh()->diet_status);
        $this->assertNull($user->fresh()->transition_started_on);
    }

    public function test_starting_transition_sets_today_and_subsequent_saves_preserve_it(): void
    {
        $this->travelTo(now()->startOfSecond());
        $user = User::factory()->create(['diet_status' => 'vegetarian']);
        $payload = ['name' => $user->name, 'email' => $user->email, 'diet_status' => 'transition'];
        $startedOn = now('Europe/Paris')->toDateString();

        $this->actingAs($user)->patch('/settings/profile', $payload)->assertSessionHasNoErrors();
        $this->assertSame($startedOn, $user->fresh()->transition_started_on->toDateString());

        $this->travel(3)->days();
        $this->patch('/settings/profile', $payload)->assertSessionHasNoErrors();
        $this->assertSame($startedOn, $user->fresh()->transition_started_on->toDateString());
        $this->get('/profil')->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
            ->where('profile.transition_days', 3));
    }

    public function test_unknown_diet_status_is_rejected(): void
    {
        $user = User::factory()->create(['diet_status' => 'vegetarian']);
        $this->actingAs($user)->patch('/settings/profile', [
            'name' => $user->name, 'email' => $user->email, 'diet_status' => 'unknown',
        ])->assertSessionHasErrors('diet_status');
        $this->assertSame('vegetarian', $user->fresh()->diet_status);
    }

    public function test_profile_page_is_displayed()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get('/settings/profile');

        $response->assertOk();
    }

    public function test_profile_information_can_be_updated()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/settings/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/settings/profile');

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
        $this->assertNull($user->email_verified_at);
    }

    public function test_email_verification_status_is_unchanged_when_the_email_address_is_unchanged()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/settings/profile', [
                'name' => 'Test User',
                'email' => $user->email,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/settings/profile');

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_user_can_delete_their_account()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->delete('/settings/profile', [
                'password' => 'password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');

        $this->assertGuest();
        $this->assertNull($user->fresh());
    }

    public function test_correct_password_must_be_provided_to_delete_account()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/settings/profile')
            ->delete('/settings/profile', [
                'password' => 'wrong-password',
            ]);

        $response
            ->assertSessionHasErrors('password')
            ->assertRedirect('/settings/profile');

        $this->assertNotNull($user->fresh());
    }
}
