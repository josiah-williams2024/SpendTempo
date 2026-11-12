<?php

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset as PasswordResetEvent;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

it('resets the password and revokes existing access tokens', function () {
    $user = User::factory()->create([
        'email' => 'josiah@example.com',
        'password' => 'old-password',
    ]);
    $user->createToken('mobile-app');
    $token = Password::createToken($user);
    Event::fake([PasswordResetEvent::class]);

    $this->postJson('/api/reset-password', [
        'email' => 'josiah@example.com',
        'token' => $token,
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ])->assertOk()
        ->assertJsonPath('message', 'Your password has been reset. You can now sign in.');

    expect(Hash::check('new-password', $user->fresh()->password))->toBeTrue();
    expect($user->tokens()->count())->toBe(0);
    Event::assertDispatched(PasswordResetEvent::class, fn (PasswordResetEvent $event): bool => $event->user->is($user));
});

it('returns 422 and keeps the password for an invalid token', function () {
    $user = User::factory()->create([
        'email' => 'josiah@example.com',
        'password' => 'old-password',
    ]);

    $this->postJson('/api/reset-password', [
        'email' => 'josiah@example.com',
        'token' => 'invalid-token',
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['token']);

    expect(Hash::check('old-password', $user->fresh()->password))->toBeTrue();
});

it('returns 422 when the password confirmation does not match', function () {
    $user = User::factory()->create(['email' => 'josiah@example.com']);
    $token = Password::createToken($user);

    $this->postJson('/api/reset-password', [
        'email' => 'josiah@example.com',
        'token' => $token,
        'password' => 'new-password',
        'password_confirmation' => 'different-password',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);
});
