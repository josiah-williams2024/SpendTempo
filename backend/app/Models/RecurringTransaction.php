<?php

namespace App\Models;

use App\Enums\RecurrenceFrequency;
use App\Enums\TransactionType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['category_id', 'amount_cents', 'type', 'description', 'frequency', 'starts_on', 'ends_on', 'next_occurrence_on', 'active'])]
class RecurringTransaction extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    protected function casts(): array
    {
        return [
            'amount_cents' => 'integer',
            'type' => TransactionType::class,
            'frequency' => RecurrenceFrequency::class,
            'starts_on' => 'date',
            'ends_on' => 'date',
            'next_occurrence_on' => 'date',
            'active' => 'boolean',
        ];
    }
}
