import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it, vi } from 'vitest';

import { createDemoSite, createSection } from './demo-site';
import { createPortableSource, MAX_EXPORT_ASSETS, PORTABLE_SOURCE_CONTRACT } from './source-export';

describe('portable site source export', () => {
	it('writes ordinary site source, Markdown, and deduplicated portable media', async () => {
		const site = createDemoSite();
		const resolve = vi.fn(async () => ({
			bytes: new Uint8Array([137, 80, 78, 71]),
			mimeType: 'image/png'
		}));
		const result = await createPortableSource(
			site,
			resolve,
			() => new Date('2026-08-11T15:00:00.000Z')
		);
		const files = unzipSync(result.archive);
		const document = JSON.parse(strFromU8(files['site.json'])) as {
			contract: string;
			generatedAt: string;
			site: typeof site;
		};

		expect(document.contract).toBe(PORTABLE_SOURCE_CONTRACT);
		expect(document.generatedAt).toBe('2026-08-11T15:00:00.000Z');
		expect(document.site.pages[0].sections[0].image).toMatch(/^\/assets\//);
		expect(Object.keys(files)).toContain('content/pages/home.md');
		expect(Object.keys(files)).toContain('content/posts/journal/field-notes-long-way-home.md');
		expect(strFromU8(files['content/posts/journal/field-notes-long-way-home.md'])).toContain(
			'related: ["morning-at-the-lake"]'
		);
		expect(strFromU8(files['README.md'])).toContain('does not require TEND Sites at runtime');
		expect(strFromU8(files['EXPORT-REPORT.md'])).toContain('All referenced media was copied');
		expect(result.assetCount).toBe(3);
		expect(resolve).toHaveBeenCalledTimes(3);
	});

	it('omits unresolved private references and reports them without leaking the URL', async () => {
		const site = createDemoSite();
		const privateReference = '/api/extensions/files/private/item-1?token=secret';
		const post = site.collections[0].items[0];
		post.coverImage = privateReference;
		post.seo.socialImage = privateReference;
		post.coverImageSource = {
			kind: 'host_files',
			itemId: 'item-1',
			libraryId: 'library-1',
			name: 'private.jpg',
			mimeType: 'image/jpeg',
			size: 100,
			modifiedAt: null
		};
		const result = await createPortableSource(site, async (request) =>
			request.source === 'host_files'
				? null
				: { bytes: new Uint8Array([1]), mimeType: 'image/webp' }
		);
		const files = unzipSync(result.archive);
		const siteJson = strFromU8(files['site.json']);
		const report = strFromU8(files['EXPORT-REPORT.md']);

		expect(siteJson).not.toContain(privateReference);
		expect(JSON.parse(siteJson).site.collections[0].items[0].coverImage).toBeUndefined();
		expect(JSON.parse(siteJson).site.collections[0].items[0].coverImageSource).toBeUndefined();
		expect(report).toContain('could not be copied');
		expect(report).not.toContain(privateReference);
		expect(result.warnings).toHaveLength(1);
	});

	it('omits active SVG media before the host source boundary', async () => {
		const site = createDemoSite();
		const result = await createPortableSource(site, async () => ({
			bytes: new TextEncoder().encode('<svg><script>alert(1)</script></svg>'),
			mimeType: 'image/svg+xml'
		}));
		const files = unzipSync(result.archive);
		const siteJson = strFromU8(files['site.json']);

		expect(Object.keys(files).some((path) => path.endsWith('.svg'))).toBe(false);
		expect(siteJson).not.toContain('/assets/');
		expect(result.assetCount).toBe(0);
		expect(result.warnings.length).toBeGreaterThan(0);
	});

	it('fails closed when a draft exceeds the bounded unique-media inventory', async () => {
		const site = createDemoSite();
		site.pages[0].sections = Array.from({ length: MAX_EXPORT_ASSETS + 1 }, (_, index) => ({
			...createSection('gallery', index),
			image: `/media/unique-${index}.png`
		}));
		await expect(
			createPortableSource(site, async () => ({
				bytes: new Uint8Array([1]),
				mimeType: 'image/png'
			}))
		).rejects.toThrow(`more than ${MAX_EXPORT_ASSETS} unique images`);
	});
});
