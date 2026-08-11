import { describe, expect, it } from 'vitest';

import { createDemoSite } from './demo-site';
import { assessDemoSiteHealth } from './site-health';

describe('site health guidance', () => {
	it('ships the complete example without health issues', () => {
		expect(assessDemoSiteHealth(createDemoSite())).toEqual({
			status: 'ready',
			blockers: 0,
			attention: 0,
			issues: []
		});
	});

	it('finds actionable copy, accessibility, structure, and address issues', () => {
		const site = createDemoSite();
		site.pages[1].slug = '/';
		site.pages[1].sections = [];
		site.pages[0].sections[0].title = '';
		site.pages[0].sections[0].body = '';
		site.pages[0].sections[0].imageAlt = '';

		const report = assessDemoSiteHealth(site);
		expect(report.status).toBe('needs_attention');
		expect(report.blockers).toBe(3);
		expect(report.attention).toBe(2);
		expect(report.issues.map((issue) => issue.code)).toEqual([
			'missing_title',
			'missing_body',
			'missing_image_alt',
			'duplicate_address',
			'empty_page'
		]);
	});

	it('links search issues to the exact SEO workspace', () => {
		const site = createDemoSite();
		site.seo.canonicalUrl = 'http://unsafe.example';
		site.pages[1].seo.description = '';
		const report = assessDemoSiteHealth(site);
		expect(report.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ code: 'invalid_canonical_url', target: 'site-seo' }),
				expect.objectContaining({
					code: 'missing_page_description',
					pageId: 'about',
					target: 'page-seo'
				})
			])
		);
	});

	it('links navigation diagnostics to the exact structure workspace', () => {
		const site = createDemoSite();
		site.structure.header.push({ ...site.structure.header[0], id: 'duplicate-home' });
		const report = assessDemoSiteHealth(site);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: 'structure_issue',
				target: 'structure',
				structureArea: 'header'
			})
		);
	});

	it('links incomplete recovery copy to the system-pages editor', () => {
		const site = createDemoSite();
		site.structure.systemPages.offline.actionLabel = '';
		const report = assessDemoSiteHealth(site);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: 'structure_issue',
				target: 'structure',
				structureArea: 'experiences'
			})
		);
	});
});
