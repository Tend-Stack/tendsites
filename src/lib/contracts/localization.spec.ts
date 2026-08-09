import { describe, expect, it } from 'vitest';

import type { ContentEntry, SiteProject } from './sites';
import { reportLocalizationCoverage, verifyTranslationProposal } from './localization';

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

const source: ContentEntry = {
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
	frontmatter: {},
	bodySha256: 'a'.repeat(64)
};

const proposal = {
	contract: 'tend.host/sites-translation-proposal/v1' as const,
	proposalId: '11111111-1111-4111-8111-111111111111',
	projectId: 'weekend-notes',
	logicalId: 'welcome',
	sourceEntryId: 'welcome-en',
	sourceLocale: 'en',
	targetLocale: 'es',
	sourceContentSha256: 'a'.repeat(64),
	proposedContentSha256: 'b'.repeat(64),
	provider: 'manual' as const,
	status: 'proposed' as const,
	createdAt: '2026-08-09T20:00:00Z'
};

describe('localization evidence', () => {
	it('reports missing locales without treating source entries as translated', () => {
		const report = reportLocalizationCoverage(project, [source]);
		expect(report.coveragePercent).toBe(50);
		expect(report.missing).toEqual([{ logicalId: 'welcome', locales: ['es'] }]);
	});

	it('verifies a proposal against exact source content and configured target locale', () => {
		expect(verifyTranslationProposal(proposal, project, source)).toEqual(proposal);
		expect(() =>
			verifyTranslationProposal(
				{ ...proposal, sourceContentSha256: 'c'.repeat(64) },
				project,
				source
			)
		).toThrow('source evidence');
		expect(() =>
			verifyTranslationProposal({ ...proposal, targetLocale: 'fr' }, project, source)
		).toThrow('not configured');
	});

	it('rejects duplicate logical-locale entries and same-locale proposals', () => {
		expect(() =>
			reportLocalizationCoverage(project, [
				source,
				{ ...source, id: 'copy', path: 'src/content/posts/en/copy.md' }
			])
		).toThrow('duplicate locale');
		expect(() =>
			verifyTranslationProposal({ ...proposal, targetLocale: 'en' }, project, source)
		).toThrow();
	});
});
