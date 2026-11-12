<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

class Meal extends Model
{
    public const TYPES = ['breakfast', 'lunch', 'snack', 'dinner'];

    /** Seul type de repas qu'on peut ajouter plusieurs fois dans la journée. */
    public const REPEATABLE_TYPE = 'snack';

    /** Part des besoins du jour prévue pour chaque type de repas, en %. Les collations du jour se partagent leur part. */
    public const SHARES = ['breakfast' => 25, 'lunch' => 35, 'snack' => 10, 'dinner' => 30];

    protected $fillable = [
        'user_id', 'meal_date', 'type', 'finished_at',
        'protein_total_g', 'iron_total_mg', 'calcium_total_mg',
        'zinc_total_mg', 'b12_total_ug',
    ];

    protected function casts(): array
    {
        return [
            'meal_date' => 'date',
            'finished_at' => 'datetime',
            'protein_total_g' => 'decimal:3',
            'iron_total_mg' => 'decimal:3',
            'calcium_total_mg' => 'decimal:3',
            'zinc_total_mg' => 'decimal:3',
            'b12_total_ug' => 'decimal:3',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(MealItem::class);
    }

    /** Part prévue d'un repas, en % des besoins du jour, quand $sameTypeCount repas de ce type existent ce jour-là. */
    public static function plannedShare(string $type, int $sameTypeCount = 1): float
    {
        return round(self::SHARES[$type] / max(1, $sameTypeCount), 1);
    }

    /**
     * Repas d'un utilisateur pour un jour, dans l'ordre d'affichage, avec leur numéro
     * (« Collation 2 ») et leur part prévue. Le numéro vaut null quand le type n'est présent qu'une fois.
     *
     * @return Collection<int, array{meal: Meal, number: int|null, share: float}>
     */
    public static function forDay(User $user, string $date): Collection
    {
        $meals = $user->meals()->whereDate('meal_date', $date)->orderBy('id')->get()->each->setRelation('user', $user);
        $counts = $meals->countBy('type');
        $seen = [];

        return $meals
            ->sortBy(fn (Meal $meal) => array_search($meal->type, self::TYPES, true))
            ->values()
            ->map(function (Meal $meal) use ($counts, &$seen) {
                $seen[$meal->type] = ($seen[$meal->type] ?? 0) + 1;

                return [
                    'meal' => $meal,
                    'number' => $counts[$meal->type] > 1 ? $seen[$meal->type] : null,
                    'share' => self::plannedShare($meal->type, $counts[$meal->type]),
                ];
            });
    }
}
