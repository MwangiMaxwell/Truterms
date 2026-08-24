<?php

namespace App\Http\Controllers;

use App\Models\Analysis;
use App\Services\LegalAnalysisService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class AnalysisController extends Controller
{
    public function __construct(private readonly LegalAnalysisService $analysisService)
    {
    }

    public function analyze(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'content' => ['required', 'string', 'min:100', 'max:100000'],
            'url' => ['nullable', 'url', 'max:2048'],
            'title' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $result = $this->analysisService->analyze($validated['content']);
            $url = $validated['url'] ?? null;

            $analysis = Analysis::create([
                'url' => $url,
                'domain' => $url ? parse_url($url, PHP_URL_HOST) : null,
                'title' => $validated['title'] ?? null,
                'document_type' => $result['document_type'],
                'overall_risk' => $result['overall_risk'],
                'summary' => $result['summary'],
                'results' => ['key_points' => $result['key_points']],
            ]);

            return response()->json([
                'success' => true,
                'analysis' => $this->resource($analysis),
            ], 201);
        } catch (Throwable $exception) {
            Log::error('Legal document analysis failed', [
                'message' => $exception->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'We could not analyze this agreement right now. Please try again.',
            ], 502);
        }
    }

    public function show(Analysis $analysis): JsonResponse
    {
        return response()->json([
            'success' => true,
            'analysis' => $this->resource($analysis),
        ]);
    }

    private function resource(Analysis $analysis): array
    {
        return [
            'id' => $analysis->id,
            'url' => $analysis->url,
            'domain' => $analysis->domain,
            'title' => $analysis->title,
            'document_type' => $analysis->document_type,
            'overall_risk' => $analysis->overall_risk,
            'summary' => $analysis->summary,
            'results' => $analysis->results,
            'created_at' => $analysis->created_at?->toISOString(),
        ];
    }
}
