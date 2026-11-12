<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TrackingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Jeudi 12 novembre 2026, midi à Paris : semaine du lundi 9 au dimanche 15
        Carbon::setTestNow(Carbon::create(2026, 11, 12, 12, 0, 0, 'Europe/Paris'));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function user(): User
    {
        return User::factory()->create(['protein_target_g' => 50, 'b12_target_ug' => 4]);
    }

    /** Repas avec un aliment, pour qu'il compte dans la série de jours suivis. */
    private function meal(User $user, string $date, array $totals = []): void
    {
        $user->meals()->create(['meal_date' => $date, 'type' => 'lunch', ...$totals])
            ->items()->create(['food_name' => 'Tofu', 'weight_g' => 100]);
    }

    public function test_week_view_has_one_bar_per_day_and_averages_past_days()
    {
        $user = $this->user();
        $this->meal($user, '2026-11-09', ['protein_total_g' => 50, 'b12_total_ug' => 4]); // lundi : 100 %
        $this->meal($user, '2026-11-11', ['protein_total_g' => 25]);                     // mercredi : 50 % prot., 0 % B12 → 25 %

        $this->actingAs($user)->get('/suivi')->assertInertia(fn (Assert $page) => $page
            ->component('tracking')
            ->where('period', 'week')
            ->where('start', '2026-11-09')
            ->where('end', '2026-11-15')
            ->has('bars', 7)
            ->where('bars.0', ['label' => 'L', 'date' => '2026-11-09', 'value' => 100, 'current' => false])
            ->where('bars.1.value', 0)  // mardi : rien de noté
            ->where('bars.2.value', 25)
            ->where('bars.3.current', true)
            ->where('bars.4.value', null) // vendredi : à venir
            // Les jours à 0 % (mardi, jeudi) ne comptent pas : (100 + 25) / 2
            ->where('average', 63)
            ->where('nutrients.0.key', 'protein')
            ->where('nutrients.0.percent', 75) // protéines : (100 + 50) / 2
            ->where('nutrients.1.percent', 50)
            ->where('previousDate', '2026-11-02')
            ->where('nextDate', null)
            // Mercredi suivi, rien jeudi : la série en cours compte encore 1 jour
            ->where('streak', 1)
        );
    }

    public function test_month_view_groups_days_by_week()
    {
        $this->actingAs($this->user())->get('/suivi?periode=mois')->assertInertia(fn (Assert $page) => $page
            ->where('period', 'month')
            ->where('start', '2026-11-01')
            ->where('end', '2026-11-30')
            // Novembre 2026 : dim. 1, puis 2–8, 9–15, 16–22, 23–29, lun. 30
            ->has('bars', 6)
            ->where('bars.0.label', '1')
            ->where('bars.2', ['label' => '9–15', 'date' => '2026-11-09', 'value' => 0, 'current' => true])
            ->where('average', null)
            ->where('bars.3.value', null)
        );
    }

    public function test_streak_counts_consecutive_tracked_days()
    {
        $user = $this->user();
        foreach (['2026-11-12', '2026-11-11', '2026-11-10', '2026-11-08'] as $date) {
            $this->meal($user, $date);
        }

        $this->actingAs($user)->get('/suivi')->assertInertia(fn (Assert $page) => $page->where('streak', 3));
    }

    public function test_a_past_week_can_be_opened()
    {
        $user = $this->user();
        $this->meal($user, '2026-11-03', ['protein_total_g' => 50, 'b12_total_ug' => 4]);

        $this->actingAs($user)->get('/suivi?date=2026-11-04')->assertInertia(fn (Assert $page) => $page
            ->where('start', '2026-11-02')
            ->where('bars.1.value', 100)
            ->where('bars.6.value', 0) // dimanche passé, pas « à venir »
            ->where('average', 100)
            ->where('nextDate', '2026-11-09')
        );

        $this->get('/suivi?date=2026-12-01')->assertSessionHasErrors('date');
    }

    public function test_day_summary_can_show_a_past_day_with_its_meals()
    {
        $user = $this->user();
        $this->meal($user, '2026-11-10', ['protein_total_g' => 25, 'b12_total_ug' => 4]);

        $this->actingAs($user)->get('/bilan?date=2026-11-10')->assertInertia(fn (Assert $page) => $page
            ->component('day-summary')
            ->where('date', '2026-11-10')
            ->where('isToday', false)
            ->where('intake.percent', 75)
            ->has('meals', 1)
            ->where('meals.0.type', 'lunch')
            ->where('meals.0.dayPercent', 75)
        );

        $this->get('/bilan?date=2026-11-20')->assertSessionHasErrors('date');
    }
}
