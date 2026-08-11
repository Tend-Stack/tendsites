import { describe, expect, it } from 'vitest';

import {
	analyzeSiteStructure,
	createDefaultSiteStructure,
	isDemoSiteStructure,
	normalizeExternalHref,
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

	it('rejects missing pages, unsafe social links, and unbounded navigation', () => {
		const structure = createDefaultSiteStructure(pages);
		structure.header[0].pageId = 'missing';
		expect(isDemoSiteStructure(structure, pages)).toBe(false);
		const social = createDefaultSiteStructure(pages);
		social.social.push({ id: 'unsafe', label: 'Unsafe', href: 'http://example.com' });
		expect(isDemoSiteStructure(social, pages)).toBe(false);
	});
});
