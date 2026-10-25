<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecurringTransactionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'amount_cents' => $this->amount_cents,
            'type' => $this->type->value,
            'description' => $this->description,
            'frequency' => $this->frequency->value,
            'starts_on' => $this->starts_on->toDateString(),
            'ends_on' => $this->ends_on?->toDateString(),
            'next_occurrence_on' => $this->next_occurrence_on->toDateString(),
            'active' => $this->active,
        ];
    }
}
