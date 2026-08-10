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
});
