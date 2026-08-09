import { describe, expect, it } from 'vitest';

import type { ContentEntry, SiteProject } from '../contracts/sites';
import { indexSiteContent } from './index';

const project: SiteProject = {
	contract: 'tend.host/sites/v1',
	id: 'weekend-notes',
	name: 'Weekend Notes',
	adapter: 'sveltekit',
	repositoryId: 'repo-weekend-notes',
	defaultBranch: 'main',
	collections: [
		{
			id: 'posts',
			label: 'Posts',
			kind: 'posts',
			directory: 'src/content/posts',
			format: 'markdown'
		}
	],
	locales: { defaultLocale: 'en', locales: ['en', 'es'], strategy: 'multiple_folders' },
	mediaDirectory: 'static/media',
	mediaPublicPath: '/media',
	buildScript: 'build',
	status: 'draft'
};

const entry: ContentEntry = {
	contract: 'tend.host/sites-content-entry/v1',
	id: 'welcome-en',
	logicalId: 'welcome',
	collectionId: 'posts',
	locale: 'en',
	path: 'src/content/posts/en/welcome.md',
	title: 'Welcome',
	slug: 'welcome',
	description: null,
	draft: true,
	frontmatter: {},
	bodySha256: 'a'.repeat(64)
};

describe('portable content index', () => {
	it('indexes collections, locales, drafts, and explicit navigation deterministically', () => {
		const index = indexSiteContent(
			project,
			[entry],
			[{ id: 'home', label: 'Home', entryId: 'welcome-en', order: 0 }]
		);
		expect(index.total).toBe(1);
		expect(index.drafts).toBe(1);
		expect(index.byCollection).toEqual({ posts: 1 });
		expect(index.byLocale).toEqual({ en: 1, es: 0 });
	});

	it.each([
		['unknown collection', { ...entry, collectionId: 'pages' }],
		['unknown locale', { ...entry, locale: 'fr' }],
		['path outside its collection', { ...entry, path: 'src/routes/welcome.md' }],
		['unsupported extension', { ...entry, path: 'src/content/posts/en/welcome.txt' }]
	])('rejects content with an %s', (_label, invalidEntry) => {
		expect(() => indexSiteContent(project, [invalidEntry], [])).toThrow();
	});

	it('rejects duplicate logical content in the same locale', () => {
		expect(() =>
			indexSiteContent(
				project,
				[
					entry,
					{
						...entry,
						id: 'welcome-copy',
						path: 'src/content/posts/en/welcome-copy.md'
					}
				],
				[]
			)
		).toThrow('logical ID and locale pairs');
	});

	it('rejects duplicate paths and dangling navigation', () => {
		expect(() => indexSiteContent(project, [entry, { ...entry, id: 'second' }], [])).toThrow(
			'Content paths must be unique'
		);
		expect(() =>
			indexSiteContent(
				project,
				[entry],
				[{ id: 'missing', label: 'Missing', entryId: 'missing-entry', order: 0 }]
			)
		).toThrow('unknown content');
	});
});
