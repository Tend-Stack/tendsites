import { z } from 'zod';

export const SITES_CONTRACT_VERSION = 'tend.host/sites/v1' as const;

const identifier = z.string().regex(/^[a-z0-9][a-z0-9._-]{0,95}$/);
const sha256Hex = z.string().regex(/^[a-f0-9]{64}$/);
const localeTag = z.string().regex(/^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-[A-Z]{2}|-[0-9]{3})?$/);
const relativeProjectPath = z
	.string()
	.min(1)
	.max(320)
	.refine((value) => !value.startsWith('/') && !value.startsWith('\\'), 'Path must be relative')
	.refine((value) => !/^[A-Za-z]:/.test(value), 'Drive-qualified paths are forbidden')
	.refine(
		(value) => !value.split(/[\\/]/).some((segment) => segment === '..'),
		'Parent traversal is forbidden'
	);

export const LocaleConfigSchema = z
	.object({
		defaultLocale: localeTag,
		locales: z.array(localeTag).min(1).max(24),
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
		id: identifier,
		label: z.string().min(1).max(80),
		kind: z.enum(['pages', 'posts', 'docs']),
		directory: relativeProjectPath,
		format: z.enum(['markdown', 'mdsvex'])
	})
	.strict();

export const SiteProjectSchema = z
	.object({
		contract: z.literal(SITES_CONTRACT_VERSION),
		id: identifier,
		name: z.string().min(1).max(120),
		adapter: z.literal('sveltekit'),
		repositoryId: identifier,
		defaultBranch: z.string().min(1).max(160),
		collections: z.array(ContentCollectionSchema).max(32),
		locales: LocaleConfigSchema,
		mediaDirectory: relativeProjectPath,
		mediaPublicPath: z.string().regex(/^\/(?:[A-Za-z0-9._~!$&'()*+,;=:@/-]*)$/),
		buildScript: identifier,
		status: z.enum(['draft', 'ready', 'published', 'attention'])
	})
	.strict();

export const ChangeFileSchema = z
	.object({
		path: relativeProjectPath,
		kind: z.enum(['create', 'update', 'delete']),
		beforeSha256: sha256Hex.nullable(),
		afterSha256: sha256Hex.nullable()
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
		projectId: identifier,
		baseRevision: sha256Hex,
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
		projectId: identifier,
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
		errorCode: identifier.nullable()
	})
	.strict();

export const PublishOperationSchema = z
	.object({
		contract: z.literal('tend.host/sites-publish-operation/v1'),
		operationId: z.uuid(),
		projectId: identifier,
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
		id: identifier,
		name: z.string().min(1).max(100),
		version: z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/),
		publisher: z.string().min(1).max(100),
		adapter: z.literal('sveltekit'),
		trust: z.enum(['official', 'community', 'installed']),
		license: z.string().min(1).max(80),
		integritySha256: sha256Hex
	})
	.strict();

export const SiteComponentManifestSchema = z
	.object({
		schema: z.literal(1),
		id: identifier,
		name: z.string().min(1).max(100),
		version: z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/),
		publisher: z.string().min(1).max(100),
		adapter: z.literal('sveltekit'),
		category: identifier,
		source: relativeProjectPath,
		trust: z.enum(['official', 'community', 'installed']),
		integritySha256: sha256Hex,
		fields: z.record(identifier, z.record(z.string(), z.unknown()))
	})
	.strict();

export type SiteProject = z.infer<typeof SiteProjectSchema>;
export type ContentCollection = z.infer<typeof ContentCollectionSchema>;
export type LocaleConfig = z.infer<typeof LocaleConfigSchema>;
export type ChangeSet = z.infer<typeof ChangeSetSchema>;
export type PreviewRequest = z.infer<typeof PreviewRequestSchema>;
export type PreviewResult = z.infer<typeof PreviewResultSchema>;
export type PublishOperation = z.infer<typeof PublishOperationSchema>;
export type ThemeManifest = z.infer<typeof ThemeManifestSchema>;
export type SiteComponentManifest = z.infer<typeof SiteComponentManifestSchema>;

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
	detect(input: Readonly<{ files: readonly string[]; packageJson?: unknown }>): Promise<boolean>;
	inspect(
		input: Readonly<{ files: readonly string[]; packageJson?: unknown }>
	): Promise<SiteProject>;
}
