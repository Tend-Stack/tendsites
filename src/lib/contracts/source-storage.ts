import { z } from 'zod';

import { IdentifierSchema, Sha256HexSchema } from './sites';

export const SourceStorageAdapterSchema = z.enum([
	'customer_server_repository',
	'external_git_repository',
	'customer_repository_adapter',
	'tend_managed_vault'
]);

export const SourceDurabilityStateSchema = z.enum([
	'protected',
	'external_repository',
	'versioned_only',
	'at_risk'
]);

export const SourceLocationSchema = z
	.object({
		contract: z.literal('tend.host/sites-source-location/v1'),
		sourceId: IdentifierSchema,
		projectId: IdentifierSchema,
		adapter: SourceStorageAdapterSchema,
		repositoryId: IdentifierSchema,
		storageIdentity: IdentifierSchema,
		sourceRevision: Sha256HexSchema,
		customerControlled: z.boolean(),
		canonicalSource: z.literal(true),
		managedStorageConsentId: IdentifierSchema.nullable(),
		configuredAt: z.iso.datetime({ offset: true })
	})
	.strict()
	.superRefine((location, context) => {
		const managed = location.adapter === 'tend_managed_vault';
		if (managed === location.customerControlled) {
			context.addIssue({
				code: 'custom',
				path: ['customerControlled'],
				message: managed
					? 'Managed vault storage is not customer-controlled storage'
					: 'Customer source adapters must remain customer-controlled'
			});
		}
		if (managed !== (location.managedStorageConsentId !== null)) {
			context.addIssue({
				code: 'custom',
				path: ['managedStorageConsentId'],
				message: managed
					? 'Managed vault storage requires explicit consent evidence'
					: 'Customer-controlled storage cannot carry managed-vault consent'
			});
		}
	});

const DraftPurgeReasonSchema = z.enum([
	'commit',
	'discard',
	'retention_expiry',
	'project_delete',
	'account_delete'
]);

const requiredDraftPurgeReasons = new Set(DraftPurgeReasonSchema.options);

export const ResumableDraftLeaseSchema = z
	.object({
		contract: z.literal('tend.host/sites-resumable-draft-lease/v1'),
		leaseId: z.uuid(),
		draftId: z.uuid(),
		sourceId: IdentifierSchema,
		projectId: IdentifierSchema,
		actorId: IdentifierSchema,
		baseRevision: Sha256HexSchema,
		contentSha256: Sha256HexSchema,
		contentBytes: z.number().int().min(1).max(25_000_000),
		encryptedAtRest: z.literal(true),
		canonicalSource: z.literal(false),
		purgeOn: z.array(DraftPurgeReasonSchema).length(requiredDraftPurgeReasons.size),
		savedAt: z.iso.datetime({ offset: true }),
		expiresAt: z.iso.datetime({ offset: true })
	})
	.strict()
	.superRefine((lease, context) => {
		if (Date.parse(lease.expiresAt) <= Date.parse(lease.savedAt)) {
			context.addIssue({
				code: 'custom',
				path: ['expiresAt'],
				message: 'Draft retention expiry must follow the save time'
			});
		}
		const reasons = new Set(lease.purgeOn);
		if (reasons.size !== requiredDraftPurgeReasons.size) {
			context.addIssue({
				code: 'custom',
				path: ['purgeOn'],
				message: 'Draft purge reasons must be unique'
			});
			return;
		}
		for (const reason of requiredDraftPurgeReasons) {
			if (!reasons.has(reason)) {
				context.addIssue({
					code: 'custom',
					path: ['purgeOn'],
					message: `Draft retention must include ${reason}`
				});
			}
		}
	});

export const SourceRecoveryEvidenceSchema = z
	.object({
		contract: z.literal('tend.host/sites-source-recovery-evidence/v1'),
		sourceId: IdentifierSchema,
		projectId: IdentifierSchema,
		sourceRevision: Sha256HexSchema,
		canonicalSourceVerifiedAt: z.iso.datetime({ offset: true }),
		localHistoryVerifiedAt: z.iso.datetime({ offset: true }).nullable(),
		externalRepositoryRevision: Sha256HexSchema.nullable(),
		externalRepositoryVerifiedAt: z.iso.datetime({ offset: true }).nullable(),
		backupStorageIdentity: IdentifierSchema.nullable(),
		backupSnapshotSha256: Sha256HexSchema.nullable(),
		backupVerifiedAt: z.iso.datetime({ offset: true }).nullable(),
		restoreDrillId: IdentifierSchema.nullable(),
		restoredSourceRevision: Sha256HexSchema.nullable(),
		restoreVerifiedAt: z.iso.datetime({ offset: true }).nullable(),
		evidenceExpiresAt: z.iso.datetime({ offset: true })
	})
	.strict()
	.superRefine((evidence, context) => {
		const externalValues = [
			evidence.externalRepositoryRevision,
			evidence.externalRepositoryVerifiedAt
		];
		if (externalValues.some((value) => value === null) && externalValues.some(Boolean)) {
			context.addIssue({
				code: 'custom',
				path: ['externalRepositoryRevision'],
				message: 'External repository evidence must be complete'
			});
		}
		const backupValues = [
			evidence.backupStorageIdentity,
			evidence.backupSnapshotSha256,
			evidence.backupVerifiedAt
		];
		if (backupValues.some((value) => value === null) && backupValues.some(Boolean)) {
			context.addIssue({
				code: 'custom',
				path: ['backupStorageIdentity'],
				message: 'Backup evidence must be complete'
			});
		}
		const restoreValues = [
			evidence.restoreDrillId,
			evidence.restoredSourceRevision,
			evidence.restoreVerifiedAt
		];
		if (restoreValues.some((value) => value === null) && restoreValues.some(Boolean)) {
			context.addIssue({
				code: 'custom',
				path: ['restoreDrillId'],
				message: 'Restore evidence must be complete'
			});
		}
		if (
			evidence.restoredSourceRevision !== null &&
			evidence.restoredSourceRevision !== evidence.sourceRevision
		) {
			context.addIssue({
				code: 'custom',
				path: ['restoredSourceRevision'],
				message: 'Restore evidence must match the exact source revision'
			});
		}
		if (Date.parse(evidence.evidenceExpiresAt) <= Date.parse(evidence.canonicalSourceVerifiedAt)) {
			context.addIssue({
				code: 'custom',
				path: ['evidenceExpiresAt'],
				message: 'Recovery evidence expiry must follow source verification'
			});
		}
	});

