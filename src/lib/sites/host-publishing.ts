import { z } from 'zod';

import { IdentifierSchema, Sha256HexSchema } from '../contracts/sites';

const GitCommitSchema = z.string().regex(/^[a-f0-9]{40}$/);
const HostnameSchema = z
	.string()
	.regex(/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/);

export const SitePublishRequestSchema = z
	.object({
		contract: z.literal('tend.host/sites-publish-request/v1'),
		operationId: z.uuid(),
		projectId: IdentifierSchema,
		sourceId: IdentifierSchema,
		sourceRevision: Sha256HexSchema,
		gitCommit: GitCommitSchema,
		previewId: z.string().min(1).max(64),
		previewArtifactSha256: Sha256HexSchema,
		previewRecipeSha256: Sha256HexSchema,
		previewSbomSha256: Sha256HexSchema,
		previewPlatform: z.string().regex(/^linux\/(?:amd64|arm64)$/),
		hostname: HostnameSchema,
		requestedAt: z.iso.datetime({ offset: true })
	})
	.strict();

export const SitePublishArtifactSchema = z
	.object({
		sha256: Sha256HexSchema,
		files: z.number().int().positive(),
		bytes: z.number().int().positive(),
		recipeSha256: Sha256HexSchema,
		sbomSha256: Sha256HexSchema,
		provenanceSha256: Sha256HexSchema,
		platform: z.string().regex(/^linux\/(?:amd64|arm64)$/)
	})
	.strict();

export const SitePublishResultSchema = z
	.object({
		contract: z.literal('tend.host/sites-publish-result/v1'),
		operationId: z.uuid(),
		projectId: IdentifierSchema,
		sourceId: IdentifierSchema,
		sourceRevision: Sha256HexSchema,
		gitCommit: GitCommitSchema,
		previewId: z.string().min(1).max(64),
		previewArtifactSha256: Sha256HexSchema,
		previewRecipeSha256: Sha256HexSchema,
		previewSbomSha256: Sha256HexSchema,
		previewPlatform: z.string().regex(/^linux\/(?:amd64|arm64)$/),
		hostname: HostnameSchema,
		url: z.url().nullable(),
		state: z.enum(['queued', 'running', 'ready', 'failed']),
		artifact: SitePublishArtifactSchema.nullable(),
		traffic: z
			.object({
				deploymentId: z.uuid(),
				decision: z.enum(['switch', 'retain_previous']),
				health: z.enum(['passed', 'failed', 'timed_out']),
				readinessChecks: z.number().int().positive(),
				passedChecks: z.number().int().nonnegative(),
				previousArtifactSha256: Sha256HexSchema.nullable(),
				rollbackRetained: z.boolean()
			})
			.strict()
			.nullable(),
		domain: z
			.object({
				ownership: z.enum(['pending', 'verified']),
				dnsSha256: Sha256HexSchema.nullable(),
				tls: z.enum(['pending', 'ready', 'failed']),
				certificateSha256: Sha256HexSchema.nullable()
			})
			.strict()
			.nullable(),
		requestedAt: z.iso.datetime({ offset: true }),
		completedAt: z.iso.datetime({ offset: true }).nullable(),
		errorCode: z.string().min(1).max(120).nullable()
	})
	.strict()
	.superRefine((value, context) => {
		const completed = value.state === 'ready' || value.state === 'failed';
		if (completed !== (value.completedAt !== null)) {
			context.addIssue({ code: 'custom', message: 'Completion time is inconsistent' });
		}
		if ((value.state === 'failed') !== (value.errorCode !== null)) {
			context.addIssue({ code: 'custom', message: 'Error evidence is inconsistent' });
		}
		if (value.traffic) {
			if (value.traffic.passedChecks > value.traffic.readinessChecks) {
				context.addIssue({ code: 'custom', message: 'Passed checks exceed attempted checks' });
			}
			const checksPassed =
				value.traffic.health === 'passed' &&
				value.traffic.passedChecks === value.traffic.readinessChecks;
			if ((value.traffic.decision === 'switch') !== checksPassed) {
				context.addIssue({
					code: 'custom',
					message: 'Traffic decision contradicts health evidence'
				});
			}
			if (value.traffic.rollbackRetained !== (value.traffic.previousArtifactSha256 !== null)) {
				context.addIssue({
					code: 'custom',
					message: 'Rollback retention evidence is inconsistent'
				});
			}
		}
		if (value.domain) {
			if ((value.domain.ownership === 'verified') !== (value.domain.dnsSha256 !== null)) {
				context.addIssue({ code: 'custom', message: 'DNS ownership evidence is inconsistent' });
			}
			if ((value.domain.tls === 'ready') !== (value.domain.certificateSha256 !== null)) {
				context.addIssue({ code: 'custom', message: 'TLS evidence is inconsistent' });
			}
		}
		if (value.state === 'ready') {
			if (!value.url || !value.artifact || !value.traffic || !value.domain) {
				context.addIssue({
					code: 'custom',
					message: 'A ready deployment requires complete evidence'
				});
			}
			if (value.traffic?.health !== 'passed' || value.traffic?.decision !== 'switch') {
				context.addIssue({
					code: 'custom',
					message: 'Only a healthy candidate may receive traffic'
				});
			}
			if (value.domain?.ownership !== 'verified' || value.domain?.tls !== 'ready') {
				context.addIssue({
					code: 'custom',
					message: 'A ready deployment requires DNS and TLS evidence'
				});
			}
			if (value.url !== `https://${value.hostname}`) {
				context.addIssue({
					code: 'custom',
					message: 'Ready URL must match the assigned HTTPS hostname'
				});
			}
		} else if (value.url !== null) {
			context.addIssue({ code: 'custom', message: 'Only a ready deployment may expose a URL' });
		}
		if (value.state === 'failed' && value.traffic?.decision !== 'retain_previous') {
			context.addIssue({
				code: 'custom',
				message: 'A failed deployment must retain prior traffic'
			});
		}
		if (
			(value.state === 'queued' || value.state === 'running') &&
			(value.artifact || value.traffic || value.domain)
		) {
			context.addIssue({
				code: 'custom',
				message: 'In-progress deployment cannot claim terminal evidence'
			});
		}
	});

