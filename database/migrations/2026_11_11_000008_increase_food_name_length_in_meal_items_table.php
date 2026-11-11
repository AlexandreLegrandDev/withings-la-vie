<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('meal_items', function (Blueprint $table) {
            $table->string('food_name', 255)->change();
        });
    }

    public function down(): void
    {
        Schema::table('meal_items', function (Blueprint $table) {
            $table->string('food_name', 100)->change();
        });
    }
};
