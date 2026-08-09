import { z } from 'zod';

import {
	SiteGoalSchema,
	SiteModuleSchema,
	StarterTemplateSchema,
	type StarterTemplate
} from '../contracts/catalog';
import {
	IdentifierSchema,
	LocaleTagSchema,
	RelativeProjectPathSchema,
	Sha256HexSchema
} from '../contracts/sites';

export const SiteCreationSelectionSchema = z
	.object({
		contract: z.literal('tend.host/sites-creation-selection/v1'),
		planId: z.uuid(),
		projectId: IdentifierSchema,
		name: z.string().trim().min(1).max(120),
		goal: SiteGoalSchema,
		templateId: IdentifierSchema,
		templateRevisionSha256: Sha256HexSchema,
		modules: z.array(SiteModuleSchema).max(12),
		accent: z.string().regex(/^#[a-f0-9]{6}$/),
		defaultLocale: LocaleTagSchema,
		requestedAt: z.iso.datetime({ offset: true })
	})
	.strict()
	.refine((selection) => new Set(selection.modules).size === selection.modules.length, {
		path: ['modules'],
		message: 'Selected modules must be unique'
	});

export const SiteCreationPlanSchema = z
	.object({
		contract: z.literal('tend.host/sites-creation-plan/v1'),
		planId: z.uuid(),
		projectId: IdentifierSchema,
		name: z.string().min(1).max(120),
		goal: SiteGoalSchema,
		templateId: IdentifierSchema,
		templateRevisionSha256: Sha256HexSchema,
		modules: z.array(SiteModuleSchema).max(12),
		accent: z.string().regex(/^#[a-f0-9]{6}$/),
		defaultLocale: LocaleTagSchema,
		files: z
			.array(z.object({ path: RelativeProjectPathSchema, sourceSha256: Sha256HexSchema }).strict())
			.min(2)
			.max(500),
		authority: z.literal('review_only'),
		blockedReason: z.literal('host_creation_capability_required'),
		requestedAt: z.iso.datetime({ offset: true })
	})
	.strict();

export type SiteCreationSelection = z.infer<typeof SiteCreationSelectionSchema>;
export type SiteCreationPlan = z.infer<typeof SiteCreationPlanSchema>;

export function planSiteCreation(
	selectionInput: SiteCreationSelection,
	templateInput: StarterTemplate
): SiteCreationPlan {
	const selection = SiteCreationSelectionSchema.parse(selectionInput);
	const template = StarterTemplateSchema.parse(templateInput);
	if (
		template.id !== selection.templateId ||
		template.revisionSha256 !== selection.templateRevisionSha256
	) {
		throw new Error('Creation selection does not match the exact starter revision');
	}
	if (!template.goals.includes(selection.goal))
		throw new Error('Starter does not support this goal');
	for (const module of selection.modules) {
		if (!template.modules.includes(module))
			throw new Error(`Starter does not support module: ${module}`);
	}

	return SiteCreationPlanSchema.parse({
		contract: 'tend.host/sites-creation-plan/v1',
		planId: selection.planId,
		projectId: selection.projectId,
		name: selection.name,
		goal: selection.goal,
		templateId: template.id,
		templateRevisionSha256: template.revisionSha256,
		modules: [...selection.modules].sort(),
		accent: selection.accent,
		defaultLocale: selection.defaultLocale,
		files: template.files
			.filter((file) => file.required)
			.map((file) => ({ path: file.path, sourceSha256: file.sha256 }))
			.sort((left, right) => left.path.localeCompare(right.path)),
		authority: 'review_only',
		blockedReason: 'host_creation_capability_required',
		requestedAt: selection.requestedAt
	});
}
