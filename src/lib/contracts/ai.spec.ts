import { describe, expect, it } from 'vitest';
import { planAiRequest } from './ai';
const policy = {
	contract: 'tend.host/sites-ai-provider-policy/v1' as const,
	providerId: 'my-ai',
	configuredByUser: true as const,
	credentialAvailableToBrowser: false as const,
	allowedPurposes: ['content', 'translation', 'seo', 'accessibility', 'block_composition'] as Array<
		'content' | 'translation' | 'seo' | 'accessibility' | 'block_composition'
	>,
	maxInputCharacters: 10_000,
	maxCostUsdMicros: 50_000,
	retention: 'provider_zero_retention' as const
};
const request = {
	requestId: '11111111-1111-4111-8111-111111111111',
	projectId: 'site',
	purpose: 'content' as const,
	sourceSha256: 'a'.repeat(64),
	redactedInputSha256: 'b'.repeat(64),
	inputCharacters: 1000,
	estimatedCostUsdMicros: 2000,
	redactions: ['email'] as const
};
describe('AI request planning', () => {
	it('shows cost and redaction evidence without send authority', () => {
		const plan = planAiRequest(policy, { ...request, redactions: [...request.redactions] });
		expect(plan.status).toBe('ready_for_review');
		expect(plan.canSend).toBe(false);
	});
	it('blocks unsupported, oversized, or over-budget work', () =>
		expect(
			planAiRequest(
				{ ...policy, allowedPurposes: ['translation'] },
				{
					...request,
					redactions: [...request.redactions],
					inputCharacters: 20_000,
					estimatedCostUsdMicros: 60_000
				}
			).reasons
		).toEqual(['purpose_not_allowed', 'input_limit_exceeded', 'cost_limit_exceeded']));
	it('detects claimed redaction without changed evidence', () =>
		expect(
			planAiRequest(policy, {
				...request,
				redactions: [...request.redactions],
				redactedInputSha256: request.sourceSha256
			}).status
		).toBe('blocked'));
});
