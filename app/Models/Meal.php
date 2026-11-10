<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Meal extends Model
{
    public const TYPES = ['breakfast', 'lunch', 'snack', 'dinner'];

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
}
