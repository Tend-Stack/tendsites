import { z } from 'zod';

export const SITES_CONTRACT_VERSION = 'tend.host/sites/v1' as const;

export const IdentifierSchema = z.string().regex(/^[a-z0-9][a-z0-9._-]{0,95}$/);
export const Sha256HexSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const LocaleTagSchema = z
	.string()
	.regex(/^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-[A-Z]{2}|-[0-9]{3})?$/);
export const RelativeProjectPathSchema = z
	.string()
	.min(1)
	.max(320)
	.refine((value) => !value.startsWith('/') && !value.startsWith('\\'), 'Path must be relative')
	.refine((value) => !/^[A-Za-z]:/.test(value), 'Drive-qualified paths are forbidden')
	.refine((value) => !value.includes('\\'), 'Paths must use canonical POSIX separators')
	.refine(
		(value) =>
			[...value].every((character) => {
				const codePoint = character.codePointAt(0);
				return codePoint !== undefined && codePoint > 31 && codePoint !== 127;
			}),
		'Control characters are forbidden'
	)
	.refine(
		(value) =>
			value.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..'),
		'Paths must contain only canonical non-traversing segments'
	);

export type JsonValue =
	string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
	z.union([
		z.string(),
		z.number().finite(),
		z.boolean(),
		z.null(),
		z.array(JsonValueSchema),
		z.record(z.string(), JsonValueSchema)
	])
);

export const LocaleConfigSchema = z
	.object({
		defaultLocale: LocaleTagSchema,
		locales: z.array(LocaleTagSchema).min(1).max(24),
		strategy: z.literal('multiple_folders')
	})
	.strict()
	.superRefine((value, context) => {
		if (!value.locales.includes(value.defaultLocale)) {
			context.addIssue({
				code: 'custom',
				path: ['defaultLocale'],
				message: 'The default locale must be included in locales'
			});
		}
		if (new Set(value.locales).size !== value.locales.length) {
			context.addIssue({ code: 'custom', path: ['locales'], message: 'Locales must be unique' });
		}
	});

export const ContentCollectionSchema = z
	.object({
		id: IdentifierSchema,
		label: z.string().min(1).max(80),
		kind: z.enum(['pages', 'posts', 'docs']),
		directory: RelativeProjectPathSchema,
		format: z.enum(['markdown', 'mdsvex'])
	})
	.strict();

