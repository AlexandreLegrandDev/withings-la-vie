<?php

namespace App\Services;

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
}
