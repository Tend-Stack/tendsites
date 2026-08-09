import { z } from 'zod';

import {
	ContentEntrySchema,
	IdentifierSchema,
	LocaleTagSchema,
	Sha256HexSchema,
	SiteProjectSchema,
	type ContentEntry,
	type SiteProject
} from './sites';

export const TranslationProposalSchema = z
	.object({
		contract: z.literal('tend.host/sites-translation-proposal/v1'),
		proposalId: z.uuid(),
		projectId: IdentifierSchema,
		logicalId: IdentifierSchema,
		sourceEntryId: IdentifierSchema,
		sourceLocale: LocaleTagSchema,
		targetLocale: LocaleTagSchema,
		sourceContentSha256: Sha256HexSchema,
		proposedContentSha256: Sha256HexSchema,
		provider: z.enum(['manual', 'user_configured_ai']),
		status: z.enum(['proposed', 'approved', 'rejected']),
		createdAt: z.iso.datetime({ offset: true })
	})
	.strict()
	.refine((proposal) => proposal.sourceLocale !== proposal.targetLocale, {
		path: ['targetLocale'],
		message: 'Translation target must differ from the source locale'
	});

export const LocalizationReportSchema = z
	.object({
		contract: z.literal('tend.host/sites-localization-report/v1'),
		projectId: IdentifierSchema,
		defaultLocale: LocaleTagSchema,
		locales: z.array(LocaleTagSchema).min(1).max(24),
		logicalEntries: z.number().int().min(0),
		completeEntries: z.number().int().min(0),
		missing: z.array(
			z
				.object({ logicalId: IdentifierSchema, locales: z.array(LocaleTagSchema).min(1).max(24) })
				.strict()
		),
		coveragePercent: z.number().min(0).max(100)
	})
	.strict();

export type TranslationProposal = z.infer<typeof TranslationProposalSchema>;
export type LocalizationReport = z.infer<typeof LocalizationReportSchema>;

export function reportLocalizationCoverage(
	projectInput: SiteProject,
	entriesInput: readonly ContentEntry[]
): LocalizationReport {
	const project = SiteProjectSchema.parse(projectInput);
	const entries = entriesInput.map((entry) => ContentEntrySchema.parse(entry));
	const localeSet = new Set(project.locales.locales);
	for (const entry of entries) {
		if (!localeSet.has(entry.locale)) throw new Error('Content uses an undeclared locale');
	}
	const byLogical = new Map<string, Set<string>>();
	for (const entry of entries) {
		const locales = byLogical.get(entry.logicalId) ?? new Set<string>();
		if (locales.has(entry.locale)) throw new Error('Logical content has duplicate locale entries');
		locales.add(entry.locale);
		byLogical.set(entry.logicalId, locales);
	}
	const missing = [...byLogical.entries()]
		.map(([logicalId, present]) => ({
			logicalId,
			locales: project.locales.locales.filter((locale) => !present.has(locale))
		}))
		.filter((item) => item.locales.length > 0)
		.sort((left, right) => left.logicalId.localeCompare(right.logicalId));
	const logicalEntries = byLogical.size;
	const completeEntries = logicalEntries - missing.length;
	const totalCells = logicalEntries * project.locales.locales.length;
	return LocalizationReportSchema.parse({
		contract: 'tend.host/sites-localization-report/v1',
		projectId: project.id,
		defaultLocale: project.locales.defaultLocale,
		locales: project.locales.locales,
		logicalEntries,
		completeEntries,
		missing,
		coveragePercent: totalCells === 0 ? 100 : Math.round((1000 * entries.length) / totalCells) / 10
	});
}

export function verifyTranslationProposal(
	proposalInput: TranslationProposal,
	projectInput: SiteProject,
	sourceInput: ContentEntry
): TranslationProposal {
	const proposal = TranslationProposalSchema.parse(proposalInput);
	const project = SiteProjectSchema.parse(projectInput);
	const source = ContentEntrySchema.parse(sourceInput);
	if (proposal.projectId !== project.id) throw new Error('Translation project binding is invalid');
	if (!project.collections.some((collection) => collection.id === source.collectionId)) {
		throw new Error('Translation source collection is not configured');
	}
	if (
		proposal.logicalId !== source.logicalId ||
		proposal.sourceEntryId !== source.id ||
		proposal.sourceLocale !== source.locale ||
		proposal.sourceContentSha256 !== source.bodySha256
	) {
		throw new Error('Translation source evidence does not match');
	}
	if (!project.locales.locales.includes(proposal.targetLocale)) {
		throw new Error('Translation target locale is not configured');
	}
	return proposal;
}
