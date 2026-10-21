<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTransactionRequest;
use App\Http\Requests\UpdateTransactionRequest;
use App\Http\Resources\TransactionResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class TransactionController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $transactions = $request->user()->transactions()
            ->with('category')
            ->orderByDesc('occurred_on')
            ->orderByDesc('id')
            ->get();

        return TransactionResource::collection($transactions);
    }

    public function store(StoreTransactionRequest $request): JsonResponse
    {
        $transaction = $request->user()->transactions()->create($request->validated());

        return (new TransactionResource($transaction->load('category')))->response()->setStatusCode(201);
    }

    public function show(Request $request, string $transaction): TransactionResource
    {
        $transactionRecord = $request->user()->transactions()
            ->with('category')
            ->findOrFail($transaction);

        return new TransactionResource($transactionRecord);
    }

    public function update(UpdateTransactionRequest $request, string $transaction): TransactionResource
    {
        $transactionRecord = $request->user()->transactions()->findOrFail($transaction);
        $transactionRecord->update($request->validated());

        return new TransactionResource($transactionRecord->load('category'));
    }

    public function destroy(Request $request, string $transaction): Response
    {
        $transactionRecord = $request->user()->transactions()->findOrFail($transaction);
        $transactionRecord->delete();

        return response()->noContent();
    }
}
