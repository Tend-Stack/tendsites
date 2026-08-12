import { describe, expect, it } from 'vitest';

import { SitePublishRequestSchema, SitePublishResultSchema } from './host-publishing';

const request = {
	contract: 'tend.host/sites-publish-request/v1',
	operationId: '11111111-1111-4111-8111-111111111111',
	projectId: 'weekend-notes',
	sourceId: 'source-weekend-notes',
	sourceRevision: 'a'.repeat(64),
	gitCommit: 'b'.repeat(40),
	previewId: 'preview-1',
	previewArtifactSha256: 'c'.repeat(64),
	hostname: 'www.example.com',
	requestedAt: '2026-08-12T12:00:00.000Z'
} as const;
const { contract: _requestContract, ...requestEvidence } = request;

describe('site publishing host contract', () => {
	it('binds a request to an exact preview artifact and source revision', () => {
		expect(SitePublishRequestSchema.parse(request)).toEqual(request);
		expect(() =>
			SitePublishRequestSchema.parse({ ...request, previewArtifactSha256: null })
		).toThrow();
	});

	it('accepts only complete health-gated ready evidence', () => {
		const ready = {
			contract: 'tend.host/sites-publish-result/v1',
			...requestEvidence,
			url: 'https://www.example.com',
			state: 'ready',
			artifact: {
				sha256: request.previewArtifactSha256,
				files: 9,
				bytes: 4096,
				recipeSha256: 'd'.repeat(64),
				sbomSha256: 'e'.repeat(64),
				provenanceSha256: 'f'.repeat(64),
				platform: 'linux/amd64'
			},
			traffic: {
				decision: 'switch',
				health: 'passed',
				previousArtifactSha256: null,
				rollbackRetained: false
			},
			completedAt: '2026-08-12T12:01:00.000Z',
			errorCode: null
		};
		expect(SitePublishResultSchema.parse(ready).state).toBe('ready');
		expect(() =>
			SitePublishResultSchema.parse({
				...ready,
				traffic: { ...ready.traffic, health: 'failed', decision: 'retain_previous' }
			})
		).toThrow();
	});

	it('requires failed candidates to retain previous traffic', () => {
		expect(
			SitePublishResultSchema.parse({
				contract: 'tend.host/sites-publish-result/v1',
				...requestEvidence,
				url: null,
				state: 'failed',
				artifact: null,
				traffic: {
					decision: 'retain_previous',
					health: 'failed',
					previousArtifactSha256: 'f'.repeat(64),
					rollbackRetained: true
				},
				completedAt: '2026-08-12T12:01:00.000Z',
				errorCode: 'candidate_unhealthy'
			}).traffic?.decision
		).toBe('retain_previous');
	});
});
