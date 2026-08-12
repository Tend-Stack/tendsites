import { z } from 'zod';

import {
	AssignedHostContextSchema,
	HostOperationRequestSchema
} from '../contracts/host-operations';
import { SourceLocationSchema } from '../contracts/source-storage';
import { IdentifierSchema, Sha256HexSchema } from '../contracts/sites';
import { StarterArchiveSchema, type StarterArchive } from '../starters/archives';

export const CreationServerSchema = z
	.object({
		id: z.string().min(1).max(96),
		name: z.string().min(1).max(120),
		local: z.boolean(),
		ready: z.boolean(),
		reason: z.string().max(240).nullable()
	})
	.strict();

export const CreationAssignmentSchema = z
	.object({
		contract: z.literal('tend.host/sites-creation-assignment/v1'),
		context: AssignedHostContextSchema,
		server: z.object({ id: z.string().min(1).max(96), name: z.string().min(1).max(120) }).strict()
	})
	.strict();

const SourceBindingSchema = z
	.object({
		contract: z.literal('tend.host/sites-source-binding-evidence/v1'),
		source: SourceLocationSchema,
		sourceLocationSha256: Sha256HexSchema,
		authorityOperationId: z.uuid(),
		state: z.literal('bound')
	})
	.strict();

export const SiteCreationResultSchema = z
	.object({
		contract: z.literal('tend.host/sites-creation-result/v1'),
		operationId: z.uuid(),
		projectId: IdentifierSchema,
		name: z.string().min(1).max(120),
		server: z.object({ id: z.string().min(1).max(96), name: z.string().min(1).max(120) }).strict(),
		source: SourceBindingSchema,
		gitCommit: z.string().regex(/^[a-f0-9]{40}$/),
		created: z.boolean(),
		durability: z.literal('versioned_only'),
		completedAt: z.iso.datetime({ offset: true })
	})
	.strict();

export const CreatedSiteSummarySchema = z
	.object({
		projectId: IdentifierSchema,
		name: z.string().min(1).max(120),
		sourceId: IdentifierSchema,
		sourceRevision: Sha256HexSchema,
		gitCommit: z.string().regex(/^[a-f0-9]{40}$/),
		serverName: z.string().min(1).max(120),
		durability: z.literal('versioned_only'),
		createdAt: z.iso.datetime({ offset: true }),
		updatedAt: z.iso.datetime({ offset: true }).optional()
	})
	.strict();

export type CreationServer = z.infer<typeof CreationServerSchema>;
export type CreationAssignment = z.infer<typeof CreationAssignmentSchema>;
export type SiteCreationResult = z.infer<typeof SiteCreationResultSchema>;
export type CreatedSiteSummary = z.infer<typeof CreatedSiteSummarySchema>;

export type HostCreationBridge = {
	listCreationServers(): Promise<CreationServer[]>;
	listCreatedSites(): Promise<CreatedSiteSummary[]>;
	assignSiteCreation(input: { projectId: string; serverId: string }): Promise<CreationAssignment>;
	executeSiteCreation(input: {
		serverId: string;
		request: z.infer<typeof HostOperationRequestSchema>;
		archive: StarterArchive;
	}): Promise<SiteCreationResult>;
};

export function validateStarterForCreation(input: StarterArchive): StarterArchive {
	return StarterArchiveSchema.parse(input);
}
