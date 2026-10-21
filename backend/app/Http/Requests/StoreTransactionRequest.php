<?php

namespace App\Http\Requests;

use App\Enums\TransactionType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTransactionRequest extends FormRequest
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
                'required',
                'integer',
                Rule::exists('categories', 'id')->where(fn ($query) => $query
                    ->where('user_id', $this->user()->id)
                    ->where('type', $this->string('type')->toString())),
            ],
            'amount_cents' => ['required', 'integer', 'min:1'],
            'type' => ['required', Rule::enum(TransactionType::class)],
            'occurred_on' => ['required', 'date_format:Y-m-d'],
            'description' => ['nullable', 'string', 'max:255'],
        ];
    }
}
