import { indexSiteContent } from '../content/index';
import {
	assessSourceSnapshot,
	type AdoptionPolicy,
	type SourceSnapshot
} from '../contracts/adoption';
import type { SiteModule, StarterTemplate } from '../contracts/catalog';
import type { ContentEntry, SiteProject } from '../contracts/sites';
import { previewChangeSet } from '../planning/change-preview';

const allGoals = ['personal', 'blog', 'business', 'docs', 'portfolio', 'media'] as const;
export const allStarterModules: SiteModule[] = [
	'home',
	'about',
	'blog',
	'documentation',
	'gallery',
	'projects',
	'contact'
];

function starter(
	id: string,
	name: string,
	summary: string,
	revisionCharacter: string
): StarterTemplate {
	return {
		contract: 'tend.host/sites-starter-template/v1',
		id,
		name,
		summary,
		version: '1.0.0',
		revisionSha256: revisionCharacter.repeat(64),
		adapter: 'sveltekit',
		goals: [...allGoals],
		modules: [...allStarterModules],
		themeId: id,
		locales: { defaultLocale: 'en', locales: ['en'], strategy: 'multiple_folders' },
		files: [
			{ path: 'package.json', sha256: '1'.repeat(64), role: 'project', required: true },
			{
				path: 'tend.site.json',
				sha256: '2'.repeat(64),
				role: 'configuration',
				required: true
			},
			{
				path: 'src/routes/+page.svelte',
				sha256: revisionCharacter.repeat(64),
				role: 'project',
				required: true
			}
		]
	};
}

export const starterCatalog: readonly StarterTemplate[] = [
	starter('minimal', 'Tend Minimal', 'Quiet, spacious and direct.', 'a'),
	starter('editorial', 'Tend Editorial', 'Stories, essays and publications.', 'b'),
	starter('studio', 'Tend Studio', 'Portfolio work with visual rhythm.', 'c'),
	starter('docs', 'Tend Docs', 'Readable navigation for knowledge.', 'd')
];

const adoptionSnapshot: SourceSnapshot = {
	contract: 'tend.host/sites-source-snapshot/v1',
	snapshotId: '33333333-3333-4333-8333-333333333333',
	provider: 'github',
	providerInstallationId: 'demo-installation',
	repositoryId: 'repo-weekend-notes',
	commit: 'e'.repeat(40),
	treeSha256: 'f'.repeat(64),
	archiveSha256: '0'.repeat(64),
	actorId: 'demo-owner',
	trustClass: 'protected',
	fileCount: 184,
	archiveBytes: 1_420_000,
	hasSubmodules: false,
	hasLfsPointers: false,
	hasPrivateDependencies: false,
	createdAt: '2026-08-09T20:00:00Z',
	expiresAt: '2026-08-09T20:05:00Z'
};

const adoptionPolicy: AdoptionPolicy = {
	contract: 'tend.host/sites-adoption-policy/v1',
	maxFiles: 20_000,
	maxArchiveBytes: 250_000_000,
	allowSubmodules: false,
	allowLfsPointers: false,
	allowPrivateDependencies: false,
	allowUntrustedSource: false
};

export const demoAdoptionReport = assessSourceSnapshot(
	adoptionSnapshot,
	adoptionPolicy,
	'2026-08-09T20:01:00Z'
);

const demoEntries: ContentEntry[] = [
	{
		contract: 'tend.host/sites-content-entry/v1',
		id: 'field-notes-en',
		logicalId: 'field-notes',
		collectionId: 'posts',
		locale: 'en',
		path: 'src/content/posts/en/field-notes.md',
		title: 'Field Notes',
		slug: 'field-notes',
		description: 'A weekend route worth remembering.',
		draft: false,
		frontmatter: { featured: true },
		bodySha256: '3'.repeat(64)
	}
];

const demoProject: SiteProject = {
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
	locales: { defaultLocale: 'en', locales: ['en'], strategy: 'multiple_folders' },
	mediaDirectory: 'static/media',
	mediaPublicPath: '/media',
	buildScript: 'build',
	status: 'draft'
};

export const demoContentIndex = indexSiteContent(demoProject, demoEntries, [
	{ id: 'field-notes', label: 'Field Notes', entryId: 'field-notes-en', order: 0 }
]);

export const demoChangePreview = previewChangeSet({
	contract: 'tend.host/sites-change-set/v1',
	id: '44444444-4444-4444-8444-444444444444',
	projectId: 'weekend-notes',
	baseRevision: '4'.repeat(64),
	summary: 'Update the home page and add Field Notes',
	files: [
		{
			path: 'src/routes/+page.svelte',
			kind: 'update',
			beforeSha256: '5'.repeat(64),
			afterSha256: '6'.repeat(64)
		},
		{
			path: 'src/content/posts/en/field-notes.md',
			kind: 'create',
			beforeSha256: null,
			afterSha256: '3'.repeat(64)
		}
	],
	validation: 'pending',
	createdAt: '2026-08-09T20:00:00Z'
});
