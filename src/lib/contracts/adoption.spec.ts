import { describe, expect, it } from 'vitest';

import { assessSourceSnapshot, type AdoptionPolicy, type SourceSnapshot } from './adoption';

const snapshot: SourceSnapshot = {
	contract: 'tend.host/sites-source-snapshot/v1',
	snapshotId: '11111111-1111-4111-8111-111111111111',
	provider: 'github',
	providerInstallationId: 'install-1',
	repositoryId: 'repo-1',
	commit: 'a'.repeat(40),
	treeSha256: 'b'.repeat(64),
	archiveSha256: 'c'.repeat(64),
	actorId: 'owner-1',
	trustClass: 'protected',
	fileCount: 120,
	archiveBytes: 500_000,
	hasSubmodules: false,
	hasLfsPointers: false,
	hasPrivateDependencies: false,
	createdAt: '2026-08-09T20:00:00Z',
	expiresAt: '2026-08-09T20:05:00Z'
};

const policy: AdoptionPolicy = {
	contract: 'tend.host/sites-adoption-policy/v1',
	maxFiles: 20_000,
	maxArchiveBytes: 250_000_000,
	allowSubmodules: false,
	allowLfsPointers: false,
	allowPrivateDependencies: false,
	allowUntrustedSource: false
};

describe('source adoption evidence', () => {
	it('accepts a fresh bounded protected snapshot without granting secrets or production', () => {
		const report = assessSourceSnapshot(snapshot, policy, '2026-08-09T20:01:00Z');
		expect(report.status).toBe('compatible');
		expect(report.checks.every((check) => check.status === 'passed')).toBe(true);
		expect(report.secretsAvailable).toBe(false);
		expect(report.productionDestinationAvailable).toBe(false);
	});

	it.each([
		['future snapshot', { createdAt: '2026-08-09T20:02:00Z', expiresAt: '2026-08-09T20:06:00Z' }],
		['expired snapshot', { expiresAt: '2026-08-09T20:00:30Z' }],
		['oversized repository', { fileCount: 20_001 }],
		['submodules', { hasSubmodules: true }],
		['private dependencies', { hasPrivateDependencies: true }],
		['untrusted pull request', { trustClass: 'untrusted_pull_request' as const }]
	])('rejects %s under the safe default policy', (_label, drift) => {
		const report = assessSourceSnapshot({ ...snapshot, ...drift }, policy, '2026-08-09T20:01:00Z');
		expect(report.status).toBe('rejected');
		expect(report.checks.some((check) => check.status === 'blocked')).toBe(true);
	});
});
