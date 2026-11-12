<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CompleteOnboardingRequest extends FormRequest
{
    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'currency' => ['required', 'string', Rule::in(['CAD', 'USD', 'EUR', 'GBP', 'AUD'])],
            'daily_limit_cents' => ['required', 'integer', 'min:1', 'max:100000000'],
        ];
    }
}
