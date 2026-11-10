<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('meal_date');
            // Allowed types: breakfast, lunch, snack, dinner.
            $table->string('type', 24);
            $table->timestamp('finished_at')->nullable();
            $table->decimal('protein_total_g', 10, 3)->nullable();
            $table->decimal('iron_total_mg', 10, 3)->nullable();
            $table->decimal('calcium_total_mg', 10, 3)->nullable();
            $table->decimal('zinc_total_mg', 10, 3)->nullable();
            $table->decimal('b12_total_ug', 10, 3)->nullable();
            $table->timestamps();

            // The unique index also covers queries on (user_id, meal_date).
            $table->unique(['user_id', 'meal_date', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meals');
    }
};
