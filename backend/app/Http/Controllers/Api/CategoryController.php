<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class CategoryController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return CategoryResource::collection(
            $request->user()->categories()->orderBy('type')->orderBy('name')->get()
        );
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = $request->user()->categories()->create($request->validated());

        return (new CategoryResource($category))->response()->setStatusCode(201);
    }

    public function show(Request $request, string $category): CategoryResource
    {
        $categoryRecord = $request->user()->categories()->findOrFail($category);

        return new CategoryResource($categoryRecord);
    }

    public function update(UpdateCategoryRequest $request, string $category): CategoryResource
    {
        $categoryRecord = $request->user()->categories()->findOrFail($category);
        $categoryRecord->update($request->validated());

        return new CategoryResource($categoryRecord);
    }

    public function destroy(Request $request, string $category): Response|JsonResponse
    {
        $categoryRecord = $request->user()->categories()->findOrFail($category);

        if ($categoryRecord->transactions()->exists()) {
            return response()->json([
                'message' => 'Categories with transactions cannot be deleted.',
            ], 409);
        }

        $categoryRecord->delete();

        return response()->noContent();
    }
}
