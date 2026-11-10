<?php

namespace App\Services;

use DateTimeImmutable;

class NutritionTargetCalculator
{
    public function protein(float $weightKg): float
    {
        return round($weightKg * 0.83, 3);
    }

    public function calcium(string $birthDate): ?int
    {
        $dateOfBirth = new DateTimeImmutable($birthDate);
        $age = $dateOfBirth->diff(new DateTimeImmutable('today'));

        if ($age->invert || $age->y < 18) {
            return null;
        }

        return $age->y < 25 ? 1000 : 950;
    }
}

?>