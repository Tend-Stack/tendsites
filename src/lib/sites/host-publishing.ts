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
		hostname: HostnameSchema,
		url: z.url().nullable(),
		state: z.enum(['queued', 'running', 'ready', 'failed']),
		artifact: SitePublishArtifactSchema.nullable(),
		traffic: z
			.object({
				decision: z.enum(['switch', 'retain_previous']),
				health: z.enum(['passed', 'failed', 'timed_out']),
				previousArtifactSha256: Sha256HexSchema.nullable(),
				rollbackRetained: z.boolean()
			})
			.strict()
			.nullable(),
		requestedAt: z.iso.datetime({ offset: true }),
		completedAt: z.iso.datetime({ offset: true }).nullable(),
		errorCode: z.string().min(1).max(120).nullable()
	})
	.strict()
	.superRefine((value, context) => {
		if (value.state === 'ready') {
			if (!value.url || !value.artifact || !value.traffic) {
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
		} else if (value.url !== null) {
			context.addIssue({ code: 'custom', message: 'Only a ready deployment may expose a URL' });
		}
		if (value.state === 'failed' && value.traffic?.decision !== 'retain_previous') {
			context.addIssue({
				code: 'custom',
				message: 'A failed deployment must retain prior traffic'
			});
		}
	});

export type SitePublishRequest = z.infer<typeof SitePublishRequestSchema>;
export type SitePublishResult = z.infer<typeof SitePublishResultSchema>;

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
