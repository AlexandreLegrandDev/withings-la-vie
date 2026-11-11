<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_only_shows_the_authenticated_users_weights_in_date_order(): void
    {
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
            ->where('profile.transition_weeks', 3)
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
                ->where('profile.transition_weeks', null)
                ->has('weights', 0));
    }
}