export const SiteProjectSchema = z
	.object({
		contract: z.literal(SITES_CONTRACT_VERSION),
		id: IdentifierSchema,
		name: z.string().min(1).max(120),
		adapter: z.literal('sveltekit'),
		repositoryId: IdentifierSchema,
		defaultBranch: z.string().min(1).max(160),
		collections: z.array(ContentCollectionSchema).max(32),
		locales: LocaleConfigSchema,
		mediaDirectory: RelativeProjectPathSchema,
		mediaPublicPath: z.string().regex(/^\/(?:[A-Za-z0-9._~!$&'()*+,;=:@/-]*)$/),
		buildScript: IdentifierSchema,
		status: z.enum(['draft', 'ready', 'published', 'attention'])
	})
	.strict();

export const ChangeFileSchema = z
	.object({
		path: RelativeProjectPathSchema,
		kind: z.enum(['create', 'update', 'delete']),
		beforeSha256: Sha256HexSchema.nullable(),
		afterSha256: Sha256HexSchema.nullable()
	})
	.strict()
	.superRefine((value, context) => {
		if (value.kind === 'create' && value.beforeSha256 !== null) {
			context.addIssue({ code: 'custom', message: 'Created files cannot have a prior digest' });
		}
		if (value.kind === 'delete' && value.afterSha256 !== null) {
			context.addIssue({ code: 'custom', message: 'Deleted files cannot have a resulting digest' });
		}
	});

export const ChangeSetSchema = z
	.object({
		contract: z.literal('tend.host/sites-change-set/v1'),
		id: z.uuid(),
		projectId: IdentifierSchema,
		baseRevision: Sha256HexSchema,
		summary: z.string().min(1).max(500),
		files: z.array(ChangeFileSchema).min(1).max(250),
		validation: z.enum(['pending', 'passed', 'failed']),
		createdAt: z.iso.datetime({ offset: true })
	})
	.strict();

export const PreviewRequestSchema = z
	.object({
		contract: z.literal('tend.host/sites-preview-request/v1'),
		requestId: z.uuid(),
		projectId: IdentifierSchema,
		changeSetId: z.uuid(),
		ttlSeconds: z.number().int().min(60).max(3600)
	})
	.strict();

export const PreviewResultSchema = z
	.object({
		contract: z.literal('tend.host/sites-preview-result/v1'),
		requestId: z.uuid(),
		status: z.enum(['queued', 'building', 'ready', 'failed', 'expired']),
		previewUrl: z.url().startsWith('https://').nullable(),
		expiresAt: z.iso.datetime({ offset: true }).nullable(),
		errorCode: IdentifierSchema.nullable()
	})
	.strict();

export const PublishOperationSchema = z
	.object({
		contract: z.literal('tend.host/sites-publish-operation/v1'),
		operationId: z.uuid(),
		projectId: IdentifierSchema,
		changeSetId: z.uuid(),
		state: z.enum([
			'pending',
			'validating',
			'preparing_changeset',
			'committing',
			'pushing',
			'building',
			'preview_ready',
			'awaiting_approval',
			'deploying',
			'verifying',
			'routing',
			'completed',
			'failed'
		]),
		startedAt: z.iso.datetime({ offset: true }),
		completedAt: z.iso.datetime({ offset: true }).nullable()
	})
	.strict();

export const ThemeManifestSchema = z
	.object({
		schema: z.literal(1),
		id: IdentifierSchema,
		name: z.string().min(1).max(100),
		version: z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/),
		publisher: z.string().min(1).max(100),
		adapter: z.literal('sveltekit'),
		trust: z.enum(['official', 'community', 'installed']),
		license: z.string().min(1).max(80),
		integritySha256: Sha256HexSchema
	})
	.strict();

export const SiteComponentManifestSchema = z
	.object({
		schema: z.literal(1),
		id: IdentifierSchema,
		name: z.string().min(1).max(100),
		version: z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/),
		publisher: z.string().min(1).max(100),
		adapter: z.literal('sveltekit'),
		category: IdentifierSchema,
		source: RelativeProjectPathSchema,
		trust: z.enum(['official', 'community', 'installed']),
		integritySha256: Sha256HexSchema,
		fields: z.record(IdentifierSchema, z.record(z.string(), z.unknown()))
	})
	.strict();

export const MediaProviderSchema = z
	.object({
		provider: z.literal('repository'),
		directory: RelativeProjectPathSchema,
		publicPath: z.string().regex(/^\/(?:[A-Za-z0-9._~!$&'()*+,;=:@/-]*)$/)
	})
	.strict();

export const TendSiteConfigSchema = z
	.object({
		schema: z.literal(1),
		adapter: z.literal('sveltekit'),
		content: z
			.object({
				pages: RelativeProjectPathSchema.optional(),
				posts: RelativeProjectPathSchema.optional(),
				docs: RelativeProjectPathSchema.optional()
			})
			.strict()
			.refine((content) => Object.values(content).some(Boolean), {
				message: 'At least one content collection is required'
			}),
		media: MediaProviderSchema,
		i18n: LocaleConfigSchema,
		build: z
			.object({
				script: IdentifierSchema,
				output: RelativeProjectPathSchema
			})
			.strict()
	})
	.strict();

export const ContentEntrySchema = z
	.object({
		contract: z.literal('tend.host/sites-content-entry/v1'),
		id: IdentifierSchema,
		logicalId: IdentifierSchema,
		collectionId: IdentifierSchema,
		locale: LocaleTagSchema,
		path: RelativeProjectPathSchema,
		title: z.string().min(1).max(180),
		slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
		description: z.string().max(500).nullable(),
		draft: z.boolean(),
		frontmatter: z.record(z.string().max(80), JsonValueSchema),
		bodySha256: Sha256HexSchema
	})
	.strict();

export const AiProposalSchema = z
	.object({
		contract: z.literal('tend.host/sites-ai-proposal/v1'),
		proposalId: z.uuid(),
		projectId: IdentifierSchema,
		baseRevision: Sha256HexSchema,
		kind: z.enum(['content_edit', 'block_plan', 'change_set']),
		summary: z.string().min(1).max(500),
		providerId: IdentifierSchema,
		model: z.string().min(1).max(160),
		promptSha256: Sha256HexSchema,
		payloadSha256: Sha256HexSchema,
		changeSet: ChangeSetSchema.nullable(),
		status: z.enum(['proposed', 'approved', 'rejected', 'applied']),
		createdAt: z.iso.datetime({ offset: true })
	})
	.strict()
	.superRefine((proposal, context) => {
		if (!proposal.changeSet) return;
		if (proposal.changeSet.projectId !== proposal.projectId) {
			context.addIssue({
				code: 'custom',
				path: ['changeSet', 'projectId'],
				message: 'The proposed change set must belong to the same project'
			});
		}
		if (proposal.changeSet.baseRevision !== proposal.baseRevision) {
			context.addIssue({
				code: 'custom',
				path: ['changeSet', 'baseRevision'],
				message: 'The proposed change set must use the same base revision'
			});
		}
	});

export type SiteProject = z.infer<typeof SiteProjectSchema>;
export type ContentCollection = z.infer<typeof ContentCollectionSchema>;
export type LocaleConfig = z.infer<typeof LocaleConfigSchema>;
export type ChangeSet = z.infer<typeof ChangeSetSchema>;
export type PreviewRequest = z.infer<typeof PreviewRequestSchema>;
export type PreviewResult = z.infer<typeof PreviewResultSchema>;
export type PublishOperation = z.infer<typeof PublishOperationSchema>;
export type ThemeManifest = z.infer<typeof ThemeManifestSchema>;
export type SiteComponentManifest = z.infer<typeof SiteComponentManifestSchema>;
export type MediaProvider = z.infer<typeof MediaProviderSchema>;
export type TendSiteConfig = z.infer<typeof TendSiteConfigSchema>;
export type ContentEntry = z.infer<typeof ContentEntrySchema>;
export type AiProposal = z.infer<typeof AiProposalSchema>;

export type HostCapability =
	| 'repo:assigned'
	| 'preview:isolated'
	| 'jobs:sites'
	| 'deploy:assigned'
	| 'domains:assigned'
	| 'ai:user-configured'
	| 'media:transform';

export interface SiteAdapter {
	id: 'sveltekit';
	detect(
		input: Readonly<{ files: readonly string[]; packageJson?: unknown; tendSiteJson?: unknown }>
	): Promise<boolean>;
	inspect(
		input: Readonly<{
			files: readonly string[];
			packageJson?: unknown;
			tendSiteJson?: unknown;
			projectId: string;
			repositoryId: string;
			name: string;
			defaultBranch: string;
		}>
	): Promise<SiteProject>;
}
