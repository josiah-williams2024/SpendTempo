<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /** @return array{id: int, name: string, email: string, currency: ?string, onboarding_complete: bool} */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'name' => $this->resource->name,
            'email' => $this->resource->email,
            'currency' => $this->resource->currency,
            'onboarding_complete' => $this->resource->currency !== null,
        ];
    }
}
