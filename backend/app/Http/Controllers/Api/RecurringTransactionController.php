<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRecurringTransactionRequest;
use App\Http\Resources\RecurringTransactionResource;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class RecurringTransactionController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return RecurringTransactionResource::collection(
            $request->user()->recurringTransactions()->with('category')->orderByDesc('active')->orderBy('next_occurrence_on')->get()
        );
    }

    public function store(StoreRecurringTransactionRequest $request): JsonResponse
    {
        $attributes = $request->validated();
        $attributes['next_occurrence_on'] = $attributes['starts_on'];
        $recurring = $request->user()->recurringTransactions()->create($attributes);

        return (new RecurringTransactionResource($recurring->load('category')))->response()->setStatusCode(201);
    }

    public function update(Request $request, string $recurringTransaction): RecurringTransactionResource
    {
        $validated = $request->validate(['active' => ['required', 'boolean']]);
        $recurring = $request->user()->recurringTransactions()->findOrFail($recurringTransaction);
        $recurring->update($validated);

        return new RecurringTransactionResource($recurring->load('category'));
    }

    public function destroy(Request $request, string $recurringTransaction): Response
    {
        $request->user()->recurringTransactions()->findOrFail($recurringTransaction)->delete();

        return response()->noContent();
    }

    public function generate(Request $request): JsonResponse
    {
        $generated = 0;
        $today = CarbonImmutable::today();

        DB::transaction(function () use ($request, $today, &$generated): void {
            $rules = $request->user()->recurringTransactions()
                ->where('active', true)
                ->whereDate('next_occurrence_on', '<=', $today)
                ->lockForUpdate()
                ->get();

            foreach ($rules as $rule) {
                $next = CarbonImmutable::parse($rule->next_occurrence_on);
                $startsOn = CarbonImmutable::parse($rule->starts_on);

                while ($next->lte($today) && ($rule->ends_on === null || $next->lte($rule->ends_on))) {
                    $request->user()->transactions()->firstOrCreate(
                        ['recurring_transaction_id' => $rule->id, 'occurred_on' => $next->toDateString()],
                        ['category_id' => $rule->category_id, 'amount_cents' => $rule->amount_cents, 'type' => $rule->type, 'description' => $rule->description],
                    );
                    $generated++;
                    $next = $rule->frequency->nextDate($next, $startsOn);
                }

                $rule->update([
                    'next_occurrence_on' => $next->toDateString(),
                    'active' => $rule->ends_on === null || $next->lte($rule->ends_on),
                ]);
            }
        });

        return response()->json(['generated' => $generated]);
    }
}
