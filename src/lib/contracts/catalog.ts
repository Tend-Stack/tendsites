import { z } from 'zod';

import {
	IdentifierSchema,
	LocaleConfigSchema,
	RelativeProjectPathSchema,
	Sha256HexSchema
} from './sites';

export const SiteGoalSchema = z.enum([
	'personal',
	'blog',
	'business',
	'docs',
	'portfolio',
	'media'
]);

export const SiteModuleSchema = z.enum([
	'home',
	'about',
	'blog',
	'documentation',
	'gallery',
	'projects',
	'contact'
]);

export const StarterFileSchema = z
	.object({
		path: RelativeProjectPathSchema,
		sha256: Sha256HexSchema,
		role: z.enum(['project', 'content', 'media', 'configuration']),
		required: z.boolean()
	})
	.strict();

export const StarterTemplateSchema = z
	.object({
		contract: z.literal('tend.host/sites-starter-template/v1'),
		id: IdentifierSchema,
		name: z.string().min(1).max(100),
		summary: z.string().min(1).max(280),
		version: z.string().regex(/^\d+\.\d+\.\d+$/),
		revisionSha256: Sha256HexSchema,
		adapter: z.literal('sveltekit'),
		goals: z.array(SiteGoalSchema).min(1).max(6),
		modules: z.array(SiteModuleSchema).min(1).max(12),
		themeId: IdentifierSchema,
		locales: LocaleConfigSchema,
		files: z.array(StarterFileSchema).min(2).max(500)
	})
	.strict()
	.superRefine((template, context) => {
		for (const [path, values] of [
			['goals', template.goals],
			['modules', template.modules],
			['files', template.files.map((file) => file.path)]
		] as const) {
			if (new Set(values).size !== values.length) {
				context.addIssue({ code: 'custom', path: [path], message: `${path} must be unique` });
			}
		}
		const requiredPaths = new Set(
			template.files.filter((file) => file.required).map((file) => file.path)
		);
		for (const path of ['package.json', 'tend.site.json']) {
			if (!requiredPaths.has(path)) {
				context.addIssue({
					code: 'custom',
					path: ['files'],
					message: `${path} must be a required starter file`
				});
			}
		}
	});

export type SiteGoal = z.infer<typeof SiteGoalSchema>;
export type SiteModule = z.infer<typeof SiteModuleSchema>;
export type StarterTemplate = z.infer<typeof StarterTemplateSchema>;

export function findStarterTemplate(
	catalog: readonly StarterTemplate[],
	templateId: string,
	revisionSha256: string
): StarterTemplate {
	const matches = catalog.filter(
		(template) => template.id === templateId && template.revisionSha256 === revisionSha256
	);
	if (matches.length !== 1) throw new Error('Exact immutable starter revision is unavailable');
	return StarterTemplateSchema.parse(matches[0]);
}
