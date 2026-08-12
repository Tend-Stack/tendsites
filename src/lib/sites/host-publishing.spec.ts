import { describe, expect, it } from 'vitest';

import {
	SitePublishRequestSchema,
	SitePublishResultSchema,
	validateSitePublishResult
} from './host-publishing';

const request = {
	contract: 'tend.host/sites-publish-request/v1',
	operationId: '11111111-1111-4111-8111-111111111111',
	projectId: 'weekend-notes',
	sourceId: 'source-weekend-notes',
	sourceRevision: 'a'.repeat(64),
	gitCommit: 'b'.repeat(40),
	previewId: 'preview-1',
	previewArtifactSha256: 'c'.repeat(64),
	previewRecipeSha256: 'd'.repeat(64),
	previewSbomSha256: 'e'.repeat(64),
	previewPlatform: 'linux/amd64',
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
			contract: 'tend.host/sites-publish-result/v1' as const,
			...requestEvidence,
			url: 'https://www.example.com',
			state: 'ready' as const,
			artifact: {
				sha256: request.previewArtifactSha256,
				files: 9,
				bytes: 4096,
				recipeSha256: request.previewRecipeSha256,
				sbomSha256: request.previewSbomSha256,
				provenanceSha256: 'f'.repeat(64),
				platform: request.previewPlatform
			},
			traffic: {
				deploymentId: '22222222-2222-4222-8222-222222222222',
				decision: 'switch' as const,
				health: 'passed' as const,
				readinessChecks: 3,
				passedChecks: 3,
				previousArtifactSha256: null,
				rollbackRetained: false
			},
			domain: {
				ownership: 'verified' as const,
				dnsSha256: '1'.repeat(64),
				tls: 'ready' as const,
				certificateSha256: '2'.repeat(64)
			},
			completedAt: '2026-08-12T12:01:00.000Z',
			errorCode: null
		};
		expect(validateSitePublishResult(request, ready).state).toBe('ready');
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
					deploymentId: '22222222-2222-4222-8222-222222222222',
					decision: 'retain_previous',
					health: 'failed',
					readinessChecks: 3,
					passedChecks: 1,
					previousArtifactSha256: 'f'.repeat(64),
					rollbackRetained: true
				},
				domain: null,
				completedAt: '2026-08-12T12:01:00.000Z',
				errorCode: 'candidate_unhealthy'
			}).traffic?.decision
		).toBe('retain_previous');
	});

	it('rejects request substitution and reviewed-artifact drift', () => {
		const queued = {
			contract: 'tend.host/sites-publish-result/v1' as const,
			...requestEvidence,
			url: null,
			state: 'queued' as const,
			artifact: null,
			traffic: null,
			domain: null,
			completedAt: null,
			errorCode: null
		};
		expect(validateSitePublishResult(request, queued).state).toBe('queued');
		expect(() =>
			validateSitePublishResult(request, { ...queued, sourceId: 'other-source' })
		).toThrow('sourceId');
		const artifact = {
			sha256: request.previewArtifactSha256,
			files: 9,
			bytes: 4096,
			recipeSha256: request.previewRecipeSha256,
			sbomSha256: request.previewSbomSha256,
			provenanceSha256: 'f'.repeat(64),
			platform: request.previewPlatform
		};
		expect(() =>
			validateSitePublishResult(request, {
				...queued,
				state: 'failed',
				artifact: { ...artifact, recipeSha256: '9'.repeat(64) },
				traffic: {
					deploymentId: '22222222-2222-4222-8222-222222222222',
					decision: 'retain_previous',
					health: 'failed',
					readinessChecks: 3,
					passedChecks: 1,
					previousArtifactSha256: '8'.repeat(64),
					rollbackRetained: true
				},
				completedAt: '2026-08-12T12:01:00.000Z',
				errorCode: 'candidate_unhealthy'
			})
		).toThrow('recipe');
	});

	it('accepts identical replay and rejects state regression or changed terminal evidence', () => {
		const queued = SitePublishResultSchema.parse({
			contract: 'tend.host/sites-publish-result/v1',
			...requestEvidence,
			url: null,
			state: 'queued',
			artifact: null,
			traffic: null,
			domain: null,
			completedAt: null,
			errorCode: null
		});
		const running = SitePublishResultSchema.parse({ ...queued, state: 'running' });
		expect(validateSitePublishResult(request, running, queued).state).toBe('running');
		expect(() => validateSitePublishResult(request, queued, running)).toThrow('regressed');

		const failed = SitePublishResultSchema.parse({
			...running,
			state: 'failed',
			traffic: {
				deploymentId: '22222222-2222-4222-8222-222222222222',
				decision: 'retain_previous',
				health: 'timed_out',
				readinessChecks: 3,
				passedChecks: 2,
				previousArtifactSha256: '8'.repeat(64),
				rollbackRetained: true
			},
			completedAt: '2026-08-12T12:01:00.000Z',
			errorCode: 'candidate_timed_out'
		});
		expect(validateSitePublishResult(request, failed, failed)).toEqual(failed);
		expect(() =>
			validateSitePublishResult(request, { ...failed, errorCode: 'worker_lost' }, failed)
		).toThrow('Terminal');
	});

	it('rejects incomplete health, rollback, hostname, DNS, and TLS evidence', () => {
		const ready = {
			contract: 'tend.host/sites-publish-result/v1' as const,
			...requestEvidence,
			url: 'https://www.example.com',
			state: 'ready' as const,
			artifact: {
				sha256: request.previewArtifactSha256,
				files: 9,
				bytes: 4096,
				recipeSha256: request.previewRecipeSha256,
				sbomSha256: request.previewSbomSha256,
				provenanceSha256: 'f'.repeat(64),
				platform: request.previewPlatform
			},
			traffic: {
				deploymentId: '22222222-2222-4222-8222-222222222222',
				decision: 'switch' as const,
				health: 'passed' as const,
				readinessChecks: 3,
				passedChecks: 3,
				previousArtifactSha256: null,
				rollbackRetained: false
			},
			domain: {
				ownership: 'verified' as const,
				dnsSha256: '1'.repeat(64),
				tls: 'ready' as const,
				certificateSha256: '2'.repeat(64)
			},
			completedAt: '2026-08-12T12:01:00.000Z',
			errorCode: null
		};
		expect(() =>
			SitePublishResultSchema.parse({ ...ready, url: 'https://other.example.com' })
		).toThrow();
		expect(() =>
			SitePublishResultSchema.parse({
				...ready,
				traffic: { ...ready.traffic, passedChecks: 2 }
			})
		).toThrow();
		expect(() =>
			SitePublishResultSchema.parse({
				...ready,
				traffic: {
					...ready.traffic,
					previousArtifactSha256: '8'.repeat(64),
					rollbackRetained: false
				}
			})
		).toThrow();
		expect(() =>
			SitePublishResultSchema.parse({
				...ready,
				domain: { ...ready.domain, certificateSha256: null }
			})
		).toThrow();
	});
});
