<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_scale_can_be_connected_and_disconnected_from_both_pages(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $this->actingAs($user);

        foreach (['profile', 'meals'] as $returnTo) {
            $this->post(route('profile.kitchen-scale.connect'), ['return_to' => $returnTo])
                ->assertSessionHasNoErrors()->assertRedirect(route($returnTo));
            $this->assertTrue($user->fresh()->kitchen_scale_connected);
            $this->get('/repas')->assertInertia(fn (Assert $page) => $page
                ->where('auth.user.kitchen_scale_connected', true));

            $this->post(route('profile.kitchen-scale.disconnect'), [
                'return_to' => $returnTo, 'user_id' => $other->id,
            ])->assertSessionHasNoErrors()->assertRedirect(route($returnTo));
            $this->assertFalse($user->fresh()->kitchen_scale_connected);
            $this->get('/profil')->assertInertia(fn (Assert $page) => $page
                ->where('auth.user.kitchen_scale_connected', false));
            $this->get('/repas')->assertInertia(fn (Assert $page) => $page
                ->where('auth.user.kitchen_scale_connected', false));
        }

        $this->assertFalse($other->fresh()->kitchen_scale_connected);
    }

    public function test_disconnect_only_changes_the_authenticated_account(): void
    {
        $user = User::factory()->create();
        $user->kitchen_scale_connected = true;
        $user->save();
        $other = User::factory()->create();
        $other->kitchen_scale_connected = true;
        $other->save();

        $this->actingAs($user)->post(route('profile.kitchen-scale.disconnect'), ['user_id' => $other->id])
            ->assertRedirect(route('profile'));
        $this->assertFalse($user->fresh()->kitchen_scale_connected);
        $this->assertTrue($other->fresh()->kitchen_scale_connected);
    }

    public function test_guests_cannot_disconnect_a_kitchen_scale(): void
    {
        $this->post(route('profile.kitchen-scale.disconnect'))->assertRedirect(route('login'));
    }

    public function test_kitchen_scale_is_disconnected_by_default(): void
    {
        $user = User::factory()->create()->fresh();
        $this->assertFalse($user->kitchen_scale_connected);
        $this->actingAs($user)->get('/profil')->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.kitchen_scale_connected', false));
    }

    public function test_connecting_a_kitchen_scale_only_updates_the_authenticated_account(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        $this->actingAs($user)->post(route('profile.kitchen-scale.connect'), ['user_id' => $other->id])
            ->assertSessionHasNoErrors()->assertRedirect(route('profile'));

        $this->assertTrue($user->fresh()->kitchen_scale_connected);
        $this->assertFalse($other->fresh()->kitchen_scale_connected);
        $this->get('/profil')->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.kitchen_scale_connected', true));

        $this->post(route('profile.kitchen-scale.connect'))->assertRedirect(route('profile'));
        $this->assertTrue($user->fresh()->kitchen_scale_connected);
    }

    public function test_guests_cannot_connect_a_kitchen_scale(): void
    {
        $this->post(route('profile.kitchen-scale.connect'))->assertRedirect(route('login'));
    }

    public function test_updating_weight_adds_a_new_entry_for_the_authenticated_user_at_the_current_time(): void
    {
        $this->travelTo(now()->startOfSecond());
        $user = User::factory()->create();
        $other = User::factory()->create();
        $previous = $user->weightEntries()->create(['weight_kg' => 70, 'recorded_at' => now()->subDay()]);

        $this->actingAs($user)->post(route('profile.weight.store'), [
            'weight_kg' => '69.25',
            'user_id' => $other->id,
            'recorded_at' => '2000-01-01 00:00:00',
        ])->assertSessionHasNoErrors()->assertRedirect(route('profile'));

        $this->assertDatabaseCount('weight_entries', 2);
        $this->assertSame('70.00', $previous->fresh()->weight_kg);
        $latest = $user->weightEntries()->orderByDesc('recorded_at')->firstOrFail();
        $this->assertSame('69.25', $latest->weight_kg);
        $this->assertTrue($latest->recorded_at->equalTo(now()));
        $this->assertSame(0, $other->weightEntries()->count());
        $this->get('/profil')->assertInertia(fn (Assert $page) => $page
            ->where('weights.1.weight_kg', 69.25));
    }

    public function test_invalid_weights_are_not_recorded(): void
    {
        $this->actingAs(User::factory()->create());

        foreach ([null, 0, -1, 500.01, 'not-a-weight', '70.123'] as $weight) {
            $this->post(route('profile.weight.store'), ['weight_kg' => $weight])
                ->assertSessionHasErrors('weight_kg');
        }

        $this->assertDatabaseCount('weight_entries', 0);
    }

    public function test_guests_cannot_record_a_weight(): void
    {
        $this->post(route('profile.weight.store'), ['weight_kg' => 70])->assertRedirect(route('login'));
        $this->assertDatabaseCount('weight_entries', 0);
    }

    public function test_profile_only_shows_the_authenticated_users_weights_in_date_order(): void
    {
        $this->travelTo(Carbon::parse('2026-11-11 12:00:00', 'Europe/Paris'));
        $user = User::factory()->create([
            'diet_status' => 'transition',
            'transition_started_on' => now()->subWeeks(3)->toDateString(),
            'protein_target_g' => 51,
        ]);
        $user->weightEntries()->create(['weight_kg' => 61.2, 'recorded_at' => now()]);
        $user->weightEntries()->create(['weight_kg' => 62, 'recorded_at' => now()->subWeeks(8)]);
        User::factory()->create()->weightEntries()->create(['weight_kg' => 90, 'recorded_at' => now()]);

        $this->actingAs($user)->get('/profil')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('profile')
            ->where('profile.name', $user->name)
            ->where('profile.transition_days', 21)
            ->where('profile.protein_target_g', '51.000')
            ->has('weights', 2)
            ->where('weights.0.weight_kg', 62)
            ->where('weights.1.weight_kg', 61.2));
    }

    public function test_profile_can_be_viewed_without_profile_details_or_weights(): void
    {
        $this->actingAs(User::factory()->create())->get('/profil')
            ->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('profile')
            ->where('profile.transition_days', null)
            ->has('weights', 0));
    }

    public function test_a_new_weight_updates_the_protein_target(): void
    {
        $user = User::factory()->create(['protein_target_g' => 58.1, 'calcium_target_mg' => 950]);

        $this->actingAs($user)->post(route('profile.weight.store'), ['weight_kg' => 80])->assertSessionHasNoErrors();

        // 80 kg × 0,83 g/kg
        $this->assertSame('66.400', $user->fresh()->protein_target_g);
        $this->assertSame('950.000', $user->fresh()->calcium_target_mg);
    }
}
