<?php

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Notification;

it('sends a reset link to the configured frontend for a registered email', function () {
    Notification::fake();
    config(['app.frontend_url' => 'https://josiah-williams2024.github.io/SpendTempo/']);
    $user = User::factory()->create(['email' => 'josiah@example.com']);

    $this->postJson('/api/forgot-password', ['email' => 'josiah@example.com'])
        ->assertOk()
        ->assertJsonPath('message', 'If an account exists for that email, a password reset link has been sent.');

    Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user): bool {
        $resetUrl = $notification->toMail($user)->actionUrl;

        return str_starts_with($resetUrl, 'https://josiah-williams2024.github.io/SpendTempo/?')
            && str_contains($resetUrl, 'email=josiah%40example.com')
            && str_contains($resetUrl, 'token=');
    });
});

it('returns the same response without sending mail for an unknown email', function () {
    Notification::fake();

    $this->postJson('/api/forgot-password', ['email' => 'unknown@example.com'])
        ->assertOk()
        ->assertJsonPath('message', 'If an account exists for that email, a password reset link has been sent.');

    Notification::assertNothingSent();
});

it('returns 422 when the email is invalid', function () {
    Notification::fake();

    $this->postJson('/api/forgot-password', ['email' => 'not-an-email'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);

    Notification::assertNothingSent();
});
