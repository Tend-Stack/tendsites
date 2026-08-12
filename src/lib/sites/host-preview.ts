import { z } from 'zod';

import { IdentifierSchema, Sha256HexSchema } from '../contracts/sites';

export const SitePreviewSchema = z
	.object({
		contract: z.literal('tend.host/sites-preview/v1'),
		previewId: z.string().min(1).max(64),
		projectId: IdentifierSchema,
		sourceId: IdentifierSchema,
		sourceRevision: Sha256HexSchema,
		gitCommit: z.string().regex(/^[a-f0-9]{40}$/),
		hostname: z.string().min(4).max(253),
		url: z.url().nullable(),
		generation: z.number().int().positive(),
		state: z.enum(['queued', 'running', 'ready', 'failed', 'expired', 'superseded', 'cleaned']),
		requestedAt: z.iso.datetime({ offset: true }),
		startedAt: z.iso.datetime({ offset: true }).nullable(),
		readyAt: z.iso.datetime({ offset: true }).nullable(),
		expiresAt: z.iso.datetime({ offset: true }),
		artifact: z
			.object({
				sha256: Sha256HexSchema,
				files: z.number().int().nonnegative(),
				bytes: z.number().int().nonnegative(),
				builderImage: z.string().min(1).max(300),
				serverImage: z.string().min(1).max(300),
				recipeSha256: Sha256HexSchema.optional(),
				sbomSha256: Sha256HexSchema.optional(),
				platform: z
					.string()
					.regex(/^linux\/(?:amd64|arm64)$/)
					.optional()
			})
			.strict()
			.nullable(),
		errorCode: z.string().max(120).nullable()
	})
	.strict();

export type SitePreview = z.infer<typeof SitePreviewSchema>;

export type HostPreviewBridge = {
	listPreviews(projectId?: string): Promise<SitePreview[]>;
	getPreview(previewId: string): Promise<SitePreview>;
	requestPreview(input: {
		projectId: string;
		sourceId: string;
		sourceRevision: string;
		gitCommit: string;
		hostname: string;
		expiresInMinutes?: number;
	}): Promise<SitePreview>;
	cleanupPreview(previewId: string): Promise<SitePreview>;
};
