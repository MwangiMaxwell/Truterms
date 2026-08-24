<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('analyses', function (Blueprint $table): void {
            $table->string('domain')->nullable()->after('url');
        });
    }

    public function down(): void
    {
        Schema::table('analyses', function (Blueprint $table): void {
            $table->dropColumn('domain');
        });
    }
};
