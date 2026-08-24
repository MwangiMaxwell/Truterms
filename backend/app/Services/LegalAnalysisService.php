<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class LegalAnalysisService
{
    private const DOCUMENT_TYPES = [
        'terms_of_service',
        'privacy_policy',
        'cookie_policy',
        'subscription_terms',
        'other',
    ];

    private const LEVELS = ['low', 'medium', 'high'];

    public function analyze(string $content): array
    {
        $apiKey = config('services.gemini.key');

        if (! $apiKey) {
            throw new RuntimeException('AI analysis is not configured.');
        }

        $url = rtrim(config('services.gemini.url'), '/').'/'.config('services.gemini.model').':generateContent';

        $response = Http::acceptJson()
            ->timeout(60)
            ->post($url.'?key='.urlencode($apiKey), [
                'systemInstruction' => [
                    'parts' => [['text' => $this->systemPrompt()]],
                ],
                'contents' => [[
                    'role' => 'user',
                    'parts' => [['text' => "Analyze this agreement:\n\n".$content]],
                ]],
                'generationConfig' => [
                    'temperature' => 0.1,
                    'responseMimeType' => 'application/json',
                ],
            ]);

        if ($response->failed()) {
            Log::error('Gemini analysis request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new RuntimeException('The AI analysis service is unavailable.');
        }

        $raw = $response->json('candidates.0.content.parts.0.text');
        $data = is_string($raw) ? json_decode($raw, true) : null;

        if (! is_array($data)) {
            Log::error('Gemini returned malformed analysis JSON.');
            throw new RuntimeException('The AI returned an invalid analysis.');
        }

        return $this->validateResult($data, $content);
    }

    private function systemPrompt(): string
    {
        return <<<'PROMPT'
You explain legal documents for ordinary people. Return JSON only with this shape:
{"document_type":"terms_of_service|privacy_policy|cookie_policy|subscription_terms|other","overall_risk":"low|medium|high","summary":"short plain-English explanation","key_points":[{"category":"billing|renewal|cancellation|refunds|data_collection|data_sharing|ai_usage|content_ownership|arbitration|termination|liability|changes|tracking|marketing|age_restrictions|obligations|other","severity":"low|medium|high","title":"short title","summary":"plain-English explanation","evidence":"short exact excerpt from the supplied document","section":"section heading or empty string"}]}
Prioritize money, renewal, cancellation, refunds, data use, AI training, uploaded content ownership, arbitration, termination, liability, and changes. Include only material findings. Evidence must be copied exactly from the supplied text; never invent evidence or clauses. Describe an attention level, not a legal conclusion. Do not provide legal advice. Keep the summary under 80 words and return at most 8 key points.
PROMPT;
    }

    private function validateResult(array $data, string $content): array
    {
        $documentType = $data['document_type'] ?? null;
        $overallRisk = $data['overall_risk'] ?? null;
        $summary = $data['summary'] ?? null;
        $points = $data['key_points'] ?? null;

        if (! in_array($documentType, self::DOCUMENT_TYPES, true)
            || ! in_array($overallRisk, self::LEVELS, true)
            || ! is_string($summary)
            || ! is_array($points)) {
            throw new RuntimeException('The AI returned an invalid analysis structure.');
        }

        $validatedPoints = [];
        foreach (array_slice($points, 0, 8) as $point) {
            if (! is_array($point)
                || ! in_array($point['severity'] ?? null, self::LEVELS, true)
                || ! is_string($point['category'] ?? null)
                || ! is_string($point['title'] ?? null)
                || ! is_string($point['summary'] ?? null)
                || ! is_string($point['evidence'] ?? null)
                || ! is_string($point['section'] ?? null)
                || $point['evidence'] === ''
                || ! str_contains($content, $point['evidence'])) {
                throw new RuntimeException('The AI returned an invalid finding.');
            }

            $validatedPoints[] = [
                'category' => $point['category'],
                'severity' => $point['severity'],
                'title' => $point['title'],
                'summary' => $point['summary'],
                'evidence' => $point['evidence'],
                'section' => $point['section'],
            ];
        }

        return [
            'document_type' => $documentType,
            'overall_risk' => $overallRisk,
            'summary' => $summary,
            'key_points' => $validatedPoints,
        ];
    }
}
