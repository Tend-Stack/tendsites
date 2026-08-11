import { describe, expect, it } from 'vitest';

import { createDemoSite } from './demo-site';
import {
	analyzeRedirects,
	generateSeoArtifacts,
	normalizeCanonicalUrl,
	projectPageSeo,
	projectPostSeo
} from './seo';

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

	it('projects entry-specific search and sharing metadata', () => {
		const site = createDemoSite();
		const post = site.collections[0].items[0];
		post.seo.title = 'A quieter route home';
		expect(projectPostSeo(site, post)).toMatchObject({
			title: 'A quieter route home · Willow Journal',
			canonicalUrl: 'https://willow.example/journal/field-notes-long-way-home'
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
		expect(first.atom).toContain('xmlns="http://www.w3.org/2005/Atom"');
		expect(first.atom).not.toContain('cabin-reading-list');
		expect(JSON.parse(first.structuredData)['@graph']).toEqual(
			expect.arrayContaining([expect.objectContaining({ '@type': 'WebSite', inLanguage: 'en-US' })])
		);
	});

	it('reports duplicate, broken, and looping redirects', () => {
		const site = createDemoSite();
		site.redirects = [
			{ id: 'one', from: '/old', to: '/about', status: 301 },
			{ id: 'two', from: '/old', to: '/missing', status: 302 },
			{ id: 'three', from: '/loop-a', to: '/loop-b', status: 301 },
			{ id: 'four', from: '/loop-b', to: '/loop-a', status: 301 }
		];
		const issues = analyzeRedirects(site);
		expect(issues.map((issue) => issue.kind)).toEqual(
			expect.arrayContaining(['duplicate', 'missing-target', 'loop'])
		);
	});

	it('generates a closed robots policy for a hidden site', () => {
		const site = createDemoSite();
		site.seo.visibility = 'hidden';
		expect(generateSeoArtifacts(site).robots).toBe('User-agent: *\nDisallow: /\n');
	});
});
