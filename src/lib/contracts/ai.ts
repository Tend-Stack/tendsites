import { z } from 'zod';
import { IdentifierSchema, Sha256HexSchema } from './sites';

export const AiProviderPolicySchema = z
	.object({
		contract: z.literal('tend.host/sites-ai-provider-policy/v1'),
		providerId: IdentifierSchema,
		configuredByUser: z.literal(true),
		credentialAvailableToBrowser: z.literal(false),
		allowedPurposes: z
			.array(z.enum(['content', 'translation', 'seo', 'accessibility', 'block_composition']))
			.min(1)
			.max(5),
		maxInputCharacters: z.number().int().min(100).max(200_000),
		maxCostUsdMicros: z.number().int().min(0).max(100_000_000),
		retention: z.enum(['provider_zero_retention', 'provider_policy_disclosed'])
	})
	.strict()
	.refine(
		(value) => new Set(value.allowedPurposes).size === value.allowedPurposes.length,
		'AI purposes must be unique'
	);
export const AiRequestPlanSchema = z
	.object({
		contract: z.literal('tend.host/sites-ai-request-plan/v1'),
		requestId: z.uuid(),
		projectId: IdentifierSchema,
		providerId: IdentifierSchema,
		purpose: z.enum(['content', 'translation', 'seo', 'accessibility', 'block_composition']),
		sourceSha256: Sha256HexSchema,
		redactedInputSha256: Sha256HexSchema,
		inputCharacters: z.number().int().min(0),
		estimatedCostUsdMicros: z.number().int().min(0),
		redactions: z.array(z.enum(['email', 'phone', 'token', 'private_url'])).max(20),
		status: z.enum(['ready_for_review', 'blocked']),
		reasons: z.array(IdentifierSchema),
		canSend: z.literal(false)
	})
	.strict();

export function planAiRequest(
	policyInput: z.input<typeof AiProviderPolicySchema>,
	request: {
		requestId: string;
		projectId: string;
		purpose: 'content' | 'translation' | 'seo' | 'accessibility' | 'block_composition';
		sourceSha256: string;
		redactedInputSha256: string;
		inputCharacters: number;
		estimatedCostUsdMicros: number;
		redactions: Array<'email' | 'phone' | 'token' | 'private_url'>;
	}
) {
	const policy = AiProviderPolicySchema.parse(policyInput);
	const reasons: string[] = [];
	if (!policy.allowedPurposes.includes(request.purpose)) reasons.push('purpose_not_allowed');
	if (request.inputCharacters > policy.maxInputCharacters) reasons.push('input_limit_exceeded');
	if (request.estimatedCostUsdMicros > policy.maxCostUsdMicros) reasons.push('cost_limit_exceeded');
	if (request.sourceSha256 === request.redactedInputSha256 && request.redactions.length)
		reasons.push('redaction_digest_unchanged');
	return AiRequestPlanSchema.parse({
		contract: 'tend.host/sites-ai-request-plan/v1',
		...request,
		providerId: policy.providerId,
		status: reasons.length ? 'blocked' : 'ready_for_review',
		reasons,
		canSend: false
	});
}
