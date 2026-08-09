import { z } from 'zod';

import {
	ContentEntrySchema,
	IdentifierSchema,
	SiteProjectSchema,
	type ContentEntry,
	type SiteProject
} from '../contracts/sites';

export const NavigationItemSchema = z
	.object({
		id: IdentifierSchema,
		label: z.string().min(1).max(80),
		entryId: IdentifierSchema,
		order: z.number().int().min(0).max(10_000)
	})
	.strict();

export const ContentIndexSchema = z
	.object({
		contract: z.literal('tend.host/sites-content-index/v1'),
		projectId: IdentifierSchema,
		total: z.number().int().min(0),
		drafts: z.number().int().min(0),
		byCollection: z.record(IdentifierSchema, z.number().int().min(0)),
		byLocale: z.record(z.string(), z.number().int().min(0)),
		navigation: z.array(NavigationItemSchema).max(250)
	})
	.strict();

export type NavigationItem = z.infer<typeof NavigationItemSchema>;
export type ContentIndex = z.infer<typeof ContentIndexSchema>;

export function indexSiteContent(
	projectInput: SiteProject,
	entriesInput: readonly ContentEntry[],
	navigationInput: readonly NavigationItem[]
): ContentIndex {
	const project = SiteProjectSchema.parse(projectInput);
	const entries = entriesInput.map((entry) => ContentEntrySchema.parse(entry));
	const navigation = navigationInput.map((item) => NavigationItemSchema.parse(item));
	for (const field of ['id', 'path'] as const) {
		const values = entries.map((entry) => entry[field]);
		if (new Set(values).size !== values.length) throw new Error(`Content ${field}s must be unique`);
	}
	const collections = new Map(project.collections.map((collection) => [collection.id, collection]));
	const locales = new Set(project.locales.locales);
	for (const entry of entries) {
		const collection = collections.get(entry.collectionId);
		if (!collection) throw new Error('Content references an unknown collection');
		if (!locales.has(entry.locale)) throw new Error('Content references an undeclared locale');
		if (!entry.path.startsWith(`${collection.directory}/`)) {
			throw new Error('Content path is outside its declared collection');
		}
		const extensionAllowed =
			entry.path.endsWith('.md') || (collection.format === 'mdsvex' && entry.path.endsWith('.svx'));
		if (!extensionAllowed) throw new Error('Content file extension does not match its collection');
	}
	const logicalLocales = entries.map((entry) => `${entry.logicalId}\u0000${entry.locale}`);
	if (new Set(logicalLocales).size !== logicalLocales.length) {
		throw new Error('Content logical ID and locale pairs must be unique');
	}
	const entryIds = new Set(entries.map((entry) => entry.id));
	if (new Set(navigation.map((item) => item.id)).size !== navigation.length) {
		throw new Error('Navigation item IDs must be unique');
	}
	for (const item of navigation) {
		if (!entryIds.has(item.entryId)) throw new Error('Navigation references unknown content');
	}

	const byCollection = Object.fromEntries(project.collections.map((item) => [item.id, 0]));
	const byLocale = Object.fromEntries(project.locales.locales.map((locale) => [locale, 0]));
	for (const entry of entries) {
		byCollection[entry.collectionId] += 1;
		byLocale[entry.locale] += 1;
	}
	return ContentIndexSchema.parse({
		contract: 'tend.host/sites-content-index/v1',
		projectId: project.id,
		total: entries.length,
		drafts: entries.filter((entry) => entry.draft).length,
		byCollection,
		byLocale,
		navigation: [...navigation].sort(
			(left, right) => left.order - right.order || left.id.localeCompare(right.id)
		)
	});
}
