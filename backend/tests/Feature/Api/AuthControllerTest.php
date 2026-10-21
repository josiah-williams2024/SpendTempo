<?php

use App\Models\User;

it('registers a user with starter categories and returns a token', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'Josiah Williams',
        'email' => 'josiah@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertCreated()
        ->assertJsonPath('user.name', 'Josiah Williams')
        ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']]);

    $user = User::where('email', 'josiah@example.com')->firstOrFail();

    expect($response->json('token'))->toBeString()->not->toBeEmpty();
    expect($user->categories()->count())->toBe(7);
    expect($user->budgets()->value('daily_limit_cents'))->toBe(7500);
});

it('returns a token for valid credentials', function () {
    User::factory()->create([
        'email' => 'josiah@example.com',
        'password' => 'password123',
    ]);

    $this->postJson('/api/login', [
        'email' => 'josiah@example.com',
        'password' => 'password123',
    ])->assertOk()->assertJsonStructure(['token', 'user']);
});

it('returns 422 for invalid credentials', function () {
    User::factory()->create([
        'email' => 'josiah@example.com',
        'password' => 'password123',
    ]);

    $this->postJson('/api/login', [
        'email' => 'josiah@example.com',
        'password' => 'incorrect-password',
    ])->assertUnprocessable()->assertJsonValidationErrors('email');
});

it('revokes the current token when signing out', function () {
    $user = User::factory()->create();
    $token = $user->createToken('mobile-app')->plainTextToken;

    $this->withToken($token)->postJson('/api/logout')
        ->assertOk()
        ->assertJsonPath('message', 'Signed out.');

    expect($user->tokens()->count())->toBe(0);
});
