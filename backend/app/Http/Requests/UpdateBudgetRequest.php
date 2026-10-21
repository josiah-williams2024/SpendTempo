<?php

namespace App\Http\Requests;

use App\Models\Budget;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateBudgetRequest extends FormRequest
{
    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'daily_limit_cents' => ['sometimes', 'required', 'integer', 'min:1'],
            'starts_on' => ['sometimes', 'required', 'date_format:Y-m-d'],
            'ends_on' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
        ];
    }

    /** @return array<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->hasAny(['starts_on', 'ends_on'])) {
                    return;
                }

                $budget = $this->budget();
                $startsOn = CarbonImmutable::parse($this->input('starts_on', $budget->starts_on));
                $endsOnInput = $this->exists('ends_on') ? $this->input('ends_on') : $budget->ends_on;

                if ($endsOnInput !== null && CarbonImmutable::parse($endsOnInput)->isBefore($startsOn)) {
                    $validator->errors()->add('ends_on', 'The ends on field must be a date after or equal to starts on.');
                }
            },
        ];
    }

    private function budget(): Budget
    {
        return $this->user()->budgets()->findOrFail($this->route('budget'));
    }
}
