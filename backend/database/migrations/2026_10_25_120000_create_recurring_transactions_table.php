<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurring_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->unsignedBigInteger('amount_cents');
            $table->string('type', 20);
            $table->string('description')->nullable();
            $table->string('frequency', 20);
            $table->date('starts_on');
            $table->date('ends_on')->nullable();
            $table->date('next_occurrence_on');
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['user_id', 'active', 'next_occurrence_on']);
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->foreignId('recurring_transaction_id')->nullable()->after('category_id')
                ->constrained()->nullOnDelete();
            $table->unique(['recurring_transaction_id', 'occurred_on']);
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropUnique(['recurring_transaction_id', 'occurred_on']);
            $table->dropConstrainedForeignId('recurring_transaction_id');
        });

        Schema::dropIfExists('recurring_transactions');
    }
};
