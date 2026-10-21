<?php

use App\Models\Budget;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

it('returns 401 when no token is provided', function () {
    $this->getJson('/api/budgets')->assertUnauthorized();
});

it('creates lists updates and deletes the signed-in users budgets', function () {
    $user = User::factory()->create();
    Budget::factory()->create(['daily_limit_cents' => 9999]);
    Sanctum::actingAs($user);

    $created = $this->postJson('/api/budgets', [
        'daily_limit_cents' => 7500,
        'starts_on' => '2026-10-01',
        'ends_on' => '2026-10-31',
    ])->assertCreated()
        ->assertJsonPath('data.daily_limit_cents', 7500)
        ->assertJsonPath('data.starts_on', '2026-10-01');

    $budgetId = $created->json('data.id');

    $this->getJson('/api/budgets')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $budgetId)
        ->assertJsonMissing(['daily_limit_cents' => 9999]);

    $this->patchJson("/api/budgets/{$budgetId}", ['daily_limit_cents' => 8000])
        ->assertOk()
        ->assertJsonPath('data.daily_limit_cents', 8000);

    $this->deleteJson("/api/budgets/{$budgetId}")->assertNoContent();

    $this->assertDatabaseMissing('budgets', ['id' => $budgetId]);
});

it('returns 422 when a budget ends before it starts', function () {
    Sanctum::actingAs(User::factory()->create());

    $this->postJson('/api/budgets', [
        'daily_limit_cents' => 7500,
        'starts_on' => '2026-10-31',
        'ends_on' => '2026-10-01',
    ])->assertUnprocessable()->assertJsonValidationErrors('ends_on');
});

it('returns 404 when accessing another users budget', function () {
    $budget = Budget::factory()->create();
    Sanctum::actingAs(User::factory()->create());

    $this->getJson("/api/budgets/{$budget->id}")->assertNotFound();
    $this->patchJson("/api/budgets/{$budget->id}", ['daily_limit_cents' => 8000])->assertNotFound();
    $this->deleteJson("/api/budgets/{$budget->id}")->assertNotFound();
});
