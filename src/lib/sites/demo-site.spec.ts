import { describe, expect, it } from 'vitest';

import {
	cloneDemoSite,
	createDemoSite,
	createSection,
	duplicateDemoPage,
	isDemoSite,
	normalizePageSlug,
	uniquePageSlug
} from './demo-site';

describe('interactive demo site', () => {
	it('ships a complete navigable example with real content', () => {
		const site = createDemoSite();
		expect(site.pages.map((page) => page.name)).toEqual(['Home', 'About', 'Journal']);
		expect(site.pages.every((page) => page.sections.length > 0)).toBe(true);
		expect(
			site.pages.flatMap((page) => page.sections).every((section) => section.title.length > 8)
		).toBe(true);
		expect(site.pages[0].sections[0].image).toMatch(/weekend-lake/);
		expect(site.themeId).toBe('editorial');
	});

	it('creates editable starter sections without sharing mutable state', () => {
		const site = createDemoSite();
		const copy = cloneDemoSite(site);
		copy.pages[0].sections[0].title = 'Changed locally';
		expect(site.pages[0].sections[0].title).not.toBe(copy.pages[0].sections[0].title);
		expect(createSection('gallery', 7)).toMatchObject({
			id: 'gallery-7',
			kind: 'gallery',
			label: 'Photo gallery'
		});
	});

	it('rejects malformed or unbounded persisted drafts', () => {
		expect(isDemoSite(createDemoSite())).toBe(true);
		expect(isDemoSite({ name: 'Bad', pages: [] })).toBe(false);
		const tooManyPages = createDemoSite();
		tooManyPages.pages = Array.from({ length: 25 }, (_, index) => ({
			id: `page-${index}`,
			name: `Page ${index}`,
			slug: `/page-${index}`,
			sections: []
		}));
		expect(isDemoSite(tooManyPages)).toBe(false);
	});

	it('normalizes and de-duplicates friendly page addresses', () => {
		const pages = createDemoSite().pages;
		expect(normalizePageSlug('  Field Notes & Photos  ')).toBe('/field-notes-photos');
		expect(uniquePageSlug('/about', pages)).toBe('/about-2');
		expect(uniquePageSlug('/about', pages, 'about')).toBe('/about');
	});

	it('duplicates a page without reusing page, section, or address identities', () => {
		const site = createDemoSite();
		const copy = duplicateDemoPage(site.pages[0], site.pages, 42);
		expect(copy.name).toBe('Home copy');
		expect(copy.id).not.toBe(site.pages[0].id);
		expect(copy.slug).not.toBe(site.pages[0].slug);
		expect(copy.sections.map((section) => section.id)).not.toEqual(
			site.pages[0].sections.map((section) => section.id)
		);
	});
});
