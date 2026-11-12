<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CompleteOnboardingRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class OnboardingController extends Controller
{
    public function __invoke(CompleteOnboardingRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request): User {
            $user = $request->user();
            $user->update(['currency' => $request->string('currency')->toString()]);

            $budget = $user->budgets()->latest('starts_on')->first();

            if ($budget) {
                $budget->update(['daily_limit_cents' => $request->integer('daily_limit_cents')]);
            } else {
                $user->budgets()->create([
                    'daily_limit_cents' => $request->integer('daily_limit_cents'),
                    'starts_on' => now()->toDateString(),
                    'ends_on' => null,
                ]);
            }

            return $user->refresh();
        });

        return response()->json(UserResource::make($user)->resolve());
    }
}
