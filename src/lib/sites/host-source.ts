import { z } from 'zod';

import {
	AdoptionPolicySchema,
	AdoptionReportSchema,
	assessSourceSnapshot
} from '../contracts/adoption';
import { RepositoryInspectionResultSchema } from '../contracts/repository-inspection';
import type { HostCreationBridge } from './host-creation';
import type { HostPreviewBridge } from './host-preview';
import type { HostPublishingBridge } from './host-publishing';
import type { HostSourceCommitBridge } from './host-source-commit';

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
		siteProjection: z.unknown().optional(),
		productionDestinationAvailable: z.literal(false)
	})
	.strict();

export type ConnectedRepository = z.infer<typeof ConnectedRepositorySchema>;
export type ConnectedRepositoryBranch = z.infer<typeof ConnectedRepositoryBranchSchema>;
export type ConnectedRepositoryReport = z.infer<typeof ConnectedRepositoryReportSchema>;

export const ImportedSiteProjectionSchema = z
	.object({
		contract: z.literal('tend.host/sites-inert-content-projection/v1'),
		pages: z
			.array(
				z
					.object({
						path: z.string().min(1).max(240),
						title: z.string().min(1).max(120),
						summary: z.string().max(500),
						sections: z
							.array(
								z.object({ title: z.string().min(1).max(120), body: z.string().max(800) }).strict()
							)
							.max(8)
					})
					.strict()
			)
			.max(50),
		posts: z
			.array(
				z
					.object({
						path: z.string().min(1).max(240),
						title: z.string().min(1).max(120),
						summary: z.string().max(500),
						body: z.string().max(20_000),
						publishedAt: z.string().max(40).nullable().optional(),
						tags: z.array(z.string().min(1).max(40)).max(20).optional(),
						hero: z.string().max(240).nullable().optional()
					})
					.strict()
			)
			.max(100),
		canonicalUrl: z.url().nullable(),
		warnings: z.array(z.string().min(1).max(240)).max(8)
	})
	.strict();

export type ImportedSiteProjection = z.infer<typeof ImportedSiteProjectionSchema>;

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
		repositoryMutationAvailable: z.boolean(),
		publishingAvailable: z.literal(false)
	})
	// The host may add non-authoritative onboarding/presentation evidence between
	// extension releases. Strip those additive fields while keeping repository,
	// digest, mutation, and publishing claims fully validated above.
	.strip();

export type ConnectedSourceEvidence = z.infer<typeof ConnectedSourceEvidenceSchema>;

export const ConnectedSourceCacheSchema = z
	.object({
		contract: z.literal('tend.host/sites-connected-source-cache/v1'),
		evidence: ConnectedSourceEvidenceSchema
	})
	.strict();

const onboardingStageRank = {
	source_connected: 0,
	mode_selected: 1,
	plan_reviewed: 2
} as const;

export function reconcileConnectedSourceCache(
	authoritative: ConnectedSourceEvidence,
	cached: ConnectedSourceEvidence | null
): ConnectedSourceEvidence {
	if (
		!cached ||
		cached.connectionId !== authoritative.connectionId ||
		cached.commit !== authoritative.commit ||
		onboardingStageRank[cached.onboarding.stage] <=
			onboardingStageRank[authoritative.onboarding.stage]
	) {
		return authoritative;
	}
	return ConnectedSourceEvidenceSchema.parse({
		...authoritative,
		onboarding: cached.onboarding
	});
}

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

export type HostSourceBridge = Partial<
	HostCreationBridge & HostPreviewBridge & HostSourceCommitBridge & HostPublishingBridge
> & {
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
	listConnections?(): Promise<ConnectedSourceEvidence[]>;
	loadWorkspace?(projectId: string): Promise<ImportedSiteProjection>;
	publishConnectedPost?(input: {
		operationId: string;
		projectId: string;
		connectionId: string;
		baseGitCommit: string;
		slug: string;
		title: string;
		excerpt: string;
		body: string;
		tags: string[];
		publishedAt: string | null;
	}): Promise<{
		contract: 'tend.host/sites-connected-content-result/v1';
		operationId: string;
		projectId: string;
		path: string;
		gitCommit: string;
		state: 'committed' | 'committed_refresh_required';
	}>;
	updateConnectionSetup?(input: {
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
