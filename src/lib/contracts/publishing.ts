import { z } from 'zod';
import { IdentifierSchema, RelativeProjectPathSchema, Sha256HexSchema } from './sites';

export const CommitPlanSchema = z
	.object({
		contract: z.literal('tend.host/sites-commit-plan/v1'),
		planId: z.uuid(),
		projectId: IdentifierSchema,
		changeSetId: z.uuid(),
		baseRevision: Sha256HexSchema,
		branch: z.string().regex(/^[A-Za-z0-9._/-]{1,160}$/),
		message: z.string().min(1).max(200),
		fileDigests: z
			.array(
				z.object({ path: RelativeProjectPathSchema, sha256: Sha256HexSchema.nullable() }).strict()
			)
			.min(1)
			.max(250),
		reviewedAt: z.iso.datetime({ offset: true }),
		canCommit: z.literal(false)
	})
	.strict()
	.refine(
		(value) =>
			new Set(value.fileDigests.map((file) => file.path)).size === value.fileDigests.length,
		'Commit paths must be unique'
	);
export const ArtifactIdentitySchema = z
	.object({
		contract: z.literal('tend.host/sites-artifact-identity/v1'),
		artifactSha256: Sha256HexSchema,
		commitSha256: Sha256HexSchema,
		recipeSha256: Sha256HexSchema,
		platform: z.string().regex(/^[a-z0-9]+\/[a-z0-9_]+$/),
		sbomSha256: Sha256HexSchema,
		provenanceSha256: Sha256HexSchema,
		builtAt: z.iso.datetime({ offset: true })
	})
	.strict();
export const TrafficDecisionSchema = z
	.object({
		contract: z.literal('tend.host/sites-traffic-decision/v1'),
		deploymentId: z.uuid(),
		candidateArtifactSha256: Sha256HexSchema,
		previousArtifactSha256: Sha256HexSchema.nullable(),
		health: z.enum(['passed', 'failed', 'timed_out']),
		readinessChecks: z.number().int().min(1),
		passedChecks: z.number().int().min(0),
		decision: z.enum(['switch', 'retain_previous']),
		canRoute: z.literal(false)
	})
	.strict();
export const DomainEvidenceSchema = z
	.object({
		contract: z.literal('tend.host/sites-domain-evidence/v1'),
		projectId: IdentifierSchema,
		hostname: z
			.string()
			.regex(/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/),
		ownership: z.enum(['pending', 'verified']),
		dnsSha256: Sha256HexSchema.nullable(),
		tls: z.enum(['pending', 'ready', 'failed']),
		certificateSha256: Sha256HexSchema.nullable(),
		canAssign: z.literal(false)
	})
	.strict()
	.superRefine((value, context) => {
		if ((value.ownership === 'verified') !== (value.dnsSha256 !== null))
			context.addIssue({ code: 'custom', message: 'DNS ownership evidence is inconsistent' });
		if ((value.tls === 'ready') !== (value.certificateSha256 !== null))
			context.addIssue({ code: 'custom', message: 'TLS evidence is inconsistent' });
	});
export const RecoveryMatrixSchema = z
	.object({
		contract: z.literal('tend.host/sites-recovery-matrix/v1'),
		policies: z
			.array(
				z
					.object({
						dependency: z.enum([
							'provider',
							'queue',
							'worker',
							'registry',
							'destination',
							'acknowledgement'
						]),
						acceptedWork: z.enum(['pause', 'finish_and_spool', 'reconcile']),
						retry: z.enum(['never_automatic', 'after_authoritative_recovery']),
						customerState: z.enum(['online_unchanged', 'preview_unavailable', 'manual_attention'])
					})
					.strict()
			)
			.length(6)
	})
	.strict();

export function decideTraffic(
	deploymentId: string,
	candidate: string,
	previous: string | null,
	health: 'passed' | 'failed' | 'timed_out',
	readinessChecks: number,
	passedChecks: number
) {
	const decision =
		health === 'passed' && readinessChecks === passedChecks ? 'switch' : 'retain_previous';
	return TrafficDecisionSchema.parse({
		contract: 'tend.host/sites-traffic-decision/v1',
		deploymentId,
		candidateArtifactSha256: candidate,
		previousArtifactSha256: previous,
		health,
		readinessChecks,
		passedChecks,
		decision,
		canRoute: false
	});
}
export function validateRecoveryMatrix(input: z.input<typeof RecoveryMatrixSchema>) {
	const matrix = RecoveryMatrixSchema.parse(input);
	if (new Set(matrix.policies.map((policy) => policy.dependency)).size !== 6)
		throw new Error('Recovery matrix must cover each dependency once');
	return matrix;
}
