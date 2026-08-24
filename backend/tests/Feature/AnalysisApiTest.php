<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AnalysisApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_analysis_is_validated_sent_to_ai_and_stored(): void
    {
        config(['services.gemini.key' => 'test-key']);
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [[
                    'content' => [
                        'parts' => [[
                            'text' => json_encode([
                                'document_type' => 'subscription_terms',
                                'overall_risk' => 'medium',
                                'summary' => 'Your subscription renews automatically.',
                                'key_points' => [[
                                    'category' => 'renewal',
                                    'severity' => 'high',
                                    'title' => 'Automatic renewal',
                                    'summary' => 'The subscription renews unless you cancel.',
                                    'evidence' => 'Your subscription automatically renews each month unless cancelled.',
                                    'section' => 'Billing',
                                ]],
                            ]),
                        ]],
                    ],
                ]],
            ], 200),
        ]);

        $response = $this->postJson('/api/analyze', [
            'content' => 'Your subscription automatically renews each month unless cancelled. This agreement also describes billing, refunds, and cancellation procedures for your account.',
            'url' => 'https://example.com/terms',
            'title' => 'Terms of Service',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('analysis.domain', 'example.com')
            ->assertJsonPath('analysis.results.key_points.0.evidence', 'Your subscription automatically renews each month unless cancelled.');

        $this->assertDatabaseHas('analyses', [
            'domain' => 'example.com',
            'document_type' => 'subscription_terms',
        ]);
    }

    public function test_short_content_is_rejected_without_calling_ai(): void
    {
        Http::fake();

        $this->postJson('/api/analyze', ['content' => 'Too short'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['content']);

        Http::assertNothingSent();
    }
}
