import { describe, expect, it } from 'vitest';

import { AiProposalSchema, ContentEntrySchema, TendSiteConfigSchema } from './sites';

describe('portable content and proposal contracts', () => {
	it('accepts portable tend.site.json metadata and rejects hidden authority', () => {
		const config = {
			schema: 1,
			adapter: 'sveltekit',
			content: { pages: 'src/content/pages', posts: 'src/content/posts' },
			media: { provider: 'repository', directory: 'static/media', publicPath: '/media' },
			i18n: { defaultLocale: 'en', locales: ['en', 'es'], strategy: 'multiple_folders' },
			build: { script: 'build', output: 'build' }
		};
		expect(TendSiteConfigSchema.parse(config)).toEqual(config);
		expect(() => TendSiteConfigSchema.parse({ ...config, deployToken: 'not-allowed' })).toThrow();
		for (const directory of ['src//pages', 'src/./pages', 'src\\pages', 'src/pages\u0000']) {
			expect(() =>
				TendSiteConfigSchema.parse({
					...config,
					content: { pages: directory }
				})
			).toThrow();
		}
	});

	it('requires content entries to remain repository-confined and digest-bound', () => {
		const entry = {
			contract: 'tend.host/sites-content-entry/v1',
			id: 'welcome-en',
			logicalId: 'welcome',
			collectionId: 'posts',
			locale: 'en',
			path: 'src/content/posts/en/welcome.md',
			title: 'Welcome',
			slug: 'welcome',
			description: null,
			draft: false,
			frontmatter: { tags: ['news'] },
			bodySha256: 'd'.repeat(64)
		};
		expect(ContentEntrySchema.parse(entry)).toEqual(entry);
		expect(() => ContentEntrySchema.parse({ ...entry, path: '../welcome.md' })).toThrow();
		expect(() =>
			ContentEntrySchema.parse({
				...entry,
				frontmatter: { unsafe: () => 'not JSON data' }
			})
		).toThrow();
	});

	it('binds AI-proposed change sets to the same project and revision', () => {
		const changeSet = {
			contract: 'tend.host/sites-change-set/v1',
			id: '11111111-1111-4111-8111-111111111111',
			projectId: 'weekend-notes',
			baseRevision: 'a'.repeat(64),
			summary: 'Rewrite the introduction',
			files: [
				{
					path: 'src/content/pages/about.md',
					kind: 'update',
					beforeSha256: 'b'.repeat(64),
					afterSha256: 'c'.repeat(64)
				}
			],
			validation: 'pending',
			createdAt: '2026-08-09T12:00:00-04:00'
		};
		const proposal = {
			contract: 'tend.host/sites-ai-proposal/v1',
			proposalId: '22222222-2222-4222-8222-222222222222',
			projectId: 'weekend-notes',
			baseRevision: 'a'.repeat(64),
			kind: 'change_set',
			summary: 'A clearer introduction',
			providerId: 'user-provider',
			model: 'configured-model',
			promptSha256: 'e'.repeat(64),
			payloadSha256: 'f'.repeat(64),
			changeSet,
			status: 'proposed',
			createdAt: '2026-08-09T12:00:01-04:00'
		};
		expect(AiProposalSchema.parse(proposal).status).toBe('proposed');
		expect(() => AiProposalSchema.parse({ ...proposal, projectId: 'different-project' })).toThrow(
			'same project'
		);
	});
});
