<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Plusieurs collations par jour : on retire l'unicité (utilisateur, jour, type). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('meals', function (Blueprint $table) {
            // L'index simple est créé avant de retirer l'unique : MySQL en a besoin pour la clé étrangère user_id.
            $table->index(['user_id', 'meal_date']);
            $table->dropUnique(['user_id', 'meal_date', 'type']);
        });
    }

    public function down(): void
    {
        Schema::table('meals', function (Blueprint $table) {
            $table->unique(['user_id', 'meal_date', 'type']);
            $table->dropIndex(['user_id', 'meal_date']);
        });
    }
};