export const SourceDurabilityCheckSchema = z
	.object({
		id: IdentifierSchema,
		status: z.enum(['passed', 'attention', 'blocked']),
		summary: z.string().min(1).max(240)
	})
	.strict();

export const SourceDurabilityReportSchema = z
	.object({
		contract: z.literal('tend.host/sites-source-durability-report/v1'),
		sourceId: IdentifierSchema,
		projectId: IdentifierSchema,
		sourceRevision: Sha256HexSchema,
		state: SourceDurabilityStateSchema,
		checks: z.array(SourceDurabilityCheckSchema).length(4),
		recommendation: z.enum(['none', 'configure_backup', 'reverify_source']),
		evaluatedAt: z.iso.datetime({ offset: true })
	})
	.strict();

export type SourceStorageAdapter = z.infer<typeof SourceStorageAdapterSchema>;
export type SourceLocation = z.infer<typeof SourceLocationSchema>;
export type ResumableDraftLease = z.infer<typeof ResumableDraftLeaseSchema>;
export type SourceRecoveryEvidence = z.infer<typeof SourceRecoveryEvidenceSchema>;
export type SourceDurabilityReport = z.infer<typeof SourceDurabilityReportSchema>;

export function assessSourceDurability(
	locationInput: SourceLocation,
	evidenceInput: SourceRecoveryEvidence,
	evaluatedAtInput: string
): SourceDurabilityReport {
	const location = SourceLocationSchema.parse(locationInput);
	const evidence = SourceRecoveryEvidenceSchema.parse(evidenceInput);
	const evaluatedAt = z.iso.datetime({ offset: true }).parse(evaluatedAtInput);
	for (const field of ['sourceId', 'projectId', 'sourceRevision'] as const) {
		if (location[field] !== evidence[field]) {
			throw new Error(`Recovery evidence ${field} does not match the canonical source`);
		}
	}

	const evaluationTime = Date.parse(evaluatedAt);
	const isAdmissibleTime = (value: string | null) =>
		value !== null && Date.parse(value) <= evaluationTime;
	const evidenceIsLive =
		Date.parse(location.configuredAt) <= evaluationTime &&
		isAdmissibleTime(evidence.canonicalSourceVerifiedAt) &&
		Date.parse(evidence.canonicalSourceVerifiedAt) >= Date.parse(location.configuredAt) &&
		evaluationTime < Date.parse(evidence.evidenceExpiresAt);
	const localHistory = evidenceIsLive && isAdmissibleTime(evidence.localHistoryVerifiedAt);
	const externalRepository =
		evidenceIsLive &&
		location.adapter === 'external_git_repository' &&
		evidence.externalRepositoryRevision === location.sourceRevision &&
		isAdmissibleTime(evidence.externalRepositoryVerifiedAt);
	const verifiedBackup =
		evidenceIsLive &&
		evidence.backupStorageIdentity !== null &&
		evidence.backupSnapshotSha256 !== null &&
		isAdmissibleTime(evidence.backupVerifiedAt);
	const restoreDrill =
		evidenceIsLive &&
		evidence.restoreDrillId !== null &&
		evidence.restoredSourceRevision === location.sourceRevision &&
		isAdmissibleTime(evidence.restoreVerifiedAt);

	const state =
		verifiedBackup || restoreDrill
			? 'protected'
			: externalRepository
				? 'external_repository'
				: localHistory
					? 'versioned_only'
					: 'at_risk';

	return SourceDurabilityReportSchema.parse({
		contract: 'tend.host/sites-source-durability-report/v1',
		sourceId: location.sourceId,
		projectId: location.projectId,
		sourceRevision: location.sourceRevision,
		state,
		checks: [
			{
				id: 'canonical_source',
				status: evidenceIsLive ? 'passed' : 'blocked',
				summary: evidenceIsLive
					? 'Canonical source evidence is current'
					: 'Canonical source evidence must be refreshed'
			},
			{
				id: 'version_history',
				status: localHistory || externalRepository ? 'passed' : 'attention',
				summary:
					localHistory || externalRepository
						? 'Version history is verified'
						: 'Version history has not been verified'
			},
			{
				id: 'recovery_copy',
				status: verifiedBackup || externalRepository ? 'passed' : 'attention',
				summary:
					verifiedBackup || externalRepository
						? 'A recovery copy is verified'
						: 'No verified external recovery copy is recorded'
			},
			{
				id: 'restore_drill',
				status: restoreDrill ? 'passed' : 'attention',
				summary: restoreDrill
					? 'A restore drill is verified'
					: 'A restore drill has not been verified'
			}
		],
		recommendation:
			state === 'at_risk'
				? 'reverify_source'
				: state === 'versioned_only'
					? 'configure_backup'
					: 'none',
		evaluatedAt
	});
}
