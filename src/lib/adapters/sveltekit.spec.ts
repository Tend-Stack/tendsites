import { describe, expect, it } from 'vitest';

import { detectSvelteKitProject, inspectSvelteKitProject } from './sveltekit';

const files = [
	'package.json',
	'package-lock.json',
	'vite.config.ts',
	'src/routes/+page.svelte',
	'src/content/posts/en/welcome.md',
	'static/media/.gitkeep'
];

const packageJson = {
	name: 'weekend-notes',
	scripts: { dev: 'vite dev', build: 'vite build', preview: 'vite preview' },
	devDependencies: { '@sveltejs/kit': '^2.0.0' }
};

const tendSiteJson = {
	schema: 1,
	adapter: 'sveltekit',
	content: { posts: 'src/content/posts' },
	media: { provider: 'repository', directory: 'static/media', publicPath: '/media' },
	i18n: { defaultLocale: 'en', locales: ['en'], strategy: 'multiple_folders' },
	build: { script: 'build', output: 'build' }
};

const identity = {
	projectId: 'weekend-notes',
	repositoryId: 'repo-weekend-notes',
	name: 'Weekend Notes',
	defaultBranch: 'main'
};

describe('SvelteKit adapter', () => {
	it('detects and inspects a manifest-backed portable project', async () => {
		expect(await detectSvelteKitProject({ files, packageJson })).toBe(true);

		const result = await inspectSvelteKitProject({
			...identity,
			files,
			packageJson,
			tendSiteJson
		});
		expect(result.project.status).toBe('ready');
		expect(result.project.collections).toEqual([
			{
				id: 'posts',
				label: 'Posts',
				kind: 'posts',
				directory: 'src/content/posts',
				format: 'markdown'
			}
		]);
		expect(result.installCommand).toEqual(['npm', 'ci']);
		expect(result.buildCommand).toEqual(['npm', 'run', 'build']);
		expect(result.warnings).toEqual([]);
	});

	it('reports inference instead of claiming full readiness', async () => {
		const result = await inspectSvelteKitProject({ ...identity, files, packageJson });
		expect(result.configSource).toBe('inferred');
		expect(result.project.status).toBe('attention');
		expect(result.warnings).toContain('tend_site_config_inferred');
	});

	it('uses the exact configured package script as an argv element', async () => {
		const result = await inspectSvelteKitProject({
			...identity,
			files,
			packageJson: {
				...packageJson,
				scripts: { ...packageJson.scripts, generate: 'vite build' }
			},
			tendSiteJson: {
				...tendSiteJson,
				build: { script: 'generate', output: 'build' }
			}
		});
		expect(result.buildCommand).toEqual(['npm', 'run', 'generate']);
	});

	it('reports a missing lockfile without inventing an install command', async () => {
		const result = await inspectSvelteKitProject({
			...identity,
			files: files.filter((path) => path !== 'package-lock.json'),
			packageJson,
			tendSiteJson
		});
		expect(result.packageManager).toBeNull();
		expect(result.installCommand).toBeNull();
		expect(result.buildCommand).toBeNull();
		expect(result.warnings).toContain('lockfile_not_found');
	});

	it('rejects provider snapshots above the bounded file limit', async () => {
		const oversizedFiles = Array.from({ length: 20_001 }, (_, index) => `src/file-${index}.ts`);
		await expect(detectSvelteKitProject({ files: oversizedFiles, packageJson })).rejects.toThrow(
			'20,000-file limit'
		);
	});

	it('rejects conflicting lockfiles before choosing an execution command', async () => {
		await expect(
			inspectSvelteKitProject({
				...identity,
				files: [...files, 'pnpm-lock.yaml'],
				packageJson,
				tendSiteJson
			})
		).rejects.toThrow('Conflicting lockfiles');
	});

	it.each(['../outside/package.json', '/etc/package.json', 'Q:\\outside\\package.json'])(
		'rejects repository snapshots containing an unsafe path: %s',
		async (unsafePath) => {
			await expect(
				inspectSvelteKitProject({
					...identity,
					files: [...files, unsafePath],
					packageJson,
					tendSiteJson
				})
			).rejects.toThrow();
		}
	);

	it('rejects duplicate normalized paths and missing configured scripts', async () => {
		await expect(
			inspectSvelteKitProject({
				...identity,
				files: [...files, './package.json'],
				packageJson,
				tendSiteJson
			})
		).rejects.toThrow('duplicate normalized paths');
		await expect(
			inspectSvelteKitProject({
				...identity,
				files,
				packageJson: { ...packageJson, scripts: { dev: 'vite dev' } },
				tendSiteJson
			})
		).rejects.toThrow('Package script is missing');
	});

	it('does not misclassify an ordinary Vite project as SvelteKit', async () => {
		expect(
			await detectSvelteKitProject({
				files: ['package.json', 'vite.config.ts', 'src/main.ts'],
				packageJson: { scripts: { build: 'vite build' }, devDependencies: { vite: '^8' } }
			})
		).toBe(false);
	});
});
