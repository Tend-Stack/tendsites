export type StructurePage = { id: string; name: string; slug: string };

export type DemoNavigationItem = {
	id: string;
	label: string;
	type: 'page' | 'external';
	pageId?: string;
	href?: string;
};

export type DemoSocialLink = {
	id: string;
	label: string;
	href: string;
};

export type DemoSiteStructure = {
	header: DemoNavigationItem[];
	footer: DemoNavigationItem[];
	social: DemoSocialLink[];
	announcement: {
		enabled: boolean;
		text: string;
		href: string;
	};
	notFound: {
		title: string;
		body: string;
		actionLabel: string;
		pageId: string;
	};
};

export type StructureIssue = {
	area: 'header' | 'footer' | 'social' | 'announcement' | 'not-found';
	message: string;
};

const safeExternalProtocol = new Set(['https:', 'mailto:']);

export function normalizeExternalHref(value: string): string | null {
	const trimmed = value.trim();
	if (!trimmed || trimmed.length > 500) return null;
	try {
		const url = new URL(trimmed);
		return safeExternalProtocol.has(url.protocol) ? url.href : null;
	} catch {
		return null;
	}
}

export function createDefaultSiteStructure(pages: StructurePage[]): DemoSiteStructure {
	const links = pages.slice(0, 6).map((page) => ({
		id: `nav-${page.id}`,
		label: page.name,
		type: 'page' as const,
		pageId: page.id
	}));
	return {
		header: links,
		footer: links.map((item) => ({ ...item, id: `footer-${item.pageId}` })),
		social: [],
		announcement: {
			enabled: false,
			text: 'New field notes are ready to read.',
			href: '/journal'
		},
		notFound: {
			title: 'This path wandered off the map.',
			body: 'The page may have moved, but the rest of the journal is still here.',
			actionLabel: 'Return home',
			pageId: pages[0]?.id ?? ''
		}
	};
}

export function resolveNavigationHref(
	item: DemoNavigationItem,
	pages: StructurePage[]
): string | null {
	if (item.type === 'page') return pages.find((page) => page.id === item.pageId)?.slug ?? null;
	return normalizeExternalHref(item.href ?? '');
}

function bounded(value: unknown, maximum: number): value is string {
	return typeof value === 'string' && value.trim().length > 0 && value.length <= maximum;
}

function within(value: unknown, maximum: number): value is string {
	return typeof value === 'string' && value.length <= maximum;
}

function validNavigationItem(value: unknown, pageIds: Set<string>): value is DemoNavigationItem {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const item = value as Partial<DemoNavigationItem>;
	if (!bounded(item.id, 80) || !bounded(item.label, 60)) return false;
	if (item.type === 'page') {
		return bounded(item.pageId, 80) && pageIds.has(item.pageId) && item.href === undefined;
	}
	return (
		item.type === 'external' &&
		item.pageId === undefined &&
		normalizeExternalHref(item.href ?? '') !== null
	);
}

export function isDemoSiteStructure(
	value: unknown,
	pages: StructurePage[]
): value is DemoSiteStructure {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const structure = value as Partial<DemoSiteStructure>;
	const pageIds = new Set(pages.map((page) => page.id));
	if (
		!Array.isArray(structure.header) ||
		structure.header.length > 12 ||
		!structure.header.every((item) => validNavigationItem(item, pageIds)) ||
		!Array.isArray(structure.footer) ||
		structure.footer.length > 16 ||
		!structure.footer.every((item) => validNavigationItem(item, pageIds)) ||
		!Array.isArray(structure.social) ||
		structure.social.length > 8 ||
		!structure.social.every(
			(item) =>
				item &&
				typeof item === 'object' &&
				bounded(item.id, 80) &&
				bounded(item.label, 40) &&
				normalizeExternalHref(item.href) !== null
		)
	)
		return false;
	const announcement = structure.announcement;
	const notFound = structure.notFound;
	return Boolean(
		announcement &&
		typeof announcement.enabled === 'boolean' &&
		within(announcement.text, 160) &&
		(announcement.href === '' || resolveAnnouncementHref(announcement.href, pages) !== null) &&
		notFound &&
		within(notFound.title, 120) &&
		within(notFound.body, 320) &&
		within(notFound.actionLabel, 60) &&
		pageIds.has(notFound.pageId)
	);
}

export function resolveAnnouncementHref(value: string, pages: StructurePage[]): string | null {
	const trimmed = value.trim();
	if (!trimmed) return '';
	if (trimmed.startsWith('/')) return pages.some((page) => page.slug === trimmed) ? trimmed : null;
	return normalizeExternalHref(trimmed);
}

export function analyzeSiteStructure(
	structure: DemoSiteStructure,
	pages: StructurePage[]
): StructureIssue[] {
	const issues: StructureIssue[] = [];
	for (const [area, items] of [
		['header', structure.header],
		['footer', structure.footer]
	] as const) {
		const labels = new Set<string>();
		for (const item of items) {
			const key = item.label.trim().toLocaleLowerCase();
			if (labels.has(key))
				issues.push({ area, message: `“${item.label}” appears more than once.` });
			labels.add(key);
			if (!resolveNavigationHref(item, pages))
				issues.push({ area, message: `“${item.label}” does not have a valid destination.` });
		}
	}
	if (
		structure.announcement.enabled &&
		!resolveAnnouncementHref(structure.announcement.href, pages)
	)
		issues.push({
			area: 'announcement',
			message: 'The announcement link needs a valid destination.'
		});
	if (structure.announcement.enabled && !structure.announcement.text.trim())
		issues.push({
			area: 'announcement',
			message: 'Add announcement text or hide the announcement.'
		});
	if (!pages.some((page) => page.id === structure.notFound.pageId))
		issues.push({ area: 'not-found', message: 'Choose an existing recovery page.' });
	if (
		!structure.notFound.title.trim() ||
		!structure.notFound.body.trim() ||
		!structure.notFound.actionLabel.trim()
	)
		issues.push({
			area: 'not-found',
			message: 'Complete the missing-page message and recovery action.'
		});
	return issues;
}
