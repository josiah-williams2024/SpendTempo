<?php

namespace App\Http\Requests;

use App\Enums\TransactionType;
use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateTransactionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'category_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('categories', 'id')->where('user_id', $this->user()->id),
            ],
            'amount_cents' => ['sometimes', 'required', 'integer', 'min:1'],
            'type' => ['sometimes', 'required', Rule::enum(TransactionType::class)],
            'occurred_on' => ['sometimes', 'required', 'date_format:Y-m-d'],
            'description' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }

    /** @return array<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->hasAny(['category_id', 'type'])) {
                    return;
                }

                $transaction = $this->transaction();
                $categoryId = $this->integer('category_id') ?: $transaction->category_id;
                $type = $this->input('type', $transaction->type->value);
                $categoryMatches = Category::query()
                    ->whereBelongsTo($this->user())
                    ->whereKey($categoryId)
                    ->where('type', $type)
                    ->exists();

                if (! $categoryMatches) {
                    $validator->errors()->add('category_id', 'The selected category must match the transaction type.');
                }
            },
        ];
    }

    private function transaction(): Transaction
    {
        return $this->user()->transactions()->findOrFail($this->route('transaction'));
    }
}
