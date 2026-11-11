<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MealItem extends Model
{
    protected $fillable = [
        'meal_id', 'food_key', 'food_name', 'weight_g',
        'protein_total_g', 'iron_total_mg', 'zinc_total_mg', 'calcium_total_mg', 'b12_total_ug',
    ];

    protected function casts(): array
    {
        return [
            'weight_g' => 'decimal:2',
            'protein_total_g' => 'decimal:3',
            'iron_total_mg' => 'decimal:3',
            'zinc_total_mg' => 'decimal:3',
            'calcium_total_mg' => 'decimal:3',
            'b12_total_ug' => 'decimal:3',
        ];
    }

    public function meal(): BelongsTo
    {
        return $this->belongsTo(Meal::class);
    }
}
