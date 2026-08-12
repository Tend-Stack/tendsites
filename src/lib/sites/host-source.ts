import { z } from 'zod';

import {
	AdoptionPolicySchema,
	AdoptionReportSchema,
	assessSourceSnapshot
} from '../contracts/adoption';
import { RepositoryInspectionResultSchema } from '../contracts/repository-inspection';
import type { HostCreationBridge } from './host-creation';

export const ConnectedRepositorySchema = z
	.object({
		provider: z.enum(['github', 'gitlab']),
		repositoryId: z.string().min(1).max(120),
		owner: z.string().min(1).max(180),
		name: z.string().min(1).max(100),
		fullName: z.string().min(3).max(281),
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
				owner: z.string().min(1).max(180),
				name: z.string().min(1).max(100),
				fullName: z.string().min(3).max(281),
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
				method: z.enum(['github-actions', 'gitlab-ci']),
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
		provider: z.enum(['github', 'gitlab']),
		repository: z
			.object({
				owner: z.string().min(1).max(180),
				name: z.string().min(1).max(100),
				fullName: z.string().min(3).max(281),
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
		onboarding: z
			.object({
				editingMode: z.enum(['visual', 'headless', 'hybrid']).nullable(),
				stage: z.enum(['source_connected', 'mode_selected', 'plan_reviewed']),
				updatedAt: z.iso.datetime({ offset: true }).nullable()
			})
			.strict()
			.optional()
			.default({ editingMode: null, stage: 'source_connected', updatedAt: null }),
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
					instanceUrl: z.url().nullable().optional(),
					installations: z.array(
						z
							.object({
								owner: z.string().min(1).max(100),
								ownerType: z.string().max(40),
								repositorySelection: z.enum(['all', 'selected', 'accessible']),
								manageUrl: z.url().nullable()
							})
							.strict()
					),
					tokenExpiresAt: z.string().max(32).nullable().optional(),
					privateNetwork: z.boolean().optional(),
					supports: z.array(z.enum(['repository-list', 'branches', 'read', 'deploy'])),
					error: z.string().max(240).nullable()
				})
				.strict()
		)
	})
	.strict();

export type SourceControlConnections = z.infer<typeof SourceControlConnectionsSchema>;

export type HostSourceBridge = Partial<HostCreationBridge> & {
	getSourceControlConnections(): Promise<SourceControlConnections>;
	beginSourceControlConnection(provider: string): Promise<void>;
	manageSourceControlAccess(provider: string): Promise<void>;
	listRepositories(provider: string, query?: string): Promise<ConnectedRepository[]>;
	listBranches(
		provider: string,
		repositoryId: string,
		owner: string,
		repository: string
	): Promise<ConnectedRepositoryBranch[]>;
	inspectRepository(input: {
		provider: string;
		repositoryId: string;
		owner: string;
		repository: string;
		ref: string;
		projectId: string;
	}): Promise<ConnectedRepositoryReport>;
	getConnection(projectId: string): Promise<ConnectedSourceEvidence | null>;
	updateConnectionSetup(input: {
		projectId: string;
		connectionId: string;
		editingMode: 'visual' | 'headless' | 'hybrid';
		stage: 'mode_selected' | 'plan_reviewed';
	}): Promise<ConnectedSourceEvidence>;
	connectRepository(input: {
		provider: string;
		repositoryId: string;
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
