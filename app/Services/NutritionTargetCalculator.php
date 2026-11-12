<?php

namespace App\Services;

use App\Models\User;
use Carbon\CarbonImmutable;

/** Besoins journaliers de l'utilisateur (repères ANSES / EFSA). */
class NutritionTargetCalculator
{
    /** Besoins fixes, identiques pour tout le monde. */
    public const IRON_MG = 11;

    public const ZINC_MG = 11;

    public const B12_UG = 4;

    /** Protéines : 0,83 g par kg de poids corporel. */
    public function protein(float $weightKg): float
    {
        return round($weightKg * 0.83, 3);
    }

    /** Calcium selon l'âge : null pour un mineur (pas de repère adulte), 1000 mg avant 25 ans, 950 mg ensuite. */
    public function calcium(string $birthDate): ?int
    {
        $age = CarbonImmutable::parse($birthDate)->diff(CarbonImmutable::today());

        if ($age->invert || $age->y < 18) {
            return null;
        }

        return $age->y < 25 ? 1000 : 950;
    }

    /**
     * Tous les besoins pour un poids et une date de naissance donnés.
     *
     * @return array<string, float|int|null> colonnes *_target de users
     */
    public function targets(?float $weightKg, ?string $birthDate): array
    {
        return [
            'protein_target_g' => $weightKg !== null ? $this->protein($weightKg) : null,
            'iron_target_mg' => self::IRON_MG,
            'calcium_target_mg' => $birthDate !== null ? $this->calcium($birthDate) : null,
            'zinc_target_mg' => self::ZINC_MG,
            'b12_target_ug' => self::B12_UG,
        ];
    }

    /** Recalcule les besoins qui dépendent du profil (protéines ← dernier poids, calcium ← âge). Sans sauvegarder. */
    public function refresh(User $user): void
    {
        $weight = $user->weightEntries()->orderByDesc('recorded_at')->orderByDesc('id')->value('weight_kg');

        // Sans poids ou sans date de naissance connus, on garde le besoin déjà enregistré
        if ($weight !== null) {
            $user->protein_target_g = $this->protein((float) $weight);
        }
        if ($user->date_of_birth) {
            $user->calcium_target_mg = $this->calcium($user->date_of_birth->toDateString());
        }
    }
}
