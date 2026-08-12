import { z } from 'zod';

import { IdentifierSchema, Sha256HexSchema } from '../contracts/sites';

export const SourceCommitRequestSchema = z
	.object({
		contract: z.literal('tend.host/sites-source-commit-request/v1'),
		operationId: z.uuid(),
		projectId: IdentifierSchema,
		sourceId: IdentifierSchema,
		baseRevision: Sha256HexSchema,
		baseGitCommit: z.string().regex(/^[a-f0-9]{40}$/),
		archiveSha256: Sha256HexSchema,
		archiveBytes: z.number().int().positive().max(35_000_000),
		requestedAt: z.iso.datetime({ offset: true })
	})
	.strict();

export const SourceCommitResultSchema = z
	.object({
		contract: z.literal('tend.host/sites-source-commit-result/v1'),
		operationId: z.uuid(),
		projectId: IdentifierSchema,
		sourceId: IdentifierSchema,
		parentRevision: Sha256HexSchema,
		sourceRevision: Sha256HexSchema,
		gitCommit: z.string().regex(/^[a-f0-9]{40}$/),
		created: z.boolean(),
		committedAt: z.iso.datetime({ offset: true })
	})
	.strict();

export type SourceCommitRequest = z.infer<typeof SourceCommitRequestSchema>;
export type SourceCommitResult = z.infer<typeof SourceCommitResultSchema>;

export type HostSourceCommitBridge = {
	commitCreatedSite(input: {
		request: SourceCommitRequest;
		archive: Uint8Array;
		filename: string;
	}): Promise<SourceCommitResult>;
};

export function createSourceCommitRequest(input: {
	operationId: string;
	projectId: string;
	sourceId: string;
	baseRevision: string;
	baseGitCommit: string;
	archiveSha256: string;
	archiveBytes: number;
	requestedAt: string;
}): SourceCommitRequest {
	return SourceCommitRequestSchema.parse({
		contract: 'tend.host/sites-source-commit-request/v1',
		...input
	});
}
