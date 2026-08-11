import { describe, expect, it } from 'vitest';

import { createDemoSite } from './demo-site';
import { generateSeoArtifacts, normalizeCanonicalUrl, projectPageSeo } from './seo';

describe('visitor-facing search projections', () => {
	it('accepts only secure canonical website origins', () => {
		expect(normalizeCanonicalUrl('https://example.com/')).toBe('https://example.com');
		expect(normalizeCanonicalUrl('http://example.com')).toBeNull();
		expect(normalizeCanonicalUrl('https://user:pass@example.com')).toBeNull();
		expect(normalizeCanonicalUrl('https://example.com/?preview=1')).toBeNull();
	});

	it('projects friendly page and sharing defaults', () => {
		const site = createDemoSite();
		expect(projectPageSeo(site, site.pages[1])).toMatchObject({
			title: 'About · Willow Journal',
			canonicalUrl: 'https://willow.example/about',
			robots: 'index,follow'
		});
	});

	it('generates deterministic, escaped files without draft posts', () => {
		const site = createDemoSite();
		site.name = 'Willow & Friends';
		site.pages[1].seo.index = false;
		const first = generateSeoArtifacts(site);
		const second = generateSeoArtifacts(site);
		expect(second).toEqual(first);
		expect(first.sitemap).toContain('https://willow.example');
		expect(first.sitemap).not.toContain('/about');
		expect(first.feed).toContain('Willow &amp; Friends');
		expect(first.feed).toContain('field-notes-long-way-home');
		expect(first.feed).not.toContain('cabin-checklist');
	});

	it('generates a closed robots policy for a hidden site', () => {
		const site = createDemoSite();
		site.seo.visibility = 'hidden';
		expect(generateSeoArtifacts(site).robots).toBe('User-agent: *\nDisallow: /\n');
	});
});
