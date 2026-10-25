<?php

namespace App\Http\Requests;

use App\Enums\RecurrenceFrequency;
use App\Enums\TransactionType;
use App\Models\Category;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreRecurringTransactionRequest extends FormRequest
{
    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'category_id' => ['required', 'integer', Rule::exists('categories', 'id')->where('user_id', $this->user()->id)],
            'amount_cents' => ['required', 'integer', 'min:1'],
            'type' => ['required', Rule::enum(TransactionType::class)],
            'description' => ['nullable', 'string', 'max:255'],
            'frequency' => ['required', Rule::enum(RecurrenceFrequency::class)],
            'starts_on' => ['required', 'date_format:Y-m-d'],
            'ends_on' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:starts_on'],
        ];
    }

    /** @return array<callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->hasAny(['category_id', 'type'])) {
                return;
            }

            $matches = Category::query()
                ->whereBelongsTo($this->user())
                ->whereKey($this->integer('category_id'))
                ->where('type', $this->string('type')->toString())
                ->exists();

            if (! $matches) {
                $validator->errors()->add('category_id', 'The selected category must match the transaction type.');
            }
        }];
    }
}