export type SitePublishRequest = z.infer<typeof SitePublishRequestSchema>;
export type SitePublishResult = z.infer<typeof SitePublishResultSchema>;

const stateOrder = { queued: 0, running: 1, ready: 2, failed: 2 } as const;

export function validateSitePublishResult(
	requestInput: SitePublishRequest,
	resultInput: SitePublishResult,
	previousInput?: SitePublishResult
): SitePublishResult {
	const request = SitePublishRequestSchema.parse(requestInput);
	const result = SitePublishResultSchema.parse(resultInput);
	for (const field of [
		'operationId',
		'projectId',
		'sourceId',
		'sourceRevision',
		'gitCommit',
		'previewId',
		'previewArtifactSha256',
		'previewRecipeSha256',
		'previewSbomSha256',
		'previewPlatform',
		'hostname',
		'requestedAt'
	] as const) {
		if (request[field] !== result[field]) throw new Error(`Publish result ${field} does not match`);
	}
	if (result.artifact) {
		if (result.artifact.sha256 !== request.previewArtifactSha256)
			throw new Error('Publish result artifact does not match reviewed preview');
		if (result.artifact.recipeSha256 !== request.previewRecipeSha256)
			throw new Error('Publish result recipe does not match reviewed preview');
		if (result.artifact.sbomSha256 !== request.previewSbomSha256)
			throw new Error('Publish result SBOM does not match reviewed preview');
		if (result.artifact.platform !== request.previewPlatform)
			throw new Error('Publish result platform does not match reviewed preview');
	}
	if (previousInput) {
		const previous = validateSitePublishResult(request, previousInput);
		if (stateOrder[result.state] < stateOrder[previous.state])
			throw new Error('Publish result state regressed');
		if (stateOrder[previous.state] === 2 && JSON.stringify(result) !== JSON.stringify(previous))
			throw new Error('Terminal publish result changed');
	}
	return result;
}

export type HostPublishingBridge = {
	listPublishes(projectId?: string): Promise<SitePublishResult[]>;
	getPublish(operationId: string): Promise<SitePublishResult>;
	publishSite(request: SitePublishRequest): Promise<SitePublishResult>;
};

export function createSitePublishRequest(
	input: Omit<SitePublishRequest, 'contract' | 'operationId' | 'requestedAt'>
) {
	return SitePublishRequestSchema.parse({
		contract: 'tend.host/sites-publish-request/v1',
		operationId: crypto.randomUUID(),
		requestedAt: new Date().toISOString(),
		...input
	});
}
