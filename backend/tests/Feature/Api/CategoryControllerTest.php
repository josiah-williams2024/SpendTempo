<?php

use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

it('returns 401 when no token is provided', function () {
    $this->getJson('/api/categories')->assertUnauthorized();
});

it('creates lists updates and deletes the signed-in users categories', function () {
    $user = User::factory()->create();
    Category::factory()->for(User::factory())->create(['name' => 'Someone else']);
    Sanctum::actingAs($user);

    $created = $this->postJson('/api/categories', [
        'name' => 'Groceries',
        'type' => 'expense',
        'colour' => '#EF4444',
    ])->assertCreated()
        ->assertJsonPath('data.name', 'Groceries')
        ->assertJsonMissing(['name' => 'Someone else']);

    $categoryId = $created->json('data.id');

    $this->getJson('/api/categories')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $categoryId);

    $this->patchJson("/api/categories/{$categoryId}", ['colour' => '#22C55E'])
        ->assertOk()
        ->assertJsonPath('data.colour', '#22C55E');

    $this->deleteJson("/api/categories/{$categoryId}")->assertNoContent();

    $this->assertDatabaseMissing('categories', ['id' => $categoryId]);
});

it('returns 422 when category input is invalid', function () {
    Sanctum::actingAs(User::factory()->create());

    $this->postJson('/api/categories', [
        'name' => '',
        'type' => 'transfer',
        'colour' => 'red',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'type', 'colour']);
});

it('returns 404 when accessing another users category', function () {
    $category = Category::factory()->create();
    Sanctum::actingAs(User::factory()->create());

    $this->getJson("/api/categories/{$category->id}")->assertNotFound();
    $this->patchJson("/api/categories/{$category->id}", ['colour' => '#22C55E'])->assertNotFound();
    $this->deleteJson("/api/categories/{$category->id}")->assertNotFound();
});

it('returns 409 when deleting a category used by a transaction', function () {
    $user = User::factory()->create();
    $category = Category::factory()->for($user)->create();
    Transaction::factory()->for($user)->for($category)->create();
    Sanctum::actingAs($user);

    $this->deleteJson("/api/categories/{$category->id}")
        ->assertConflict()
        ->assertJsonPath('message', 'Categories with transactions cannot be deleted.');

    $this->assertModelExists($category);
});

it('returns 409 when deleting a category used by a recurring transaction', function () {
    $user = User::factory()->create();
    $category = Category::factory()->for($user)->create();
    $user->recurringTransactions()->create([
        'category_id' => $category->id,
        'amount_cents' => 1000,
        'type' => $category->type,
        'frequency' => 'monthly',
        'starts_on' => '2026-10-25',
        'next_occurrence_on' => '2026-10-25',
        'active' => true,
    ]);
    Sanctum::actingAs($user);

    $this->deleteJson("/api/categories/{$category->id}")
        ->assertConflict()
        ->assertJsonPath('message', 'Categories with recurring transactions cannot be deleted.');

    $this->assertModelExists($category);
});
