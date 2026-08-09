import { z } from 'zod';

import { IdentifierSchema, Sha256HexSchema } from './sites';

export const PreviewExecutionPolicySchema = z
	.object({
		contract: z.literal('tend.host/sites-preview-policy/v1'),
		policyId: IdentifierSchema,
		separateOrigin: z.literal(true),
		panelCredentials: z.literal(false),
		secrets: z.literal('none'),
		network: z.enum(['none', 'public_packages']),
		maxSeconds: z.number().int().min(10).max(1_800),
		maxMemoryMiB: z.number().int().min(128).max(16_384),
		maxDiskMiB: z.number().int().min(128).max(100_000),
		maxLogBytes: z.number().int().min(1_024).max(20_000_000),
		ttlSeconds: z.number().int().min(60).max(86_400),
		requiredChecks: z.array(IdentifierSchema).min(1).max(32)
	})
	.strict()
	.refine((policy) => new Set(policy.requiredChecks).size === policy.requiredChecks.length, {
		path: ['requiredChecks'],
		message: 'Required preview checks must be unique'
	});

export const RequiredCheckEvidenceSchema = z
	.object({
		checkId: IdentifierSchema,
		checkVersion: z.string().min(1).max(80),
		status: z.enum(['passed', 'failed', 'not_supported']),
		durationMs: z.number().int().min(0).max(1_800_000),
		summary: z.string().min(1).max(500),
		evidenceSha256: Sha256HexSchema.nullable()
	})
	.strict()
	.refine((check) => check.status === 'not_supported' || check.evidenceSha256 !== null, {
		path: ['evidenceSha256'],
		message: 'Executed checks require evidence'
	});

export const PreviewExecutionEvidenceSchema = z
	.object({
		contract: z.literal('tend.host/sites-preview-execution-evidence/v1'),
		previewId: z.uuid(),
		policyId: IdentifierSchema,
		snapshotId: z.uuid(),
		changeSetId: z.uuid(),
		artifactSha256: Sha256HexSchema,
		previewUrl: z.url().startsWith('https://'),
		startedAt: z.iso.datetime({ offset: true }),
		finishedAt: z.iso.datetime({ offset: true }),
		expiresAt: z.iso.datetime({ offset: true }),
		memoryPeakMiB: z.number().min(0),
		diskPeakMiB: z.number().min(0),
		logBytes: z.number().int().min(0),
		checks: z.array(RequiredCheckEvidenceSchema).min(1).max(32)
	})
	.strict();

export const PreviewAssessmentSchema = z
	.object({
		contract: z.literal('tend.host/sites-preview-assessment/v1'),
		previewId: z.uuid(),
		status: z.enum(['ready', 'failed', 'expired']),
		failureCodes: z.array(IdentifierSchema).max(40),
		canDeploy: z.literal(false),
		blockedReason: z.literal('host_deployment_capability_required')
	})
	.strict();

export type PreviewExecutionPolicy = z.infer<typeof PreviewExecutionPolicySchema>;
export type PreviewExecutionEvidence = z.infer<typeof PreviewExecutionEvidenceSchema>;
export type PreviewAssessment = z.infer<typeof PreviewAssessmentSchema>;

export function assessPreviewEvidence(
	policyInput: PreviewExecutionPolicy,
	evidenceInput: PreviewExecutionEvidence,
	panelOrigin: string,
	evaluatedAt: string
): PreviewAssessment {
	const policy = PreviewExecutionPolicySchema.parse(policyInput);
	const evidence = PreviewExecutionEvidenceSchema.parse(evidenceInput);
	const evaluationTime = Date.parse(z.iso.datetime({ offset: true }).parse(evaluatedAt));
	if (evidence.policyId !== policy.policyId)
		throw new Error('Preview policy binding does not match');
	if (new URL(evidence.previewUrl).origin === new URL(panelOrigin).origin) {
		throw new Error('Preview must use a separate origin');
	}
	const started = Date.parse(evidence.startedAt);
	const finished = Date.parse(evidence.finishedAt);
	const expires = Date.parse(evidence.expiresAt);
	if (finished < started) throw new Error('Preview completion precedes start');
	if (evaluationTime < finished) throw new Error('Preview evidence completion is in the future');
	if (expires <= finished || expires - finished > policy.ttlSeconds * 1000) {
		throw new Error('Preview expiry exceeds policy');
	}
	const failures: string[] = [];
	if (finished - started > policy.maxSeconds * 1000) failures.push('time_limit_exceeded');
	if (evidence.memoryPeakMiB > policy.maxMemoryMiB) failures.push('memory_limit_exceeded');
	if (evidence.diskPeakMiB > policy.maxDiskMiB) failures.push('disk_limit_exceeded');
	if (evidence.logBytes > policy.maxLogBytes) failures.push('log_limit_exceeded');
	const checkIds = evidence.checks.map((check) => check.checkId);
	if (new Set(checkIds).size !== checkIds.length)
		throw new Error('Preview check evidence is duplicated');
	for (const required of policy.requiredChecks) {
		const check = evidence.checks.find((candidate) => candidate.checkId === required);
		if (!check) failures.push(`required_check_missing_${required}`);
		else if (check.status !== 'passed') failures.push(`required_check_${check.status}_${required}`);
	}
	const expired = evaluationTime >= expires;
	return PreviewAssessmentSchema.parse({
		contract: 'tend.host/sites-preview-assessment/v1',
		previewId: evidence.previewId,
		status: expired ? 'expired' : failures.length === 0 ? 'ready' : 'failed',
		failureCodes: failures,
		canDeploy: false,
		blockedReason: 'host_deployment_capability_required'
	});
}
