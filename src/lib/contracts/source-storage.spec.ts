import { describe, expect, it } from 'vitest';

import {
	ResumableDraftLeaseSchema,
	SourceLocationSchema,
	assessSourceDurability,
	type SourceLocation,
	type SourceRecoveryEvidence
} from './source-storage';

const revision = 'a'.repeat(64);
const location: SourceLocation = {
	contract: 'tend.host/sites-source-location/v1',
	sourceId: 'source-1',
	projectId: 'project-1',
	adapter: 'customer_server_repository',
	repositoryId: 'repository-1',
	storageIdentity: 'server-storage-1',
	sourceRevision: revision,
	customerControlled: true,
	canonicalSource: true,
	managedStorageConsentId: null,
	configuredAt: '2026-08-10T20:00:00Z'
};

const evidence: SourceRecoveryEvidence = {
	contract: 'tend.host/sites-source-recovery-evidence/v1',
	sourceId: location.sourceId,
	projectId: location.projectId,
	sourceRevision: revision,
	canonicalSourceVerifiedAt: '2026-08-10T20:01:00Z',
	localHistoryVerifiedAt: '2026-08-10T20:01:00Z',
	externalRepositoryRevision: null,
	externalRepositoryVerifiedAt: null,
	backupStorageIdentity: null,
	backupSnapshotSha256: null,
	backupVerifiedAt: null,
	restoreDrillId: null,
	restoredSourceRevision: null,
	restoreVerifiedAt: null,
	evidenceExpiresAt: '2026-08-10T21:01:00Z'
};

describe('source ownership and durability', () => {
	it('keeps customer repositories canonical without managed-storage consent', () => {
		expect(SourceLocationSchema.parse(location)).toEqual(location);
		expect(() =>
			SourceLocationSchema.parse({ ...location, managedStorageConsentId: 'unexpected-consent' })
		).toThrow();
	});

	it('requires explicit consent for an optional managed vault', () => {
		expect(
			SourceLocationSchema.parse({
				...location,
				adapter: 'tend_managed_vault',
				customerControlled: false,
				managedStorageConsentId: 'consent-1'
			})
		).toBeTruthy();
		expect(() =>
			SourceLocationSchema.parse({
				...location,
				adapter: 'tend_managed_vault',
				customerControlled: true,
				managedStorageConsentId: null
			})
		).toThrow();
	});

	it('reports local history without external recovery as versioned only', () => {
		const report = assessSourceDurability(location, evidence, '2026-08-10T20:05:00Z');
		expect(report.state).toBe('versioned_only');
		expect(report.recommendation).toBe('configure_backup');
	});

	it('reports an exact external repository revision independently', () => {
		const externalLocation = { ...location, adapter: 'external_git_repository' as const };
		const report = assessSourceDurability(
			externalLocation,
			{
				...evidence,
				externalRepositoryRevision: revision,
				externalRepositoryVerifiedAt: '2026-08-10T20:02:00Z'
			},
			'2026-08-10T20:05:00Z'
		);
		expect(report.state).toBe('external_repository');
		expect(report.recommendation).toBe('none');
	});

	it('reports a verified customer-owned backup as protected', () => {
		const report = assessSourceDurability(
			location,
			{
				...evidence,
				backupStorageIdentity: 'backup-target-1',
				backupSnapshotSha256: 'b'.repeat(64),
				backupVerifiedAt: '2026-08-10T20:03:00Z'
			},
			'2026-08-10T20:05:00Z'
		);
		expect(report.state).toBe('protected');
		expect(report.checks.find((check) => check.id === 'recovery_copy')?.status).toBe('passed');
	});

	it('binds restore drills to the exact canonical revision', () => {
		const report = assessSourceDurability(
			location,
			{
				...evidence,
				restoreDrillId: 'restore-1',
				restoredSourceRevision: revision,
				restoreVerifiedAt: '2026-08-10T20:04:00Z'
			},
			'2026-08-10T20:05:00Z'
		);
		expect(report.state).toBe('protected');
		expect(() =>
			assessSourceDurability(
				location,
				{
					...evidence,
					restoreDrillId: 'restore-1',
					restoredSourceRevision: 'e'.repeat(64),
					restoreVerifiedAt: '2026-08-10T20:04:00Z'
				},
				'2026-08-10T20:05:00Z'
			)
		).toThrow();
	});

	it('fails closed on stale evidence and cross-source substitution', () => {
		expect(assessSourceDurability(location, evidence, evidence.evidenceExpiresAt).state).toBe(
			'at_risk'
		);
		expect(() =>
			assessSourceDurability(
				location,
				{ ...evidence, sourceRevision: 'c'.repeat(64) },
				'2026-08-10T20:05:00Z'
			)
		).toThrow('sourceRevision');
		expect(
			assessSourceDurability(
				{ ...location, configuredAt: '2026-08-10T20:06:00Z' },
				evidence,
				'2026-08-10T20:05:00Z'
			).state
		).toBe('at_risk');
	});
});

describe('resumable editor leases', () => {
	const lease = {
		contract: 'tend.host/sites-resumable-draft-lease/v1' as const,
		leaseId: '11111111-1111-4111-8111-111111111111',
		draftId: '22222222-2222-4222-8222-222222222222',
		sourceId: location.sourceId,
		projectId: location.projectId,
		actorId: 'user-1',
		baseRevision: revision,
		contentSha256: 'd'.repeat(64),
		contentBytes: 12_000,
		encryptedAtRest: true as const,
		canonicalSource: false as const,
		purgeOn: ['commit', 'discard', 'retention_expiry', 'project_delete', 'account_delete'],
		savedAt: '2026-08-10T20:00:00Z',
		expiresAt: '2026-08-17T20:00:00Z'
	};

	it('is encrypted, bounded, expiring, and structurally noncanonical', () => {
		expect(ResumableDraftLeaseSchema.parse(lease)).toEqual(lease);
		expect(() => ResumableDraftLeaseSchema.parse({ ...lease, canonicalSource: true })).toThrow();
		expect(() => ResumableDraftLeaseSchema.parse({ ...lease, contentBytes: 25_000_001 })).toThrow();
	});

	it('requires every terminal purge event exactly once', () => {
		expect(() =>
			ResumableDraftLeaseSchema.parse({
				...lease,
				purgeOn: ['commit', 'discard', 'retention_expiry', 'project_delete', 'project_delete']
			})
		).toThrow();
		expect(() => ResumableDraftLeaseSchema.parse({ ...lease, expiresAt: lease.savedAt })).toThrow();
	});
});
