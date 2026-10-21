<?php

namespace App\Http\Requests;

use App\Enums\TransactionType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCategoryRequest extends FormRequest
{
    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('categories')->where(fn ($query) => $query
                    ->where('user_id', $this->user()->id)
                    ->where('type', $this->string('type')->toString())),
            ],
            'type' => ['required', Rule::enum(TransactionType::class)],
            'colour' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ];
    }
}
