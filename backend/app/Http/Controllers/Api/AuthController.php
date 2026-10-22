<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request): User {
            $user = User::create($request->safe()->only(['name', 'email', 'password']));
            $user->categories()->createMany([
                ['name' => 'Salary', 'type' => 'income', 'colour' => '#9BC52C'],
                ['name' => 'Other income', 'type' => 'income', 'colour' => '#7559E8'],
                ['name' => 'Groceries', 'type' => 'expense', 'colour' => '#49A878'],
                ['name' => 'Dining', 'type' => 'expense', 'colour' => '#F4B84A'],
                ['name' => 'Transport', 'type' => 'expense', 'colour' => '#7559E8'],
                ['name' => 'Bills', 'type' => 'expense', 'colour' => '#F47762'],
                ['name' => 'Other', 'type' => 'expense', 'colour' => '#72807B'],
            ]);
            $user->budgets()->create([
                'daily_limit_cents' => 7500,
                'starts_on' => now()->startOfMonth()->toDateString(),
                'ends_on' => null,
            ]);

            return $user;
        });

        return response()->json($this->authenticationPayload($user), 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->string('email'))->first();

        if (! $user || ! Hash::check($request->string('password'), $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        return response()->json($this->authenticationPayload($user));
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Signed out.']);
    }

    /** @return array{token: string, user: array{id: int, name: string, email: string}} */
    private function authenticationPayload(User $user): array
    {
        return [
            'token' => $user->createToken('mobile-app')->plainTextToken,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ];
    }
}
