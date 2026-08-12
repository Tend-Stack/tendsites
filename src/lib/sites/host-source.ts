import { z } from 'zod';

import {
	AdoptionPolicySchema,
	AdoptionReportSchema,
	assessSourceSnapshot
} from '../contracts/adoption';
import { RepositoryInspectionResultSchema } from '../contracts/repository-inspection';

export const ConnectedRepositorySchema = z
	.object({
		owner: z.string().min(1).max(100),
		name: z.string().min(1).max(100),
		fullName: z.string().min(3).max(201),
		private: z.boolean(),
		defaultBranch: z.string().min(1).max(255),
		description: z.string().max(240),
		pushedAt: z.string().nullable()
	})
	.strict();

export const ConnectedRepositoryBranchSchema = z
	.object({
		name: z.string().min(1).max(255),
		protected: z.boolean()
	})
	.strict();

export const ConnectedRepositoryReportSchema = z
	.object({
		contract: z.literal('tend.host/sites-connected-repository-report/v1'),
		inspection: RepositoryInspectionResultSchema,
		repository: z
			.object({
				owner: z.string().min(1).max(100),
				name: z.string().min(1).max(100),
				fullName: z.string().min(3).max(201),
				ref: z.string().min(1).max(255)
			})
			.strict(),
		framework: z.enum([
			'astro',
			'sveltekit',
			'nextjs',
			'jekyll',
			'eleventy',
			'javascript',
			'custom'
		]),
		contentPaths: z.array(z.string().min(1).max(240)).max(8),
		pagesDeployment: z
			.object({
				method: z.literal('github-actions'),
				sourceBranch: z.string().min(1).max(255).nullable(),
				sourcePath: z.string().min(1).max(240).nullable(),
				artifactPath: z.string().min(1).max(240).nullable(),
				customDomain: z.string().min(1).max(253).nullable()
			})
			.strict()
			.nullable(),
		productionDestinationAvailable: z.literal(false)
	})
	.strict();

export type ConnectedRepository = z.infer<typeof ConnectedRepositorySchema>;
export type ConnectedRepositoryBranch = z.infer<typeof ConnectedRepositoryBranchSchema>;
export type ConnectedRepositoryReport = z.infer<typeof ConnectedRepositoryReportSchema>;

export const ConnectedSourceEvidenceSchema = z
	.object({
		contract: z.literal('tend.host/sites-connected-source-evidence/v1'),
		connectionId: z.uuid(),
		projectId: z.string().min(1).max(96),
		provider: z.literal('github'),
		repository: z
			.object({
				owner: z.string().min(1).max(100),
				name: z.string().min(1).max(100),
				fullName: z.string().min(3).max(201),
				ref: z.string().min(1).max(255)
			})
			.strict(),
		commit: z.string().regex(/^[a-f0-9]{40}$/),
		treeSha256: z.string().regex(/^[a-f0-9]{64}$/),
		archiveSha256: z.string().regex(/^[a-f0-9]{64}$/),
		framework: ConnectedRepositoryReportSchema.shape.framework,
		contentPaths: z.array(z.string().min(1).max(240)).max(8),
		pagesDeployment: ConnectedRepositoryReportSchema.shape.pagesDeployment,
		connectedAt: z.iso.datetime({ offset: true }),
		verifiedAt: z.iso.datetime({ offset: true }),
		repositoryMutationAvailable: z.literal(false),
		publishingAvailable: z.literal(false)
	})
	.strict();

export type ConnectedSourceEvidence = z.infer<typeof ConnectedSourceEvidenceSchema>;

export const SourceControlConnectionsSchema = z
	.object({
		contract: z.literal('tend.host/source-control-connections/v1'),
		providers: z.array(
			z
				.object({
					id: z.enum(['github', 'gitlab', 'forgejo', 'bitbucket']),
					name: z.string().min(1).max(80),
					configured: z.boolean(),
					available: z.boolean(),
					authMode: z.enum(['github_app', 'personal_access_token']).nullable(),
					installUrl: z.url().nullable(),
					installations: z.array(
						z
							.object({
								owner: z.string().min(1).max(100),
								ownerType: z.string().max(40),
								repositorySelection: z.enum(['all', 'selected']),
								manageUrl: z.url().nullable()
							})
							.strict()
					),
					supports: z.array(z.enum(['repository-list', 'branches', 'read', 'deploy'])),
					error: z.string().max(240).nullable()
				})
				.strict()
		)
	})
	.strict();

export type SourceControlConnections = z.infer<typeof SourceControlConnectionsSchema>;

export type HostSourceBridge = {
	getSourceControlConnections(): Promise<SourceControlConnections>;
	beginSourceControlConnection(provider: string): Promise<void>;
	manageSourceControlAccess(provider: string): Promise<void>;
	listRepositories(query?: string): Promise<ConnectedRepository[]>;
	listBranches(owner: string, repository: string): Promise<ConnectedRepositoryBranch[]>;
	inspectRepository(input: {
		owner: string;
		repository: string;
		ref: string;
		projectId: string;
	}): Promise<ConnectedRepositoryReport>;
	getConnection(projectId: string): Promise<ConnectedSourceEvidence | null>;
	connectRepository(input: {
		owner: string;
		repository: string;
		ref: string;
		projectId: string;
		expectedCommit: string;
		expectedTreeSha256: string;
		expectedArchiveSha256: string;
		confirmation: string;
	}): Promise<ConnectedSourceEvidence>;
};

export const defaultAdoptionPolicy = AdoptionPolicySchema.parse({
	contract: 'tend.host/sites-adoption-policy/v1',
	maxFiles: 20_000,
	maxArchiveBytes: 250_000_000,
	allowSubmodules: false,
	allowLfsPointers: false,
	allowPrivateDependencies: false,
	allowUntrustedSource: false
});

export function assessConnectedRepository(report: ConnectedRepositoryReport) {
	return AdoptionReportSchema.parse(
		assessSourceSnapshot(
			report.inspection.snapshot,
			defaultAdoptionPolicy,
			new Date().toISOString()
		)
	);
}
