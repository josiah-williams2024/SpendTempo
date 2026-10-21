<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBudgetRequest;
use App\Http\Requests\UpdateBudgetRequest;
use App\Http\Resources\BudgetResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class BudgetController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return BudgetResource::collection(
            $request->user()->budgets()->orderByDesc('starts_on')->orderByDesc('id')->get()
        );
    }

    public function store(StoreBudgetRequest $request): JsonResponse
    {
        $budget = $request->user()->budgets()->create($request->validated());

        return (new BudgetResource($budget))->response()->setStatusCode(201);
    }

    public function show(Request $request, string $budget): BudgetResource
    {
        $budgetRecord = $request->user()->budgets()->findOrFail($budget);

        return new BudgetResource($budgetRecord);
    }

    public function update(UpdateBudgetRequest $request, string $budget): BudgetResource
    {
        $budgetRecord = $request->user()->budgets()->findOrFail($budget);
        $budgetRecord->update($request->validated());

        return new BudgetResource($budgetRecord);
    }

    public function destroy(Request $request, string $budget): Response
    {
        $budgetRecord = $request->user()->budgets()->findOrFail($budget);
        $budgetRecord->delete();

        return response()->noContent();
    }
}
