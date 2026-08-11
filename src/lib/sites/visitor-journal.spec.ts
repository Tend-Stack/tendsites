import { describe, expect, it } from 'vitest';

import { createDemoPost, createDemoSite } from './demo-site';
import {
	filterJournalPosts,
	journalTags,
	paginateJournalPosts,
	postNavigation,
	postShareLinks,
	publishedJournalPosts,
	readingMinutes,
	relatedJournalPosts
} from './visitor-journal';

describe('visitor journal projections', () => {
	it('exposes only published entries in deterministic newest-first order', () => {
		const posts = publishedJournalPosts(createDemoSite());
		expect(posts.map((post) => post.slug)).toEqual([
			'field-notes-long-way-home',
			'morning-at-the-lake'
		]);
	});

	it('searches readable fields and filters tags case-insensitively', () => {
		const posts = publishedJournalPosts(createDemoSite());
		expect(filterJournalPosts(posts, 'LOONS', null).map((post) => post.slug)).toEqual([
			'morning-at-the-lake'
		]);
		expect(filterJournalPosts(posts, '', 'slow travel').map((post) => post.slug)).toEqual([
			'field-notes-long-way-home',
			'morning-at-the-lake'
		]);
		expect(journalTags(posts)).toContainEqual({ tag: 'Photography', count: 1 });
	});

	it('clamps pagination and reports honest totals', () => {
		const posts = Array.from({ length: 13 }, (_, index) => {
			const post = createDemoPost(index, []);
			post.status = 'published';
			post.publishedAt = new Date(2026, 0, index + 1).toISOString();
			return post;
		});
		expect(paginateJournalPosts(posts, 99, 6)).toMatchObject({
			page: 3,
			pageCount: 3,
			total: 13
		});
		expect(paginateJournalPosts(posts, 99, 6).items).toHaveLength(1);
	});

	it('derives reading time, related entries, and chronological neighbors', () => {
		const site = createDemoSite();
		const posts = publishedJournalPosts(site);
		posts[1].tags.push('Slow travel');
		expect(readingMinutes('word '.repeat(221))).toBe(2);
		expect(relatedJournalPosts(posts, posts[0]).map((post) => post.id)).toEqual([posts[1].id]);
		expect(postNavigation(posts, posts[0].id)).toEqual({ previous: posts[1], next: null });
	});

	it('generates encoded, non-executing share destinations', () => {
		const site = createDemoSite();
		const post = publishedJournalPosts(site)[0];
		expect(postShareLinks(site, post)).toMatchObject({
			url: 'https://willow.example/journal/field-notes-long-way-home'
		});
		expect(postShareLinks(site, post).email).toContain('Field%20Notes');
	});
});
