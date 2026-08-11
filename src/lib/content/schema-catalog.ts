import { z } from 'zod';

import { HeadlessCollectionMappingSchema, type CustomSiteProfile } from '../contracts/custom-site';
import { IdentifierSchema, RelativeProjectPathSchema, Sha256HexSchema } from '../contracts/sites';

export const ContentFieldWidgetSchema = z.enum([
	'string',
	'text',
	'markdown',
	'datetime',
	'boolean',
	'number',
	'select',
	'list',
	'image'
]);

export const ContentFieldDefinitionSchema = z
	.object({
		name: IdentifierSchema,
		label: z.string().min(1).max(80),
		widget: ContentFieldWidgetSchema,
		required: z.boolean(),
		hint: z.string().min(1).max(240).nullable(),
		options: z.array(z.string().min(1).max(120)).max(100)
	})
	.strict()
	.superRefine((field, context) => {
		if (field.widget === 'select' && field.options.length === 0) {
			context.addIssue({
				code: 'custom',
				path: ['options'],
				message: 'Select fields require options'
			});
		}
		if (field.widget !== 'select' && field.options.length > 0) {
			context.addIssue({
				code: 'custom',
				path: ['options'],
				message: 'Only select fields accept options'
			});
		}
	});

export const ContentCollectionFormSchema = z
	.object({
		collection: HeadlessCollectionMappingSchema,
		fields: z.array(ContentFieldDefinitionSchema).min(1).max(64)
	})
	.strict()
	.superRefine((form, context) => {
		const names = form.fields.map((field) => field.name);
		if (new Set(names).size !== names.length) {
			context.addIssue({ code: 'custom', path: ['fields'], message: 'Field names must be unique' });
		}
	});

export const ReviewedEditorBlockSchema = z
	.object({
		id: IdentifierSchema,
		label: z.string().min(1).max(80),
		shortcode: z.string().regex(/^[a-z][a-z0-9-]{0,47}$/),
		fields: z.array(ContentFieldDefinitionSchema).min(1).max(24),
		reviewSha256: Sha256HexSchema,
		allowsScript: z.literal(false)
	})
	.strict();

export const ContentSchemaCatalogSchema = z
	.object({
		contract: z.literal('tend.host/sites-content-schema-catalog/v1'),
		forms: z.array(ContentCollectionFormSchema).min(1).max(32),
		blocks: z.array(ReviewedEditorBlockSchema).max(24),
		authority: z.literal('none'),
		reviewRequired: z.literal(true)
	})
	.strict();

export type ContentSchemaCatalog = z.infer<typeof ContentSchemaCatalogSchema>;

const ImportedFieldSchema = z
	.object({
		name: IdentifierSchema,
		label: z.string().min(1).max(80).optional(),
		widget: z.string().min(1).max(40).default('string'),
		required: z.boolean().default(true),
		hint: z.string().min(1).max(240).optional(),
		options: z.array(z.string().min(1).max(120)).max(100).optional()
	})
	.loose();

const ImportedCollectionSchema = z
	.object({
		name: IdentifierSchema,
		label: z.string().min(1).max(80).optional(),
		folder: RelativeProjectPathSchema,
		format: z.enum(['frontmatter', 'json', 'yaml', 'yml', 'toml']).default('frontmatter'),
		fields: z.array(ImportedFieldSchema).min(1).max(64)
	})
	.loose();

const GitCmsConfigSchema = z
	.object({
		collections: z.array(ImportedCollectionSchema).min(1).max(32)
	})
	.loose();

export const GitCmsImportResultSchema = z
	.object({
		contract: z.literal('tend.host/sites-git-cms-import/v1'),
		catalog: ContentSchemaCatalogSchema,
		ignoredAuthorityKeys: z.array(
			z.enum(['backend', 'publish_mode', 'site_url', 'display_url', 'media_library'])
		),
		warnings: z.array(z.string().min(1).max(160)).max(64),
		canWriteRepository: z.literal(false)
	})
	.strict();

const widgetMap: Record<string, z.infer<typeof ContentFieldWidgetSchema> | undefined> = {
	string: 'string',
	text: 'text',
	markdown: 'markdown',
	datetime: 'datetime',
	date: 'datetime',
	boolean: 'boolean',
	number: 'number',
	select: 'select',
	list: 'list',
	image: 'image'
};

function inferKind(name: string): 'pages' | 'posts' | 'docs' | 'data' {
	if (/doc/i.test(name)) return 'docs';
	if (/post|blog|news|article/i.test(name)) return 'posts';
	if (/page/i.test(name)) return 'pages';
	return 'data';
}

export function importGitCmsConfiguration(input: unknown) {
	const source = GitCmsConfigSchema.parse(input);
	const raw = input as Record<string, unknown>;
	const ignoredAuthorityKeys = [
		'backend',
		'publish_mode',
		'site_url',
		'display_url',
		'media_library'
	].filter((key) => key in raw) as Array<
		'backend' | 'publish_mode' | 'site_url' | 'display_url' | 'media_library'
	>;
	const warnings: string[] = [];
	const forms = source.collections.map((collection) => {
		const fields = collection.fields.map((field) => {
			const widget = widgetMap[field.widget];
			if (!widget) throw new Error(`Unsupported imported widget: ${field.widget}`);
			return ContentFieldDefinitionSchema.parse({
				name: field.name,
				label: field.label ?? field.name.replaceAll('_', ' '),
				widget,
				required: field.required,
				hint: field.hint ?? null,
				options: widget === 'select' ? (field.options ?? []) : []
			});
		});
		const title = fields.find((field) => field.name === 'title')?.name ?? null;
		const body = fields.find((field) => field.name === 'body')?.name ?? null;
		const slug = fields.find((field) => ['slug', 'path'].includes(field.name))?.name ?? null;
		const format =
			collection.format === 'frontmatter'
				? 'markdown'
				: collection.format === 'yml'
					? 'yaml'
					: collection.format;
		const kind = inferKind(collection.name);
		if (kind === 'data' && !title)
			warnings.push(
				`${collection.name} needs a title field before structured content can be mapped.`
			);
		return ContentCollectionFormSchema.parse({
			collection: {
				id: collection.name,
				label: collection.label ?? collection.name,
				kind,
				directory: collection.folder,
				format,
				titleField: title,
				bodyField: body,
				slugField: slug
			},
			fields
		});
	});
	return GitCmsImportResultSchema.parse({
		contract: 'tend.host/sites-git-cms-import/v1',
		catalog: {
			contract: 'tend.host/sites-content-schema-catalog/v1',
			forms,
			blocks: [],
			authority: 'none',
			reviewRequired: true
		},
		ignoredAuthorityKeys,
		warnings,
		canWriteRepository: false
	});
}

export function profileCollectionsFromCatalog(
	catalog: ContentSchemaCatalog
): CustomSiteProfile['collections'] {
	return ContentSchemaCatalogSchema.parse(catalog).forms.map((form) => form.collection);
}
