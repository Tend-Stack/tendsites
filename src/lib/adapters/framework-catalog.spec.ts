import { describe, expect, it } from 'vitest';

import {
	adapterForProfile,
	detectSiteFramework,
	frameworkAdapterCatalog
} from './framework-catalog';
import type { CustomSiteProfile } from '../contracts/custom-site';

const packageSnapshot = (dependency: string, extraFiles: string[] = []) => ({
	files: ['package.json', ...extraFiles],
	packageJson: { dependencies: { [dependency]: '1.0.0' } }
});

describe('framework adapter catalog', () => {
	it.each([
		['astro', packageSnapshot('astro')],
		['eleventy', packageSnapshot('@11ty/eleventy')],
		['nextjs', packageSnapshot('next')],
		['nuxt', packageSnapshot('nuxt')],
		['hugo', { files: ['hugo.toml', 'content/posts/hello.md'] }],
		['jekyll', { files: ['_config.yml', '_posts/2026-08-10-hello.md'] }],
		['custom', { files: ['tend.site.json', 'content/index.md'] }],
		['sveltekit', packageSnapshot('@sveltejs/kit', ['src/routes/+page.svelte'])]
	] as const)('detects %s from bounded repository evidence', (expected, snapshot) => {
		expect(detectSiteFramework(snapshot)).toMatchObject({
			status: 'detected',
			framework: expected,
			reviewRequired: true,
			canExecute: false
		});
	});

	it('fails closed on ambiguity unless the reviewed manifest selects a detected adapter', () => {
		const snapshot = {
			files: ['package.json', 'astro.config.mjs', 'next.config.mjs'],
			packageJson: { dependencies: { astro: '5', next: '15' } }
		};
		expect(detectSiteFramework(snapshot)).toMatchObject({
			status: 'ambiguous',
			framework: null,
			candidates: ['astro', 'nextjs']
		});
		expect(detectSiteFramework({ ...snapshot, explicitFramework: 'astro' })).toMatchObject({
			status: 'detected',
			framework: 'astro'
		});
	});

	it('does not let an explicit label invent unsupported evidence', () => {
		expect(detectSiteFramework({ files: ['README.md'], explicitFramework: 'hugo' })).toMatchObject({
			status: 'unknown',
			framework: null
		});
	});

	it.each(['../package.json', '/etc/config', 'C:\\site\\package.json'])(
		'rejects unsafe paths: %s',
		(path) => expect(() => detectSiteFramework({ files: [path] })).toThrow()
	);

	it('bounds snapshots and rejects normalized duplicates', () => {
		expect(() =>
			detectSiteFramework({ files: Array.from({ length: 20_001 }, (_, index) => `f-${index}`) })
		).toThrow('20,000-file limit');
		expect(() => detectSiteFramework({ files: ['package.json', './package.json'] })).toThrow(
			'duplicate normalized paths'
		);
	});

	it('keeps one reviewed definition for every supported framework', () => {
		expect(new Set(frameworkAdapterCatalog.map((adapter) => adapter.framework)).size).toBe(8);
		const profile = {
			contract: 'tend.host/sites-custom-site-profile/v1',
			snapshotId: '11111111-1111-4111-8111-111111111111',
			repositoryId: 'site',
			commit: 'a'.repeat(40),
			framework: 'hugo',
			rendererOwnership: 'repository',
			configuration: 'inferred',
			visualEditing: 'content_only',
			collections: [
				{
					id: 'posts',
					label: 'Posts',
					kind: 'posts',
					directory: 'content/posts',
					format: 'markdown',
					titleField: null,
					bodyField: null,
					slugField: null
				}
			],
			build: { script: 'build', output: 'public' }
		} satisfies CustomSiteProfile;
		expect(adapterForProfile(profile)).toMatchObject({
			framework: 'hugo',
			defaultBuildOutput: 'public'
		});
	});
});
