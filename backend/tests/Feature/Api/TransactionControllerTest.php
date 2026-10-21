<?php

use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

it('returns 401 when no token is provided', function () {
    $this->getJson('/api/transactions')->assertUnauthorized();
});

it('creates lists updates and deletes the signed-in users transactions', function () {
    $user = User::factory()->create();
    $category = Category::factory()->for($user)->create(['name' => 'Groceries']);
    Transaction::factory()->create(['description' => 'Someone else']);
    Sanctum::actingAs($user);

    $created = $this->postJson('/api/transactions', [
        'category_id' => $category->id,
        'amount_cents' => 4250,
        'type' => 'expense',
        'occurred_on' => '2026-10-21',
        'description' => 'Weekly groceries',
    ])->assertCreated()
        ->assertJsonPath('data.amount_cents', 4250)
        ->assertJsonPath('data.category.name', 'Groceries');

    $transactionId = $created->json('data.id');

    $this->getJson('/api/transactions')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $transactionId)
        ->assertJsonMissing(['description' => 'Someone else']);

    $this->patchJson("/api/transactions/{$transactionId}", ['amount_cents' => 5000])
        ->assertOk()
        ->assertJsonPath('data.amount_cents', 5000);

    $this->deleteJson("/api/transactions/{$transactionId}")->assertNoContent();

    $this->assertDatabaseMissing('transactions', ['id' => $transactionId]);
});

it('returns 422 when the category belongs to another user or has the wrong type', function () {
    $user = User::factory()->create();
    $otherUsersCategory = Category::factory()->create();
    $incomeCategory = Category::factory()->income()->for($user)->create();
    Sanctum::actingAs($user);

    $payload = [
        'amount_cents' => 4250,
        'type' => 'expense',
        'occurred_on' => '2026-10-21',
    ];

    $this->postJson('/api/transactions', [...$payload, 'category_id' => $otherUsersCategory->id])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('category_id');

    $this->postJson('/api/transactions', [...$payload, 'category_id' => $incomeCategory->id])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('category_id');
});

it('returns 404 when accessing another users transaction', function () {
    $transaction = Transaction::factory()->create();
    Sanctum::actingAs(User::factory()->create());

    $this->getJson("/api/transactions/{$transaction->id}")->assertNotFound();
    $this->patchJson("/api/transactions/{$transaction->id}", ['amount_cents' => 5000])->assertNotFound();
    $this->deleteJson("/api/transactions/{$transaction->id}")->assertNotFound();
});
