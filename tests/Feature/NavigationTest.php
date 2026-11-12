<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NavigationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get('/')->assertRedirect('/login');
    }

    public function test_authenticated_users_can_visit_every_page()
    {
        $this->actingAs(User::factory()->create());

        foreach (['/', '/bilan', '/repas', '/suivi', '/suivi?periode=mois', '/profil', '/settings/profile', '/settings/password', '/settings/appearance'] as $url) {
            $this->get($url)->assertOk();
        }
    }
}
