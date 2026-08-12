<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workout_days', function (Blueprint $table) {
            $table->string('dia_semana')->nullable()->after('order');
        });
    }

    public function down(): void
    {
        Schema::table('workout_days', function (Blueprint $table) {
            $table->dropColumn('dia_semana');
        });
    }
};
