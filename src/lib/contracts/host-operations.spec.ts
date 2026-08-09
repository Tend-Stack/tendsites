import { describe, expect, it } from 'vitest';

import {
	createHostOperationRequest,
	HostOperationEvidenceSchema,
	validateHostOperationEvidence,
	type AssignedHostContext
} from './host-operations';

const context: AssignedHostContext = {
	contract: 'tend.host/sites-assigned-host-context/v1',
	contextId: '11111111-1111-4111-8111-111111111111',
	capability: 'site.create',
	projectId: 'new-site',
	repositoryId: null,
	sourceRevision: null,
	issuedAt: '2026-08-09T20:00:00Z',
	expiresAt: '2026-08-09T20:01:00Z'
};

describe('assigned host operations', () => {
	it('creates deterministic idempotency evidence for a live exact context', async () => {
		const first = await createHostOperationRequest({
			requestId: '22222222-2222-4222-8222-222222222222',
			context,
			capability: 'site.create',
			projectId: 'new-site',
			intent: { template: 'minimal', modules: ['pages'] },
			expectedRevision: null,
			requestedAt: '2026-08-09T20:00:30Z'
		});
		const retry = await createHostOperationRequest({
			requestId: '33333333-3333-4333-8333-333333333333',
			context,
			capability: 'site.create',
			projectId: 'new-site',
			intent: { modules: ['pages'], template: 'minimal' },
			expectedRevision: null,
			requestedAt: '2026-08-09T20:00:30Z'
		});
		expect(retry.idempotencySha256).toBe(first.idempotencySha256);
		expect(retry.intentSha256).toBe(first.intentSha256);
	});

	it.each([
		['wrong capability', { capability: 'preview.execute' as const }],
		['wrong project', { projectId: 'other-site' }],
		['expired', { requestedAt: '2026-08-09T20:01:00Z' }],
		['wrong revision', { expectedRevision: 'a'.repeat(64) }]
	])('rejects %s', async (_label, override) => {
		await expect(
			createHostOperationRequest({
				requestId: '22222222-2222-4222-8222-222222222222',
				context,
				capability: 'site.create',
				projectId: 'new-site',
				intent: { template: 'minimal' },
				expectedRevision: null,
				requestedAt: '2026-08-09T20:00:30Z',
				...override
			})
		).rejects.toThrow();
	});

	it('accepts only monotonic evidence bound to the exact request', async () => {
		const request = await createHostOperationRequest({
			requestId: '22222222-2222-4222-8222-222222222222',
			context,
			capability: 'site.create',
			projectId: 'new-site',
			intent: { template: 'minimal' },
			expectedRevision: null,
			requestedAt: '2026-08-09T20:00:30Z'
		});
		const evidence = HostOperationEvidenceSchema.parse({
			contract: 'tend.host/sites-host-operation-evidence/v1',
			operationId: '44444444-4444-4444-8444-444444444444',
			requestId: request.requestId,
			contextId: request.contextId,
			capability: request.capability,
			projectId: request.projectId,
			intentSha256: request.intentSha256,
			idempotencySha256: request.idempotencySha256,
			state: 'succeeded',
			sequence: 3,
			resultSha256: 'b'.repeat(64),
			errorCode: null,
			recordedAt: '2026-08-09T20:00:40Z'
		});
		expect(validateHostOperationEvidence(request, evidence, 2)).toEqual(evidence);
		expect(() => validateHostOperationEvidence(request, evidence, 3)).toThrow('stale');
		expect(() =>
			validateHostOperationEvidence(request, { ...evidence, projectId: 'other-site' })
		).toThrow('projectId');
	});

	it('rejects poisoned terminal result and error combinations', () => {
		expect(() =>
			HostOperationEvidenceSchema.parse({
				contract: 'tend.host/sites-host-operation-evidence/v1',
				operationId: '44444444-4444-4444-8444-444444444444',
				requestId: '22222222-2222-4222-8222-222222222222',
				contextId: context.contextId,
				capability: context.capability,
				projectId: context.projectId,
				intentSha256: 'a'.repeat(64),
				idempotencySha256: 'b'.repeat(64),
				state: 'succeeded',
				sequence: 1,
				resultSha256: null,
				errorCode: 'unexpected',
				recordedAt: '2026-08-09T20:00:40Z'
			})
		).toThrow();
	});
});
