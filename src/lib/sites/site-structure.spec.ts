import { describe, expect, it } from 'vitest';

import {
	analyzeSiteStructure,
	createDefaultSiteStructure,
	isDemoSiteStructure,
	navigationChildren,
	navigationRoots,
	normalizeExternalHref,
	removeNavigationItem,
	removeNavigationPage,
	resolveAnnouncementHref,
	resolveNavigationHref
} from './site-structure';

const pages = [
	{ id: 'home', name: 'Home', slug: '/' },
	{ id: 'journal', name: 'Journal', slug: '/journal' }
];

describe('site structure', () => {
	it('builds bounded page navigation and resolves friendly addresses', () => {
		const structure = createDefaultSiteStructure(pages);
		expect(isDemoSiteStructure(structure, pages)).toBe(true);
		expect(resolveNavigationHref(structure.header[1], pages)).toBe('/journal');
		expect(structure.notFound.pageId).toBe('home');
	});

	it('allows only reviewed external protocols', () => {
		expect(normalizeExternalHref('https://example.com/notes')).toBe('https://example.com/notes');
		expect(normalizeExternalHref('mailto:hello@example.com')).toBe('mailto:hello@example.com');
		expect(normalizeExternalHref('javascript:alert(1)')).toBeNull();
		expect(normalizeExternalHref('http://example.com')).toBeNull();
	});

	it('resolves announcements only to known pages or safe external links', () => {
		expect(resolveAnnouncementHref('/journal', pages)).toBe('/journal');
		expect(resolveAnnouncementHref('/missing', pages)).toBeNull();
		expect(resolveAnnouncementHref('https://example.com/event', pages)).toBe(
			'https://example.com/event'
		);
	});

	it('reports duplicate and invalid destinations without mutating structure', () => {
		const structure = createDefaultSiteStructure(pages);
		structure.header.push({ ...structure.header[0], id: 'duplicate-home' });
		structure.announcement.enabled = true;
		structure.announcement.href = '/missing';
		expect(analyzeSiteStructure(structure, pages).map((issue) => issue.area)).toEqual([
			'header',
			'announcement'
		]);
	});

	it('supports one bounded nested navigation level and promotes orphaned children', () => {
		const structure = createDefaultSiteStructure(pages);
		structure.header[1].parentId = structure.header[0].id;
		expect(isDemoSiteStructure(structure, pages)).toBe(true);
		expect(navigationRoots(structure.header).map((item) => item.label)).toEqual(['Home']);
		expect(navigationChildren(structure.header, structure.header[0].id)[0].label).toBe('Journal');

		const promoted = removeNavigationItem(structure.header, structure.header[0].id);
		expect(promoted).toHaveLength(1);
		expect(promoted[0].parentId).toBeUndefined();

		const pageRemoved = removeNavigationPage(structure.header, 'home');
		expect(pageRemoved).toHaveLength(1);
		expect(pageRemoved[0].parentId).toBeUndefined();
	});

	it('rejects missing parents, duplicate IDs, and navigation deeper than one submenu', () => {
		const missing = createDefaultSiteStructure(pages);
		missing.header[1].parentId = 'missing';
		expect(isDemoSiteStructure(missing, pages)).toBe(false);

		const duplicate = createDefaultSiteStructure(pages);
		duplicate.header[1].id = duplicate.header[0].id;
		expect(isDemoSiteStructure(duplicate, pages)).toBe(false);

		const deep = createDefaultSiteStructure(pages);
		deep.header.push({
			id: 'third',
			label: 'Third',
			type: 'external',
			href: 'https://example.com'
		});
		deep.header[1].parentId = deep.header[0].id;
		deep.header[2].parentId = deep.header[1].id;
		expect(isDemoSiteStructure(deep, pages)).toBe(false);
	});

	it('rejects missing pages, unsafe social links, and unbounded navigation', () => {
		const structure = createDefaultSiteStructure(pages);
		structure.header[0].pageId = 'missing';
		expect(isDemoSiteStructure(structure, pages)).toBe(false);
		const social = createDefaultSiteStructure(pages);
		social.social.push({ id: 'unsafe', label: 'Unsafe', href: 'http://example.com' });
		expect(isDemoSiteStructure(social, pages)).toBe(false);
	});
});
