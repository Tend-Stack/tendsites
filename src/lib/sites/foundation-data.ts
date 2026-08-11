import { indexSiteContent } from '../content/index';
import { importGitCmsConfiguration } from '../content/schema-catalog';
import { frameworkAdapterCatalog } from '../adapters/framework-catalog';
import {
	assessSourceSnapshot,
	type AdoptionPolicy,
	type SourceSnapshot
} from '../contracts/adoption';
import type { SiteModule, StarterTemplate } from '../contracts/catalog';
import {
	assessStarterRepository,
	planCustomSiteAdoption,
	type CustomSiteProfile,
	type StarterRepository
} from '../contracts/custom-site';
import type { ContentEntry, SiteProject } from '../contracts/sites';
import { previewChangeSet } from '../planning/change-preview';
import { starterArchives } from '../starters/archives';

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
	archive: (typeof starterArchives)[keyof typeof starterArchives]
): StarterTemplate {
	return {
		contract: 'tend.host/sites-starter-template/v1',
		id,
		name,
		summary,
		version: '1.0.0',
		revisionSha256: archive.revisionSha256,
		adapter: 'sveltekit',
		goals: [...allGoals],
		modules: [...allStarterModules],
		themeId: id,
		locales: { defaultLocale: 'en', locales: ['en'], strategy: 'multiple_folders' },
		files: archive.files.map((file) => ({
			path: file.path,
			sha256: file.sha256,
			role: file.path === 'tend.site.json' ? ('configuration' as const) : ('project' as const),
			required: true
		}))
	};
}

export const starterCatalog: readonly StarterTemplate[] = [
	starter('minimal', 'Tend Minimal', 'Quiet, spacious and direct.', starterArchives.minimal),
	starter(
		'editorial',
		'Tend Editorial',
		'Stories, essays and publications.',
		starterArchives.editorial
	),
	starter('studio', 'Tend Studio', 'Portfolio work with visual rhythm.', starterArchives.studio),
	starter('docs', 'Tend Docs', 'Readable navigation for knowledge.', starterArchives.docs)
];

export const customSiteModes = [
	{
		id: 'visual',
		name: 'Build visually',
		summary: 'Choose a reviewed design, then edit pages and sections directly in Studio.',
		bestFor: 'The easiest place to start'
	},
	{
		id: 'headless',
		name: 'Keep my custom design',
		summary: 'Keep your framework and templates. Sites edits only the content folders you approve.',
		bestFor: 'Developer-built websites'
	},
	{
		id: 'hybrid',
		name: 'Use both',
		summary:
			'Edit mapped content everywhere and use visual sections where the site adapter supports them.',
		bestFor: 'Progressive adoption'
	}
] as const;

const demoCustomSiteProfile: CustomSiteProfile = {
	contract: 'tend.host/sites-custom-site-profile/v1',
	snapshotId: '77777777-7777-4777-8777-777777777777',
	repositoryId: 'custom-field-journal',
	commit: '7'.repeat(40),
	framework: 'astro',
	rendererOwnership: 'repository',
	configuration: 'manifest',
	visualEditing: 'content_only',
	collections: [
		{
			id: 'posts',
			label: 'Posts',
			kind: 'posts',
			directory: 'src/content/posts',
			format: 'markdown',
			titleField: null,
			bodyField: null,
			slugField: null
		},
		{
			id: 'authors',
			label: 'Authors',
			kind: 'data',
			directory: 'src/data/authors',
			format: 'json',
			titleField: 'name',
			bodyField: null,
			slugField: 'id'
		}
	],
	build: { script: 'build', output: 'dist' }
};

export const demoCustomSitePlan = planCustomSiteAdoption(demoCustomSiteProfile);

export const supportedFrameworkAdapters = frameworkAdapterCatalog;

export const demoImportedContentSchema = importGitCmsConfiguration({
	backend: { name: 'github', repo: 'example/field-journal' },
	publish_mode: 'editorial_workflow',
	collections: [
		{
			name: 'posts',
			label: 'Blog posts',
			folder: 'src/content/posts',
			create: true,
			fields: [
				{ name: 'title', label: 'Title', widget: 'string' },
				{ name: 'date', label: 'Publish date', widget: 'datetime' },
				{ name: 'cover', label: 'Cover image', widget: 'image', required: false },
				{ name: 'body', label: 'Story', widget: 'markdown' }
			]
		}
	]
});

export const starterRepositoryCatalog: readonly StarterRepository[] = [
	{
		contract: 'tend.host/sites-starter-repository/v1',
		id: 'community-editorial-astro',
		name: 'Editorial Journal',
		summary: 'A magazine-style starter with Markdown posts and a clean reading experience.',
		publisher: 'Community publisher',
		trust: 'community',
		reviewStatus: 'reviewed',
		framework: 'astro',
		provider: 'github',
		repositoryId: 'starter-editorial-astro',
		commit: '8'.repeat(40),
		treeSha256: '8'.repeat(64),
		license: 'MIT',
		contentFormats: ['markdown'],
		goals: ['blog', 'publication'],
		metadata: { difficulty: 'easy' }
	},
	{
		contract: 'tend.host/sites-starter-repository/v1',
		id: 'community-docs-eleventy',
		name: 'Clear Documentation',
		summary: 'An accessible documentation starter with Markdown pages and simple navigation.',
		publisher: 'Community publisher',
		trust: 'community',
		reviewStatus: 'reviewed',
		framework: 'eleventy',
		provider: 'github',
		repositoryId: 'starter-docs-eleventy',
		commit: '9'.repeat(40),
		treeSha256: '9'.repeat(64),
		license: 'MIT',
		contentFormats: ['markdown', 'json'],
		goals: ['docs'],
		metadata: { difficulty: 'easy' }
	},
	{
		contract: 'tend.host/sites-starter-repository/v1',
		id: 'community-portfolio-custom',
		name: 'Creative Portfolio',
		summary: 'A flexible portfolio awaiting catalog review before it can be selected.',
		publisher: 'Community publisher',
		trust: 'community',
		reviewStatus: 'unreviewed',
		framework: 'custom',
		provider: 'git',
		repositoryId: 'starter-portfolio-custom',
		commit: 'a'.repeat(40),
		treeSha256: 'a'.repeat(64),
		license: 'MIT',
		contentFormats: ['yaml'],
		goals: ['portfolio'],
		metadata: { difficulty: 'advanced' }
	}
];

export const starterRepositoryAssessments = starterRepositoryCatalog.map((starter) =>
	assessStarterRepository(starter)
);

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
