<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'amount_cents' => $this->amount_cents,
            'type' => $this->type->value,
            'occurred_on' => $this->occurred_on->toDateString(),
            'description' => $this->description,
        ];
    }
}
