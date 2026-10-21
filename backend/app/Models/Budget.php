<?php

namespace App\Models;

use Database\Factories\BudgetFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['daily_limit_cents', 'starts_on', 'ends_on'])]
class Budget extends Model
{
    /** @use HasFactory<BudgetFactory> */
    use HasFactory;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return [
            'daily_limit_cents' => 'integer',
            'starts_on' => 'date',
            'ends_on' => 'date',
        ];
    }
}
