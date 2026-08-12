import { describe, expect, it } from 'vitest';

import {
	cloneDemoSite,
	createDemoPost,
	createDemoSite,
	createSection,
	duplicateDemoPage,
	isDemoSite,
	normalizePageSlug,
	normalizePostSlug,
	postsForSection,
	uniquePostSlug,
	uniquePageSlug,
	upgradeDemoSite
} from './demo-site';
import { parseEmbedUrl } from './embed';

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
		expect(site.collections[0].items.map((post) => post.status)).toEqual([
			'published',
			'published',
			'draft'
		]);
		expect(site.collections[0].items[0]).toMatchObject({
			featured: true,
			slug: 'field-notes-long-way-home'
		});
	});

	it('creates unique, safe post identities for the content workspace', () => {
		const posts = createDemoSite().collections[0].items;
		expect(normalizePostSlug('  A Lake & A Map  ')).toBe('a-lake-a-map');
		expect(uniquePostSlug('Morning at the lake', posts)).toBe('morning-at-the-lake-2');
		expect(createDemoPost(42, posts)).toMatchObject({
			id: 'post-42',
			slug: 'untitled-post',
			status: 'draft',
			relatedPostIds: [],
			publishedAt: null
		});
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
		expect(createSection('form', 8)).toMatchObject({
			id: 'form-8',
			kind: 'form',
			formRecipientLabel: 'Delivery destination not connected'
		});
	});

	it('projects only published posts into deterministic collection-fed sections', () => {
		const site = createDemoSite();
		const section = site.pages[0].sections.find((item) => item.kind === 'post-feed')!;
		expect(postsForSection(site, section).map((post) => post.slug)).toEqual([
			'field-notes-long-way-home',
			'morning-at-the-lake'
		]);

		section.postOrder = 'featured';
		section.postLimit = 1;
		expect(postsForSection(site, section).map((post) => post.slug)).toEqual([
			'field-notes-long-way-home'
		]);
		site.collections[0].items[0].status = 'draft';
		expect(postsForSection(site, section).map((post) => post.slug)).toEqual([
			'morning-at-the-lake'
		]);
		site.collections[0].items[0].status = 'scheduled';
		site.collections[0].items[0].scheduledAt = '2030-01-01T12:00:00.000Z';
		expect(postsForSection(site, section).map((post) => post.slug)).toEqual([
			'morning-at-the-lake'
		]);
		site.collections[0].items[0].status = 'archived';
		site.collections[0].items[0].scheduledAt = null;
		expect(postsForSection(site, section).map((post) => post.slug)).toEqual([
			'morning-at-the-lake'
		]);
	});

	it('rejects malformed or unbounded persisted drafts', () => {
		expect(isDemoSite(createDemoSite())).toBe(true);
		expect(isDemoSite({ name: 'Bad', pages: [] })).toBe(false);
		const tooManyPages = createDemoSite();
		tooManyPages.pages = Array.from({ length: 25 }, (_, index) => ({
			id: `page-${index}`,
			name: `Page ${index}`,
			slug: `/page-${index}`,
			seo: { ...tooManyPages.pages[0].seo },
			sections: []
		}));
		expect(isDemoSite(tooManyPages)).toBe(false);
		const withEmbed = createDemoSite();
		withEmbed.pages[0].sections.push({
			...createSection('embed', 9),
			embed: parseEmbedUrl('https://youtu.be/dQw4w9WgXcQ')!
		});
		expect(isDemoSite(withEmbed)).toBe(true);
		withEmbed.pages[0].sections.at(-1)!.embed!.sourceUrl = 'https://example.com/video';
		expect(isDemoSite(withEmbed)).toBe(false);
		const duplicatePostSlug = createDemoSite();
		duplicatePostSlug.collections[0].items[1].slug = duplicatePostSlug.collections[0].items[0].slug;
		expect(isDemoSite(duplicatePostSlug)).toBe(false);
		const invalidRelationship = createDemoSite();
		invalidRelationship.collections[0].items[0].relatedPostIds = ['missing-post'];
		expect(isDemoSite(invalidRelationship)).toBe(false);
		invalidRelationship.collections[0].items[0].relatedPostIds = [
			'morning-at-the-lake',
			'morning-at-the-lake'
		];
		expect(isDemoSite(invalidRelationship)).toBe(false);
		const tooManyPosts = createDemoSite();
		tooManyPosts.collections[0].items = Array.from({ length: 251 }, (_, index) =>
			createDemoPost(index, [])
		);
		expect(isDemoSite(tooManyPosts)).toBe(false);
		const withHostMedia = createDemoSite();
		withHostMedia.collections[0].items[0].coverImageSource = {
			kind: 'host_files',
			itemId: 'item-1',
			libraryId: 'library-1',
			name: 'lake.jpg',
			mimeType: 'image/jpeg',
			size: 2048,
			modifiedAt: 1_700_000_000
		};
		withHostMedia.collections[0].items[0].coverImagePresentation = {
			aspect: 'wide',
			fit: 'cover',
			focalX: 42,
			focalY: 58,
			zoom: 1.4
		};
		expect(isDemoSite(withHostMedia)).toBe(true);
		withHostMedia.collections[0].items[0].coverImagePresentation.focalX = 101;
		expect(isDemoSite(withHostMedia)).toBe(false);
		withHostMedia.collections[0].items[0].coverImagePresentation.focalX = 42;
		withHostMedia.collections[0].items[0].coverImageSource.itemId = '';
		expect(isDemoSite(withHostMedia)).toBe(false);
		const invalidForm = createDemoSite();
		const form = invalidForm.pages[1].sections.find((section) => section.kind === 'form')!;
		delete form.formConsentLabel;
		expect(isDemoSite(invalidForm)).toBe(false);
	});

	it('upgrades v0.9 drafts with safe discovery defaults', () => {
		const legacy = structuredClone(createDemoSite()) as unknown as Record<string, unknown>;
		delete legacy.structure;
		const legacySeo = legacy.seo as Record<string, unknown>;
		delete legacySeo.locale;
		delete legacySeo.favicon;
		delete legacy.redirects;
		const collection = (legacy.collections as Array<{ items: Array<Record<string, unknown>> }>)[0];
		for (const post of collection.items) {
			delete post.seo;
			delete post.scheduledAt;
			delete post.relatedPostIds;
		}
		const upgraded = upgradeDemoSite(legacy);
		expect(upgraded?.seo.locale).toBe('en-US');
		expect(upgraded?.redirects).toEqual([]);
		expect(upgraded?.collections[0].items.every((post) => post.seo.title.length > 0)).toBe(true);
		expect(upgraded?.collections[0].items.every((post) => post.scheduledAt === null)).toBe(true);
		expect(upgraded?.collections[0].items.every((post) => post.relatedPostIds.length === 0)).toBe(
			true
		);
		expect(upgraded?.structure.header.map((item) => item.label)).toEqual([
			'Home',
			'About',
			'Journal'
		]);
	});

	it('upgrades v0.14 structures without discarding navigation', () => {
		const legacy = structuredClone(createDemoSite()) as unknown as Record<string, unknown>;
		const structure = legacy.structure as Record<string, unknown>;
		delete structure.systemPages;
		const upgraded = upgradeDemoSite(legacy);
		expect(upgraded?.structure.header.map((item) => item.label)).toEqual([
			'Home',
			'About',
			'Journal'
		]);
		expect(upgraded?.structure.systemPages.maintenance.statusText).toBe('Please check back soon.');
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
