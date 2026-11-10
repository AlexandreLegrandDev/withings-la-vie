<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->date('date_of_birth')->nullable();
            $table->string('sex', 24)->nullable();
            $table->unsignedSmallInteger('height_cm')->nullable();
            $table->string('diet_status', 24)->nullable();
            $table->date('transition_started_on')->nullable();
            $table->decimal('protein_target_g', 10, 3)->nullable();
            $table->decimal('iron_target_mg', 10, 3)->nullable();
            $table->decimal('calcium_target_mg', 10, 3)->nullable();
            $table->decimal('zinc_target_mg', 10, 3)->nullable();
            $table->decimal('b12_target_ug', 10, 3)->nullable();
            $table->unsignedSmallInteger('b12_reminder_interval_days')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'date_of_birth', 'sex', 'height_cm', 'diet_status',
                'transition_started_on', 'protein_target_g', 'iron_target_mg',
                'calcium_target_mg', 'zinc_target_mg', 'b12_target_ug',
                'b12_reminder_interval_days',
            ]);
        });
    }
};
