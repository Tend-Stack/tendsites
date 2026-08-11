import { z } from 'zod';

import { RelativeProjectPathSchema } from '../contracts/sites';
import { SiteFrameworkSchema, type CustomSiteProfile } from '../contracts/custom-site';

const PackageJsonSchema = z
	.object({
		dependencies: z.record(z.string(), z.string()).default({}),
		devDependencies: z.record(z.string(), z.string()).default({})
	})
	.loose();

export const FrameworkAdapterDefinitionSchema = z
	.object({
		framework: SiteFrameworkSchema,
		label: z.string().min(1).max(40),
		defaultContentDirectory: RelativeProjectPathSchema,
		defaultBuildScript: z.string().regex(/^[a-z0-9][a-z0-9._-]{0,95}$/),
		defaultBuildOutput: RelativeProjectPathSchema,
		configurationFiles: z.array(RelativeProjectPathSchema).min(1).max(8)
	})
	.strict();

export const frameworkAdapterCatalog = [
	{
		framework: 'sveltekit',
		label: 'SvelteKit',
		defaultContentDirectory: 'src/content',
		defaultBuildScript: 'build',
		defaultBuildOutput: 'build',
		configurationFiles: ['svelte.config.js', 'vite.config.ts', 'vite.config.js']
	},
	{
		framework: 'astro',
		label: 'Astro',
		defaultContentDirectory: 'src/content',
		defaultBuildScript: 'build',
		defaultBuildOutput: 'dist',
		configurationFiles: ['astro.config.mjs', 'astro.config.ts', 'astro.config.js']
	},
	{
		framework: 'eleventy',
		label: 'Eleventy',
		defaultContentDirectory: 'content',
		defaultBuildScript: 'build',
		defaultBuildOutput: '_site',
		configurationFiles: ['eleventy.config.js', 'eleventy.config.cjs', '.eleventy.js']
	},
	{
		framework: 'nextjs',
		label: 'Next.js',
		defaultContentDirectory: 'content',
		defaultBuildScript: 'build',
		defaultBuildOutput: '.next',
		configurationFiles: ['next.config.js', 'next.config.mjs', 'next.config.ts']
	},
	{
		framework: 'nuxt',
		label: 'Nuxt',
		defaultContentDirectory: 'content',
		defaultBuildScript: 'build',
		defaultBuildOutput: '.output',
		configurationFiles: ['nuxt.config.ts', 'nuxt.config.js']
	},
	{
		framework: 'hugo',
		label: 'Hugo',
		defaultContentDirectory: 'content',
		defaultBuildScript: 'build',
		defaultBuildOutput: 'public',
		configurationFiles: ['hugo.toml', 'hugo.yaml', 'hugo.json', 'config.toml']
	},
	{
		framework: 'jekyll',
		label: 'Jekyll',
		defaultContentDirectory: '_posts',
		defaultBuildScript: 'build',
		defaultBuildOutput: '_site',
		configurationFiles: ['_config.yml', '_config.yaml']
	},
	{
		framework: 'custom',
		label: 'Custom manifest',
		defaultContentDirectory: 'content',
		defaultBuildScript: 'build',
		defaultBuildOutput: 'dist',
		configurationFiles: ['tend.site.json']
	}
] as const satisfies readonly z.input<typeof FrameworkAdapterDefinitionSchema>[];

const parsedCatalog = frameworkAdapterCatalog.map((entry) =>
	FrameworkAdapterDefinitionSchema.parse(entry)
);

export const FrameworkDetectionSchema = z
	.object({
		contract: z.literal('tend.host/sites-framework-detection/v1'),
		status: z.enum(['detected', 'ambiguous', 'unknown']),
		framework: SiteFrameworkSchema.nullable(),
		candidates: z.array(SiteFrameworkSchema).max(8),
		signals: z.array(RelativeProjectPathSchema).max(24),
		reviewRequired: z.literal(true),
		canExecute: z.literal(false)
	})
	.strict();

export type FrameworkDetection = z.infer<typeof FrameworkDetectionSchema>;

export type FrameworkSnapshot = Readonly<{
	files: readonly string[];
	packageJson?: unknown;
	explicitFramework?: z.infer<typeof SiteFrameworkSchema>;
}>;

function normalizeFiles(files: readonly string[]): readonly string[] {
	if (files.length > 20_000) throw new Error('Repository snapshot exceeds the 20,000-file limit');
	const normalized = files.map((path) =>
		RelativeProjectPathSchema.parse(path.replaceAll('\\', '/').replace(/^\.\//, ''))
	);
	if (new Set(normalized).size !== normalized.length) {
		throw new Error('Repository snapshot contains duplicate normalized paths');
	}
	return normalized;
}

function packageDependencies(packageJson: unknown): Readonly<Record<string, string>> {
	const parsed = PackageJsonSchema.safeParse(packageJson);
	if (!parsed.success) return {};
	return { ...parsed.data.dependencies, ...parsed.data.devDependencies };
}

export function detectSiteFramework(snapshot: FrameworkSnapshot): FrameworkDetection {
	const files = normalizeFiles(snapshot.files);
	const fileSet = new Set(files);
	const dependencies = packageDependencies(snapshot.packageJson);
	const matches: Array<{ framework: z.infer<typeof SiteFrameworkSchema>; signals: string[] }> = [];

	const add = (framework: z.infer<typeof SiteFrameworkSchema>, signals: string[]) => {
		if (signals.length > 0) matches.push({ framework, signals });
	};
	add(
		'sveltekit',
		'@sveltejs/kit' in dependencies && files.some((path) => path.startsWith('src/routes/'))
			? ['package.json', files.find((path) => path.startsWith('src/routes/'))!]
			: []
	);
	add('astro', 'astro' in dependencies ? ['package.json'] : []);
	add(
		'eleventy',
		'@11ty/eleventy' in dependencies ||
			files.some((path) =>
				['eleventy.config.js', 'eleventy.config.cjs', '.eleventy.js'].includes(path)
			)
			? ['package.json']
			: []
	);
	add('nextjs', 'next' in dependencies ? ['package.json'] : []);
	add('nuxt', 'nuxt' in dependencies ? ['package.json'] : []);
	add(
		'hugo',
		['hugo.toml', 'hugo.yaml', 'hugo.json', 'config.toml'].filter((path) => fileSet.has(path))
	);
	add(
		'jekyll',
		['_config.yml', '_config.yaml'].filter(
			(path) => fileSet.has(path) && files.some((file) => file.startsWith('_posts/'))
		)
	);
	add('custom', fileSet.has('tend.site.json') ? ['tend.site.json'] : []);

	const candidates = [...new Set(matches.map((match) => match.framework))];
	const explicit = snapshot.explicitFramework
		? SiteFrameworkSchema.parse(snapshot.explicitFramework)
		: null;
	const selected = explicit && candidates.includes(explicit) ? explicit : null;
	const status =
		selected || candidates.length === 1
			? 'detected'
			: candidates.length > 1
				? 'ambiguous'
				: 'unknown';
	return FrameworkDetectionSchema.parse({
		contract: 'tend.host/sites-framework-detection/v1',
		status,
		framework: selected ?? (candidates.length === 1 ? candidates[0] : null),
		candidates,
		signals: [...new Set(matches.flatMap((match) => match.signals))],
		reviewRequired: true,
		canExecute: false
	});
}

export function adapterForProfile(profile: CustomSiteProfile) {
	const adapter = parsedCatalog.find((entry) => entry.framework === profile.framework);
	if (!adapter) throw new Error(`No reviewed adapter exists for ${profile.framework}`);
	return adapter;
}
