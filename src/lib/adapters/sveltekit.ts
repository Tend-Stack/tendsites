import { z } from 'zod';

import {
	RelativeProjectPathSchema,
	SiteProjectSchema,
	TendSiteConfigSchema,
	type ContentCollection,
	type SiteAdapter,
	type SiteProject,
	type TendSiteConfig
} from '../contracts/sites';
import {
	buildCommand,
	frozenInstallCommand,
	requireUnambiguousPackageManager,
	type PackageManager
} from './package-manager';

const PackageJsonSchema = z
	.object({
		name: z.string().min(1).max(214).optional(),
		scripts: z.record(z.string(), z.string()).default({}),
		dependencies: z.record(z.string(), z.string()).default({}),
		devDependencies: z.record(z.string(), z.string()).default({})
	})
	.loose();

export type SvelteKitSnapshot = Readonly<{
	files: readonly string[];
	packageJson?: unknown;
	tendSiteJson?: unknown;
}>;

export type SvelteKitInspectionInput = SvelteKitSnapshot &
	Readonly<{
		projectId: string;
		repositoryId: string;
		name: string;
		defaultBranch: string;
	}>;

export type InspectionWarning =
	'tend_site_config_inferred' | 'content_collections_not_found' | 'lockfile_not_found';

export type SvelteKitInspection = Readonly<{
	project: SiteProject;
	packageManager: Exclude<PackageManager, 'unknown'> | null;
	installCommand: readonly string[] | null;
	buildCommand: readonly string[] | null;
	configSource: 'manifest' | 'inferred';
	buildOutput: string;
	warnings: readonly InspectionWarning[];
}>;

function normalizeSnapshotFiles(files: readonly string[]): readonly string[] {
	if (files.length > 20_000) throw new Error('Repository snapshot exceeds the 20,000-file limit');
	const normalized = files.map((path) =>
		RelativeProjectPathSchema.parse(path.replaceAll('\\', '/').replace(/^\.\//, ''))
	);
	if (new Set(normalized).size !== normalized.length) {
		throw new Error('Repository snapshot contains duplicate normalized paths');
	}
	return normalized;
}

function hasDirectory(files: readonly string[], directory: string): boolean {
	return files.some((path) => path === directory || path.startsWith(`${directory}/`));
}

function collectionFrom(
	kind: 'pages' | 'posts' | 'docs',
	directory: string,
	files: readonly string[]
): ContentCollection {
	const label = { pages: 'Pages', posts: 'Posts', docs: 'Documentation' }[kind];
	const hasMdsvex = files.some(
		(path) => path.startsWith(`${directory}/`) && path.toLowerCase().endsWith('.svx')
	);
	return {
		id: kind,
		label,
		kind,
		directory,
		format: hasMdsvex ? 'mdsvex' : 'markdown'
	};
}

function inferConfig(files: readonly string[]): TendSiteConfig {
	const knownContent = {
		pages: 'src/content/pages',
		posts: 'src/content/posts',
		docs: 'src/content/docs'
	} as const;
	const content = Object.fromEntries(
		Object.entries(knownContent).filter(([, directory]) => hasDirectory(files, directory))
	);
	return {
		schema: 1,
		adapter: 'sveltekit',
		content:
			Object.keys(content).length > 0
				? content
				: {
						pages: 'src/content/pages'
					},
		media: {
			provider: 'repository',
			directory: 'static/media',
			publicPath: '/media'
		},
		i18n: { defaultLocale: 'en', locales: ['en'], strategy: 'multiple_folders' },
		build: { script: 'build', output: 'build' }
	};
}

export async function detectSvelteKitProject(snapshot: SvelteKitSnapshot): Promise<boolean> {
	const files = normalizeSnapshotFiles(snapshot.files);
	if (!files.includes('package.json')) return false;

	const parsed = PackageJsonSchema.safeParse(snapshot.packageJson);
	if (!parsed.success) return false;
	const dependencies = { ...parsed.data.dependencies, ...parsed.data.devDependencies };
	return (
		'@sveltejs/kit' in dependencies &&
		(files.includes('vite.config.ts') || files.includes('vite.config.js')) &&
		files.some((path) => path === 'src/routes' || path.startsWith('src/routes/'))
	);
}

export async function inspectSvelteKitProject(
	input: SvelteKitInspectionInput
): Promise<SvelteKitInspection> {
	const files = normalizeSnapshotFiles(input.files);
	if (!(await detectSvelteKitProject({ ...input, files }))) {
		throw new Error('Repository is not a compatible SvelteKit project');
	}

	const packageJson = PackageJsonSchema.parse(input.packageJson);
	const configSource = input.tendSiteJson === undefined ? 'inferred' : 'manifest';
	const config =
		input.tendSiteJson === undefined
			? inferConfig(files)
			: TendSiteConfigSchema.parse(input.tendSiteJson);
	if (!(config.build.script in packageJson.scripts)) {
		throw new Error(`Package script is missing: ${config.build.script}`);
	}

	const packageManager = requireUnambiguousPackageManager(files);
	const collections = Object.entries(config.content)
		.filter((entry): entry is [keyof typeof config.content, string] => Boolean(entry[1]))
		.filter(([, directory]) => hasDirectory(files, directory))
		.map(([kind, directory]) => collectionFrom(kind, directory, files));

	const warnings: InspectionWarning[] = [];
	if (configSource === 'inferred') warnings.push('tend_site_config_inferred');
	if (collections.length === 0) warnings.push('content_collections_not_found');
	if (!packageManager) warnings.push('lockfile_not_found');

	const project = SiteProjectSchema.parse({
		contract: 'tend.host/sites/v1',
		id: input.projectId,
		name: input.name,
		adapter: 'sveltekit',
		repositoryId: input.repositoryId,
		defaultBranch: input.defaultBranch,
		collections,
		locales: config.i18n,
		mediaDirectory: config.media.directory,
		mediaPublicPath: config.media.publicPath,
		buildScript: config.build.script,
		status: warnings.length === 0 ? 'ready' : 'attention'
	});

	return {
		project,
		packageManager,
		installCommand: packageManager ? frozenInstallCommand(packageManager) : null,
		buildCommand: packageManager ? buildCommand(packageManager, config.build.script) : null,
		configSource,
		buildOutput: config.build.output,
		warnings
	};
}

export const svelteKitAdapter: SiteAdapter = {
	id: 'sveltekit',
	detect: detectSvelteKitProject,
	async inspect(input) {
		return (
			await inspectSvelteKitProject({
				...input,
				projectId: input.projectId,
				repositoryId: input.repositoryId,
				name: input.name,
				defaultBranch: input.defaultBranch
			})
		).project;
	}
};
