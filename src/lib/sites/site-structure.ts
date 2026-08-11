export type StructurePage = { id: string; name: string; slug: string };

export type DemoNavigationItem = {
	id: string;
	label: string;
	type: 'page' | 'external';
	pageId?: string;
	href?: string;
	parentId?: string;
};

export type DemoSocialLink = {
	id: string;
	label: string;
	href: string;
};

export type DemoSystemPages = {
	loading: { title: string; body: string };
	offline: { title: string; body: string; actionLabel: string };
	maintenance: { title: string; body: string; statusText: string };
	error: { title: string; body: string; actionLabel: string };
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
	systemPages: DemoSystemPages;
};

export type StructureIssue = {
	area: 'header' | 'footer' | 'social' | 'announcement' | 'not-found' | 'experiences';
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
		},
		systemPages: {
			loading: {
				title: 'Gathering the next page…',
				body: 'The site is loading. This usually takes only a moment.'
			},
			offline: {
				title: 'You appear to be offline.',
				body: 'Check your connection, then try this page again.',
				actionLabel: 'Try again'
			},
			maintenance: {
				title: 'A short pause for maintenance.',
				body: 'The site is temporarily unavailable while an update is completed.',
				statusText: 'Please check back soon.'
			},
			error: {
				title: 'Something did not load correctly.',
				body: 'Your place is safe. Try loading the page once more.',
				actionLabel: 'Reload page'
			}
		}
	};
}

export function upgradeDemoSiteStructure(
	value: unknown,
	pages: StructurePage[]
): DemoSiteStructure {
	const defaults = createDefaultSiteStructure(pages);
	if (!value || typeof value !== 'object' || Array.isArray(value)) return defaults;
	const legacy = value as Partial<DemoSiteStructure>;
	const systemPages =
		legacy.systemPages && typeof legacy.systemPages === 'object' ? legacy.systemPages : undefined;
	return {
		...defaults,
		...legacy,
		announcement: { ...defaults.announcement, ...(legacy.announcement ?? {}) },
		notFound: { ...defaults.notFound, ...(legacy.notFound ?? {}) },
		systemPages: {
			loading: { ...defaults.systemPages.loading, ...(systemPages?.loading ?? {}) },
			offline: { ...defaults.systemPages.offline, ...(systemPages?.offline ?? {}) },
			maintenance: { ...defaults.systemPages.maintenance, ...(systemPages?.maintenance ?? {}) },
			error: { ...defaults.systemPages.error, ...(systemPages?.error ?? {}) }
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

export function navigationRoots(items: DemoNavigationItem[]): DemoNavigationItem[] {
	return items.filter((item) => item.parentId === undefined);
}

export function navigationChildren(
	items: DemoNavigationItem[],
	parentId: string
): DemoNavigationItem[] {
	return items.filter((item) => item.parentId === parentId);
}

export function removeNavigationItem(
	items: DemoNavigationItem[],
	id: string
): DemoNavigationItem[] {
	return items
		.filter((item) => item.id !== id)
		.map((item) => (item.parentId === id ? { ...item, parentId: undefined } : item));
}

export function removeNavigationPage(
	items: DemoNavigationItem[],
	pageId: string
): DemoNavigationItem[] {
	return items
		.filter((item) => item.type !== 'page' || item.pageId !== pageId)
		.map((item) => {
			const parentRemoved = items.some(
				(candidate) =>
					candidate.id === item.parentId && candidate.type === 'page' && candidate.pageId === pageId
			);
			return parentRemoved ? { ...item, parentId: undefined } : item;
		});
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
	if (
		!bounded(item.id, 80) ||
		!bounded(item.label, 60) ||
		(item.parentId !== undefined && !bounded(item.parentId, 80))
	)
		return false;
	if (item.type === 'page') {
		return bounded(item.pageId, 80) && pageIds.has(item.pageId) && item.href === undefined;
	}
	return (
		item.type === 'external' &&
		item.pageId === undefined &&
		normalizeExternalHref(item.href ?? '') !== null
	);
}

function validNavigation(items: unknown[], pageIds: Set<string>, maximum: number): boolean {
	if (items.length > maximum || !items.every((item) => validNavigationItem(item, pageIds)))
		return false;
	const navigation = items as DemoNavigationItem[];
	const ids = new Set(navigation.map((item) => item.id));
	if (ids.size !== navigation.length) return false;
	return navigation.every((item) => {
		if (item.parentId === undefined) return true;
		if (item.parentId === item.id || !ids.has(item.parentId)) return false;
		return navigation.find((candidate) => candidate.id === item.parentId)?.parentId === undefined;
	});
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
		!validNavigation(structure.header, pageIds, 12) ||
		!Array.isArray(structure.footer) ||
		!validNavigation(structure.footer, pageIds, 16) ||
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
	const systemPages = structure.systemPages;
	return Boolean(
		announcement &&
		typeof announcement.enabled === 'boolean' &&
		within(announcement.text, 160) &&
		(announcement.href === '' || resolveAnnouncementHref(announcement.href, pages) !== null) &&
		notFound &&
		within(notFound.title, 120) &&
		within(notFound.body, 320) &&
		within(notFound.actionLabel, 60) &&
		pageIds.has(notFound.pageId) &&
		systemPages &&
		bounded(systemPages.loading?.title, 120) &&
		bounded(systemPages.loading?.body, 320) &&
		bounded(systemPages.offline?.title, 120) &&
		bounded(systemPages.offline?.body, 320) &&
		bounded(systemPages.offline?.actionLabel, 60) &&
		bounded(systemPages.maintenance?.title, 120) &&
		bounded(systemPages.maintenance?.body, 320) &&
		bounded(systemPages.maintenance?.statusText, 120) &&
		bounded(systemPages.error?.title, 120) &&
		bounded(systemPages.error?.body, 320) &&
		bounded(systemPages.error?.actionLabel, 60)
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
			if (item.parentId && !items.some((candidate) => candidate.id === item.parentId))
				issues.push({ area, message: `“${item.label}” has a missing parent link.` });
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
	const systemCopy = [
		structure.systemPages.loading.title,
		structure.systemPages.loading.body,
		structure.systemPages.offline.title,
		structure.systemPages.offline.body,
		structure.systemPages.offline.actionLabel,
		structure.systemPages.maintenance.title,
		structure.systemPages.maintenance.body,
		structure.systemPages.maintenance.statusText,
		structure.systemPages.error.title,
		structure.systemPages.error.body,
		structure.systemPages.error.actionLabel
	];
	if (systemCopy.some((value) => !value.trim()))
		issues.push({
			area: 'experiences',
			message: 'Complete every loading, offline, maintenance, and error message.'
		});
	return issues;
}
