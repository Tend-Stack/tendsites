import { describe, expect, it } from 'vitest';

import { ChangeSetSchema, LocaleConfigSchema, SiteProjectSchema, type SiteProject } from './sites';

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
			label: 'Blog posts',
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

describe('Sites contracts', () => {
	it('accepts an ordinary portable project contract', () => {
		expect(SiteProjectSchema.parse(project)).toEqual(project);
	});

	it.each(['../secrets', '/etc/passwd', 'Q:\\outside'])(
		'rejects project paths outside the assigned repository: %s',
		(directory) => {
			expect(() => SiteProjectSchema.parse({ ...project, mediaDirectory: directory })).toThrow();
		}
	);

	it('requires the default locale once and inside the locale set', () => {
		expect(() =>
			LocaleConfigSchema.parse({
				defaultLocale: 'fr',
				locales: ['en', 'es', 'es'],
				strategy: 'multiple_folders'
			})
		).toThrow();
	});

	it('forbids unknown fields and traversal in change sets', () => {
		expect(() =>
			ChangeSetSchema.parse({
				contract: 'tend.host/sites-change-set/v1',
				id: '11111111-1111-4111-8111-111111111111',
				projectId: 'weekend-notes',
				baseRevision: 'a'.repeat(64),
				summary: 'Update the About page',
				files: [
					{
						path: '../../outside.md',
						kind: 'update',
						beforeSha256: 'b'.repeat(64),
						afterSha256: 'c'.repeat(64)
					}
				],
				validation: 'pending',
				createdAt: '2026-08-09T12:00:00-04:00',
				unexpected: true
			})
		).toThrow();
	});
});
