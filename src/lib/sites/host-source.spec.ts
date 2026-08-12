import { describe, expect, it } from 'vitest';

import { assessConnectedRepository, ConnectedRepositoryReportSchema } from './host-source';

const report = {
	contract: 'tend.host/sites-connected-repository-report/v1',
	inspection: {
		contract: 'tend.host/sites-repository-inspection-result/v1',
		requestId: '11111111-1111-4111-8111-111111111111',
		projectId: 'connected-site',
		snapshot: {
			contract: 'tend.host/sites-source-snapshot/v1',
			snapshotId: '22222222-2222-4222-8222-222222222222',
			provider: 'github',
			providerInstallationId: 'host-github-connection',
			repositoryId: 'github-repository',
			commit: 'a'.repeat(40),
			treeSha256: 'b'.repeat(64),
			archiveSha256: 'c'.repeat(64),
			actorId: 'user-one',
			trustClass: 'protected',
			fileCount: 42,
			archiveBytes: 1024,
			hasSubmodules: false,
			hasLfsPointers: false,
			hasPrivateDependencies: false,
			createdAt: '2026-08-11T20:00:00Z',
			expiresAt: '2099-08-11T20:05:00Z'
		},
		checkoutRemoved: true,
		secretCount: 0
	},
	repository: {
		owner: 'Tend-Stack',
		name: 'tendsites',
		fullName: 'Tend-Stack/tendsites',
		ref: 'main'
	},
	framework: 'sveltekit',
	contentPaths: ['src/routes'],
	pagesDeployment: {
		method: 'github-actions',
		sourceBranch: null,
		sourcePath: null,
		artifactPath: 'build',
		customDomain: 'example.com'
	},
	productionDestinationAvailable: false
} as const;

describe('connected repository boundary', () => {
	it('accepts exact host evidence and derives a compatible adoption report', () => {
		const parsed = ConnectedRepositoryReportSchema.parse(report);
		expect(assessConnectedRepository(parsed)).toMatchObject({
			status: 'compatible',
			secretsAvailable: false,
			productionDestinationAvailable: false
		});
	});

	it('rejects a report that claims production authority or retained checkout state', () => {
		expect(() =>
			ConnectedRepositoryReportSchema.parse({ ...report, productionDestinationAvailable: true })
		).toThrow();
		expect(() =>
			ConnectedRepositoryReportSchema.parse({
				...report,
				inspection: { ...report.inspection, checkoutRemoved: false }
			})
		).toThrow();
	});
});
