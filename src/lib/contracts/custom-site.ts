import { z } from 'zod';

import {
	IdentifierSchema,
	JsonValueSchema,
	RelativeProjectPathSchema,
	Sha256HexSchema
} from './sites';

const GitCommitSchema = z.string().regex(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/);

export const SiteFrameworkSchema = z.enum([
	'sveltekit',
	'astro',
	'eleventy',
	'nextjs',
	'nuxt',
	'hugo',
	'jekyll',
	'custom'
]);

export const HeadlessContentFormatSchema = z.enum(['markdown', 'mdsvex', 'json', 'yaml', 'toml']);

export const HeadlessCollectionMappingSchema = z
	.object({
		id: IdentifierSchema,
		label: z.string().min(1).max(80),
		kind: z.enum(['pages', 'posts', 'docs', 'data']),
		directory: RelativeProjectPathSchema,
		format: HeadlessContentFormatSchema,
		titleField: IdentifierSchema.nullable(),
		bodyField: IdentifierSchema.nullable(),
		slugField: IdentifierSchema.nullable()
	})
	.strict()
	.superRefine((mapping, context) => {
		if (['json', 'yaml', 'toml'].includes(mapping.format) && !mapping.titleField) {
			context.addIssue({
				code: 'custom',
				path: ['titleField'],
				message: 'Structured content requires an explicit title field'
			});
		}
	});

export const CustomSiteProfileSchema = z
	.object({
		contract: z.literal('tend.host/sites-custom-site-profile/v1'),
		snapshotId: z.uuid(),
		repositoryId: IdentifierSchema,
		commit: GitCommitSchema,
		framework: SiteFrameworkSchema,
		rendererOwnership: z.literal('repository'),
		configuration: z.enum(['manifest', 'inferred']),
		visualEditing: z.enum(['supported_blocks', 'content_only']),
		collections: z.array(HeadlessCollectionMappingSchema).min(1).max(32),
		build: z
			.object({
				script: IdentifierSchema,
				output: RelativeProjectPathSchema
			})
			.strict()
	})
	.strict()
	.superRefine((profile, context) => {
		const ids = profile.collections.map((collection) => collection.id);
		const directories = profile.collections.map((collection) => collection.directory);
		if (new Set(ids).size !== ids.length) {
			context.addIssue({
				code: 'custom',
				path: ['collections'],
				message: 'Collection IDs must be unique'
			});
		}
		if (new Set(directories).size !== directories.length) {
			context.addIssue({
				code: 'custom',
				path: ['collections'],
				message: 'Collection directories must be unique'
			});
		}
	});

export const CustomSiteAdoptionPlanSchema = z
	.object({
		contract: z.literal('tend.host/sites-custom-site-adoption-plan/v1'),
		snapshotId: z.uuid(),
		repositoryId: IdentifierSchema,
		commit: GitCommitSchema,
		framework: SiteFrameworkSchema,
		mode: z.enum(['visual_and_content', 'content_only']),
		rendererPreserved: z.literal(true),
		collectionIds: z.array(IdentifierSchema).min(1).max(32),
		reviewOnly: z.literal(true),
		canApply: z.literal(false),
		blockedReason: z.literal('host_repository_capability_required')
	})
	.strict();

export const StarterRepositorySchema = z
	.object({
		contract: z.literal('tend.host/sites-starter-repository/v1'),
		id: IdentifierSchema,
		name: z.string().min(1).max(100),
		summary: z.string().min(1).max(280),
		publisher: z.string().min(1).max(100),
		trust: z.enum(['official', 'community']),
		reviewStatus: z.enum(['reviewed', 'unreviewed']),
		framework: SiteFrameworkSchema,
		provider: z.enum(['github', 'gitlab', 'bitbucket', 'git']),
		repositoryId: IdentifierSchema,
		commit: GitCommitSchema,
		treeSha256: Sha256HexSchema,
		license: z.string().min(1).max(80),
		contentFormats: z.array(HeadlessContentFormatSchema).min(1).max(5),
		goals: z.array(IdentifierSchema).min(1).max(12),
		metadata: z.record(IdentifierSchema, JsonValueSchema).default({})
	})
	.strict()
	.superRefine((starter, context) => {
		for (const [field, values] of [
			['contentFormats', starter.contentFormats],
			['goals', starter.goals]
		] as const) {
			if (new Set(values).size !== values.length) {
				context.addIssue({ code: 'custom', path: [field], message: `${field} must be unique` });
			}
		}
	});

export const StarterRepositoryAssessmentSchema = z
	.object({
		contract: z.literal('tend.host/sites-starter-repository-assessment/v1'),
		starterId: IdentifierSchema,
		treeSha256: Sha256HexSchema,
		selectable: z.boolean(),
		status: z.enum(['reviewed', 'review_required']),
		reason: z.string().min(1).max(180)
	})
	.strict();

export type CustomSiteProfile = z.infer<typeof CustomSiteProfileSchema>;
export type CustomSiteAdoptionPlan = z.infer<typeof CustomSiteAdoptionPlanSchema>;
export type StarterRepository = z.infer<typeof StarterRepositorySchema>;
export type StarterRepositoryAssessment = z.infer<typeof StarterRepositoryAssessmentSchema>;

export function planCustomSiteAdoption(input: CustomSiteProfile): CustomSiteAdoptionPlan {
	const profile = CustomSiteProfileSchema.parse(input);
	return CustomSiteAdoptionPlanSchema.parse({
		contract: 'tend.host/sites-custom-site-adoption-plan/v1',
		snapshotId: profile.snapshotId,
		repositoryId: profile.repositoryId,
		commit: profile.commit,
		framework: profile.framework,
		mode: profile.visualEditing === 'supported_blocks' ? 'visual_and_content' : 'content_only',
		rendererPreserved: true,
		collectionIds: profile.collections.map((collection) => collection.id),
		reviewOnly: true,
		canApply: false,
		blockedReason: 'host_repository_capability_required'
	});
}

export function assessStarterRepository(input: StarterRepository): StarterRepositoryAssessment {
	const starter = StarterRepositorySchema.parse(input);
	const reviewed = starter.reviewStatus === 'reviewed';
	return StarterRepositoryAssessmentSchema.parse({
		contract: 'tend.host/sites-starter-repository-assessment/v1',
		starterId: starter.id,
		treeSha256: starter.treeSha256,
		selectable: reviewed,
		status: reviewed ? 'reviewed' : 'review_required',
		reason: reviewed
			? 'Pinned repository evidence is reviewed and ready for a creation plan.'
			: 'This community starter needs review before it can be selected.'
	});
}
