<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'date_of_birth',
        'sex',
        'height_cm',
        'diet_status',
        'transition_started_on',
        'protein_target_g',
        'iron_target_mg',
        'calcium_target_mg',
        'zinc_target_mg',
        'b12_target_ug',
        'b12_reminder_interval_days',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'date_of_birth' => 'date',
            'height_cm' => 'integer',
            'transition_started_on' => 'date',
            'protein_target_g' => 'decimal:3',
            'iron_target_mg' => 'decimal:3',
            'calcium_target_mg' => 'decimal:3',
            'zinc_target_mg' => 'decimal:3',
            'b12_target_ug' => 'decimal:3',
            'b12_reminder_interval_days' => 'integer',
        ];
    }

    public function meals(): HasMany
    {
        return $this->hasMany(Meal::class);
    }

    public function weightEntries(): HasMany
    {
        return $this->hasMany(WeightEntry::class);
    }
}
