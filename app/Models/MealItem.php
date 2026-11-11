<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MealItem extends Model
{
    protected $fillable = ['meal_id', 'food_name', 'weight_g'];

    protected function casts(): array
    {
        return [
            'weight_g' => 'decimal:2',
        ];
    }

    public function meal(): BelongsTo
    {
        return $this->belongsTo(Meal::class);
    }
}
