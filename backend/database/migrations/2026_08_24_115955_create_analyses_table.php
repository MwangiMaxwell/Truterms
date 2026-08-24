<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('analyses', function (Blueprint $table) {
        $table->id();

        $table->string('url')->nullable();
        $table->string('title')->nullable();

        $table->string('document_type')->nullable();
        $table->string('overall_risk')->nullable();

        $table->text('summary')->nullable();

        $table->json('results')->nullable();

        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('analyses');
    }
};
