import type { SiteProject } from '$lib/contracts/sites';

export const projects: ReadonlyArray<SiteProject & { url: string; updated: string }> = [
	{
		contract: 'tend.host/sites/v1',
		id: 'willow-journal',
		name: 'Willow Journal',
		adapter: 'sveltekit',
		repositoryId: 'repo-willow-journal',
		defaultBranch: 'main',
		collections: [
			{
				id: 'posts',
				label: 'Stories',
				kind: 'posts',
				directory: 'src/content/posts',
				format: 'markdown'
			}
		],
		locales: { defaultLocale: 'en', locales: ['en', 'es'], strategy: 'multiple_folders' },
		mediaDirectory: 'static/media',
		mediaPublicPath: '/media',
		buildScript: 'build',
		status: 'published',
		url: 'willow.example',
		updated: 'Edited 18 minutes ago'
	},
	{
		contract: 'tend.host/sites/v1',
		id: 'northstar-docs',
		name: 'Northstar Docs',
		adapter: 'sveltekit',
		repositoryId: 'repo-northstar-docs',
		defaultBranch: 'main',
		collections: [
			{
				id: 'docs',
				label: 'Documentation',
				kind: 'docs',
				directory: 'src/content/docs',
				format: 'mdsvex'
			}
		],
		locales: { defaultLocale: 'en', locales: ['en'], strategy: 'multiple_folders' },
		mediaDirectory: 'static/media',
		mediaPublicPath: '/media',
		buildScript: 'build',
		status: 'published',
		url: 'docs.example',
		updated: 'Edited yesterday'
	},
	{
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
		status: 'draft',
		url: 'Not published yet',
		updated: 'Edited 3 days ago'
	}
];

export const goals = [
	{
		id: 'personal',
		title: 'Personal / Profile',
		copy: 'A home for your story, links and interests.'
	},
	{ id: 'blog', title: 'Blog / Publication', copy: 'Articles, categories, authors and feeds.' },
	{ id: 'business', title: 'Small Business', copy: 'Services, team, testimonials and contact.' },
	{ id: 'docs', title: 'Documentation', copy: 'Guides, navigation, code and API references.' },
	{ id: 'portfolio', title: 'Portfolio', copy: 'Projects, galleries and case studies.' },
	{ id: 'media', title: 'Podcast / Media', copy: 'Episodes, players, video and subscribers.' }
] as const;

export const themes = [
	{ id: 'minimal', name: 'Tend Minimal', copy: 'Quiet, spacious and direct.' },
	{ id: 'editorial', name: 'Tend Editorial', copy: 'Stories, essays and publications.' },
	{ id: 'studio', name: 'Tend Studio', copy: 'Portfolio work with visual rhythm.' },
	{ id: 'docs', name: 'Tend Docs', copy: 'Readable navigation for knowledge.' }
] as const;

export const modules = ['Home', 'About', 'Blog', 'Documentation', 'Gallery', 'Projects', 'Contact'];
