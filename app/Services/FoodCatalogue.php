<?php

namespace App\Services;

/** Catalogue des aliments (resources/data/catalogue-aliments.json), valeurs pour 100 g. */
class FoodCatalogue
{
    private ?array $foods = null;

    public function all(): array
    {
        return $this->foods ??= json_decode(
            file_get_contents(resource_path('data/catalogue-aliments.json')),
            true, 512, JSON_THROW_ON_ERROR,
        );
    }

    public function find(?string $key): ?array
    {
        return $key === null ? null : ($this->all()[$key] ?? null);
    }

    public function keyForName(string $name): ?string
    {
        foreach ($this->all() as $key => $food) {
            if ($food['name'] === $name) {
                return (string) $key;
            }
        }

        return null;
    }

    /** Apports pour 100 g d'un aliment, avec les clés de ItemNutrientCalculator::FIELDS (null = inconnu). */
    public static function per100g(array $food): array
    {
        return collect(array_keys(ItemNutrientCalculator::FIELDS))
            ->mapWithKeys(fn ($field) => [$field => $food[$field] ?? null])
            ->all();
    }

    /** Nutriments dont la valeur n'est pas mesurée mais estimée à partir d'aliments Ciqual proches. */
    public static function estimatedFields(array $food): array
    {
        return array_keys($food['estimated_from_ciqual'] ?? []);
    }

    public static function isLaVie(array $food): bool
    {
        return ($food['brand'] ?? null) === 'La Vie';
    }
}
