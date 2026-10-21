<?php

namespace Database\Factories;

use App\Enums\TransactionType;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Transaction>
 */
class TransactionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'category_id' => fn (array $attributes) => Category::factory()->create([
                'user_id' => $attributes['user_id'],
                'type' => TransactionType::Expense,
            ]),
            'amount_cents' => fake()->numberBetween(100, 50_000),
            'type' => TransactionType::Expense,
            'occurred_on' => fake()->date(),
            'description' => fake()->optional()->sentence(4),
        ];
    }
}
