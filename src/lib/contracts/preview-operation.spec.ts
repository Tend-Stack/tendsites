import { describe, expect, it } from 'vitest';

import { createPreviewExecutionIntent } from './preview-operation';

const revision = 'a'.repeat(64);
const input = {
	contract: 'tend.host/sites-preview-execution-intent/v1' as const,
	projectId: 'site-one',
	snapshot: {
		contract: 'tend.host/sites-source-snapshot/v1' as const,
		snapshotId: '11111111-1111-4111-8111-111111111111',
		provider: 'github' as const,
		providerInstallationId: 'provider-one',
		repositoryId: 'repo-one',
		commit: '1'.repeat(40),
		treeSha256: revision,
		archiveSha256: 'b'.repeat(64),
		actorId: 'actor-one',
		trustClass: 'protected' as const,
		fileCount: 10,
		archiveBytes: 1000,
		hasSubmodules: false,
		hasLfsPointers: false,
		hasPrivateDependencies: false,
		createdAt: '2026-08-09T20:00:00Z',
		expiresAt: '2026-08-09T20:05:00Z'
	},
	changeSet: {
		contract: 'tend.host/sites-change-set/v1' as const,
		id: '22222222-2222-4222-8222-222222222222',
		projectId: 'site-one',
		baseRevision: revision,
		summary: 'Update home page',
		files: [
			{
				path: 'src/routes/+page.svelte',
				kind: 'update' as const,
				beforeSha256: revision,
				afterSha256: 'c'.repeat(64)
			}
		],
		validation: 'passed' as const,
		createdAt: '2026-08-09T20:01:00Z'
	},
	policy: {
		contract: 'tend.host/sites-preview-policy/v1' as const,
		policyId: 'standard-preview',
		separateOrigin: true as const,
		panelCredentials: false as const,
		secrets: 'none' as const,
		network: 'public_packages' as const,
		maxSeconds: 300,
		maxMemoryMiB: 1024,
		maxDiskMiB: 4096,
		maxLogBytes: 1_000_000,
		ttlSeconds: 3600,
		requiredChecks: ['build']
	},
	originClass: 'separate_untrusted_preview' as const,
	panelCredentials: false as const,
	deploymentAuthority: false as const
};

describe('preview execution intent', () => {
	it('binds protected source and reviewed changes without deployment authority', () => {
		const intent = createPreviewExecutionIntent(input);
		expect(intent.panelCredentials).toBe(false);
		expect(intent.deploymentAuthority).toBe(false);
	});

	it.each([
		['project', { changeSet: { ...input.changeSet, projectId: 'other' } }],
		['revision', { snapshot: { ...input.snapshot, treeSha256: 'd'.repeat(64) } }]
	])('rejects %s substitution', (_label, override) => {
		expect(() => createPreviewExecutionIntent({ ...input, ...override })).toThrow();
	});
});
