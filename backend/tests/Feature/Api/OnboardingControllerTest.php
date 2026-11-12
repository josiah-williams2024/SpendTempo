<?php

use App\Models\User;

it('stores currency and creates the first daily budget', function () {
    $user = User::factory()->needsOnboarding()->create();
    $token = $user->createToken('mobile-app')->plainTextToken;

    $this->withToken($token)->postJson('/api/onboarding', [
        'currency' => 'USD',
        'daily_limit_cents' => 6500,
    ])->assertOk()
        ->assertJsonPath('currency', 'USD')
        ->assertJsonPath('onboarding_complete', true);

    expect($user->fresh()->currency)->toBe('USD');
    $this->assertDatabaseHas('budgets', [
        'user_id' => $user->id,
        'daily_limit_cents' => 6500,
    ]);
});

it('updates an existing daily budget when an existing user completes onboarding', function () {
    $user = User::factory()->needsOnboarding()->create();
    $budget = $user->budgets()->create([
        'daily_limit_cents' => 7500,
        'starts_on' => '2026-10-01',
        'ends_on' => null,
    ]);
    $token = $user->createToken('mobile-app')->plainTextToken;

    $this->withToken($token)->postJson('/api/onboarding', [
        'currency' => 'CAD',
        'daily_limit_cents' => 9000,
    ])->assertOk();

    expect($budget->fresh()->daily_limit_cents)->toBe(9000);
    expect($user->budgets()->count())->toBe(1);
});

it('returns 422 for unsupported currency and an invalid daily budget', function () {
    $user = User::factory()->needsOnboarding()->create();
    $token = $user->createToken('mobile-app')->plainTextToken;

    $this->withToken($token)->postJson('/api/onboarding', [
        'currency' => 'BTC',
        'daily_limit_cents' => 0,
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['currency', 'daily_limit_cents']);

    expect($user->fresh()->currency)->toBeNull();
    expect($user->budgets()->count())->toBe(0);
});

it('returns 401 when no token is provided', function () {
    $this->postJson('/api/onboarding', [
        'currency' => 'CAD',
        'daily_limit_cents' => 7500,
    ])->assertUnauthorized();
});
