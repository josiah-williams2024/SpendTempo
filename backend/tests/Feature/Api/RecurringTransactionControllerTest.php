<?php

use App\Models\Category;
use App\Models\User;
use Carbon\CarbonImmutable;
use Laravel\Sanctum\Sanctum;

afterEach(fn () => CarbonImmutable::setTestNow());

it('creates lists pauses and deletes recurring transactions', function () {
    $user = User::factory()->create();
    $category = Category::factory()->for($user)->create(['type' => 'expense']);
    Sanctum::actingAs($user);

    $created = $this->postJson('/api/recurring-transactions', [
        'category_id' => $category->id,
        'amount_cents' => 1299,
        'type' => 'expense',
        'description' => 'Streaming',
        'frequency' => 'monthly',
        'starts_on' => '2026-10-01',
        'ends_on' => null,
    ])->assertCreated()->assertJsonPath('data.next_occurrence_on', '2026-10-01');

    $id = $created->json('data.id');
    $this->getJson('/api/recurring-transactions')->assertOk()->assertJsonCount(1, 'data');
    $this->patchJson("/api/recurring-transactions/{$id}", ['active' => false])
        ->assertOk()->assertJsonPath('data.active', false);
    $this->deleteJson("/api/recurring-transactions/{$id}")->assertNoContent();
    $this->assertDatabaseMissing('recurring_transactions', ['id' => $id]);
});

it('generates every due occurrence once and preserves the monthly anchor day', function () {
    CarbonImmutable::setTestNow('2026-03-31 12:00:00');
    $user = User::factory()->create();
    $category = Category::factory()->for($user)->create(['type' => 'expense']);
    Sanctum::actingAs($user);

    $this->postJson('/api/recurring-transactions', [
        'category_id' => $category->id,
        'amount_cents' => 5000,
        'type' => 'expense',
        'description' => 'Month end bill',
        'frequency' => 'monthly',
        'starts_on' => '2026-01-31',
        'ends_on' => null,
    ])->assertCreated();

    $this->postJson('/api/recurring-transactions/generate')->assertOk()->assertJsonPath('generated', 3);
    $this->postJson('/api/recurring-transactions/generate')->assertOk()->assertJsonPath('generated', 0);

    expect($user->transactions()->orderBy('occurred_on')->pluck('occurred_on')->map->toDateString()->all())
        ->toBe(['2026-01-31', '2026-02-28', '2026-03-31']);
});

it('rejects categories that do not match the recurring transaction type', function () {
    $user = User::factory()->create();
    $category = Category::factory()->for($user)->create(['type' => 'income']);
    Sanctum::actingAs($user);

    $this->postJson('/api/recurring-transactions', [
        'category_id' => $category->id,
        'amount_cents' => 1000,
        'type' => 'expense',
        'frequency' => 'weekly',
        'starts_on' => '2026-10-25',
    ])->assertUnprocessable()->assertJsonValidationErrors('category_id');
});

it('does not expose another users recurring transactions', function () {
    $owner = User::factory()->create();
    $category = Category::factory()->for($owner)->create();
    $rule = $owner->recurringTransactions()->create([
        'category_id' => $category->id,
        'amount_cents' => 1000,
        'type' => 'expense',
        'frequency' => 'weekly',
        'starts_on' => '2026-10-25',
        'next_occurrence_on' => '2026-10-25',
        'active' => true,
    ]);
    Sanctum::actingAs(User::factory()->create());

    $this->patchJson("/api/recurring-transactions/{$rule->id}", ['active' => false])->assertNotFound();
    $this->deleteJson("/api/recurring-transactions/{$rule->id}")->assertNotFound();
});
