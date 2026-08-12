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

export type HostSourceBridge = {
	listRepositories(query?: string): Promise<ConnectedRepository[]>;
	listBranches(owner: string, repository: string): Promise<ConnectedRepositoryBranch[]>;
	inspectRepository(input: {
		owner: string;
		repository: string;
		ref: string;
		projectId: string;
	}): Promise<ConnectedRepositoryReport>;
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
