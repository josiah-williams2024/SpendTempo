<?php

namespace App\Http\Requests;

use App\Enums\TransactionType;
use App\Models\Category;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateCategoryRequest extends FormRequest
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
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:100',
            ],
            'type' => ['sometimes', 'required', Rule::enum(TransactionType::class)],
            'colour' => ['sometimes', 'required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ];
    }

    /** @return array<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->hasAny(['name', 'type'])) {
                    return;
                }

                $category = $this->category();
                $duplicateExists = $this->user()->categories()
                    ->whereKeyNot($category->id)
                    ->where('name', $this->input('name', $category->name))
                    ->where('type', $this->input('type', $category->type->value))
                    ->exists();

                if ($duplicateExists) {
                    $validator->errors()->add('name', 'The name has already been taken.');
                }
            },
        ];
    }

    private function category(): Category
    {
        return $this->user()->categories()->findOrFail($this->route('category'));
    }
}
