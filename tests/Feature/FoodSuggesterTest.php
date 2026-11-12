<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\FoodSuggester;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FoodSuggesterTest extends TestCase
{
    use RefreshDatabase;

    public function test_no_meat_fish_or_spice_is_ever_suggested(): void
    {
        $user = User::factory()->create([
            'protein_target_g' => 60, 'iron_target_mg' => 11, 'b12_target_ug' => 4, 'zinc_target_mg' => 11, 'calcium_target_mg' => 950,
        ]);

        // Journée vide et limite très haute : on récupère tous les aliments que le service accepte de proposer
        $names = collect(app(FoodSuggester::class)->forDay($user, today()->toDateString(), 5000))->pluck('name');

        $this->assertGreaterThan(50, $names->count());
        // Les produits végétaux (« Bacon végétal », « Steak de soja ») ont le droit de porter un nom de viande
        $animalNames = $names->reject(fn ($name) => preg_match('/(?<!\pL)(végéta(l|le|les|ux)|soja|tofu)(?!\pL)/iu', $name));
        foreach ($animalNames as $name) {
            $this->assertDoesNotMatchRegularExpression(
                '/(?<!\pL)(bœuf|boeuf|veau|porc|poulet|dinde|canard|agneau|jambon|lardons?|bacon|saucisses?|pâtés?|foie|viande|poissons?|thon|saumon|cabillaud|sardines?|crevettes?|moules?|cumin|curcuma|thym)(?!\pL)/iu',
                $name,
                "« {$name} » ne devrait pas être suggéré",
            );
        }
        $this->assertTrue($names->contains('Bacon végétal'));
    }
}
