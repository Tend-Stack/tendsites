import { z } from 'zod';

import { IdentifierSchema, Sha256HexSchema } from './sites';

const GitCommitSchema = z.string().regex(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/);

export const SourceSnapshotSchema = z
	.object({
		contract: z.literal('tend.host/sites-source-snapshot/v1'),
		snapshotId: z.uuid(),
		provider: z.enum(['github', 'gitlab', 'bitbucket', 'git']),
		providerInstallationId: IdentifierSchema,
		repositoryId: IdentifierSchema,
		commit: GitCommitSchema,
		treeSha256: Sha256HexSchema,
		archiveSha256: Sha256HexSchema,
		actorId: IdentifierSchema,
		trustClass: z.enum(['protected', 'untrusted_fork', 'untrusted_pull_request']),
		fileCount: z.number().int().min(1).max(1_000_000),
		archiveBytes: z.number().int().min(1).max(10_000_000_000),
		hasSubmodules: z.boolean(),
		hasLfsPointers: z.boolean(),
		hasPrivateDependencies: z.boolean(),
		createdAt: z.iso.datetime({ offset: true }),
		expiresAt: z.iso.datetime({ offset: true })
	})
	.strict()
	.refine((snapshot) => Date.parse(snapshot.expiresAt) > Date.parse(snapshot.createdAt), {
		path: ['expiresAt'],
		message: 'Snapshot expiry must follow creation'
	});

export const AdoptionPolicySchema = z
	.object({
		contract: z.literal('tend.host/sites-adoption-policy/v1'),
		maxFiles: z.number().int().min(1).max(100_000),
		maxArchiveBytes: z.number().int().min(1).max(2_000_000_000),
		allowSubmodules: z.boolean(),
		allowLfsPointers: z.boolean(),
		allowPrivateDependencies: z.boolean(),
		allowUntrustedSource: z.boolean()
	})
	.strict();

export const AdoptionCheckSchema = z
	.object({
		id: IdentifierSchema,
		status: z.enum(['passed', 'attention', 'blocked']),
		summary: z.string().min(1).max(240)
	})
	.strict();

export const AdoptionReportSchema = z
	.object({
		contract: z.literal('tend.host/sites-adoption-report/v1'),
		snapshotId: z.uuid(),
		repositoryId: IdentifierSchema,
		commit: GitCommitSchema,
		status: z.enum(['compatible', 'attention', 'rejected']),
		checks: z.array(AdoptionCheckSchema).min(1).max(32),
		secretsAvailable: z.literal(false),
		productionDestinationAvailable: z.literal(false),
		evaluatedAt: z.iso.datetime({ offset: true })
	})
	.strict();

export type SourceSnapshot = z.infer<typeof SourceSnapshotSchema>;
export type AdoptionPolicy = z.infer<typeof AdoptionPolicySchema>;
export type AdoptionReport = z.infer<typeof AdoptionReportSchema>;

export function assessSourceSnapshot(
	snapshotInput: SourceSnapshot,
	policyInput: AdoptionPolicy,
	evaluatedAt: string
): AdoptionReport {
	const snapshot = SourceSnapshotSchema.parse(snapshotInput);
	const policy = AdoptionPolicySchema.parse(policyInput);
	const evaluationTime = Date.parse(z.iso.datetime({ offset: true }).parse(evaluatedAt));
	const checks: z.infer<typeof AdoptionCheckSchema>[] = [];
	const check = (id: string, blocked: boolean, passedSummary: string, blockedSummary: string) =>
		checks.push({
			id,
			status: blocked ? 'blocked' : 'passed',
			summary: blocked ? blockedSummary : passedSummary
		});

	check(
		'snapshot_not_future',
		evaluationTime < Date.parse(snapshot.createdAt),
		'Snapshot creation time is admissible',
		'Snapshot creation time is in the future'
	);
	check(
		'snapshot_fresh',
		evaluationTime >= Date.parse(snapshot.expiresAt),
		'Snapshot is current',
		'Snapshot has expired and must be reacquired'
	);
	check(
		'file_limit',
		snapshot.fileCount > policy.maxFiles,
		'Repository file count is bounded',
		'Repository exceeds the file-count limit'
	);
	check(
		'archive_limit',
		snapshot.archiveBytes > policy.maxArchiveBytes,
		'Repository archive size is bounded',
		'Repository archive exceeds the byte limit'
	);
	check(
		'submodules',
		snapshot.hasSubmodules && !policy.allowSubmodules,
		'Submodule policy is satisfied',
		'Submodules are not allowed by this adoption policy'
	);
	check(
		'lfs',
		snapshot.hasLfsPointers && !policy.allowLfsPointers,
		'Large-file policy is satisfied',
		'Git LFS pointers are not allowed by this adoption policy'
	);
	check(
		'private_dependencies',
		snapshot.hasPrivateDependencies && !policy.allowPrivateDependencies,
		'Private dependency policy is satisfied',
		'Private dependencies require an explicitly approved build policy'
	);
	check(
		'source_trust',
		snapshot.trustClass !== 'protected' && !policy.allowUntrustedSource,
		'Fork and pull-request trust policy is satisfied',
		'Untrusted fork or pull-request source is not approved'
	);

	return AdoptionReportSchema.parse({
		contract: 'tend.host/sites-adoption-report/v1',
		snapshotId: snapshot.snapshotId,
		repositoryId: snapshot.repositoryId,
		commit: snapshot.commit,
		status: checks.some((item) => item.status === 'blocked') ? 'rejected' : 'compatible',
		checks,
		secretsAvailable: false,
		productionDestinationAvailable: false,
		evaluatedAt
	});
}
