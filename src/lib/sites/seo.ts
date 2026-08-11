import type { DemoPage, DemoPost, DemoRedirect, DemoSite } from './demo-site';

export type SeoProjection = {
	title: string;
	description: string;
	canonicalUrl: string | null;
	robots: string;
	socialTitle: string;
	socialDescription: string;
	socialImage?: string;
};

export type RedirectIssue = {
	kind: 'duplicate' | 'loop' | 'missing-target';
	redirectId: string;
	message: string;
};

export type SeoArtifacts = {
	robots: string;
	sitemap: string;
	feed: string;
	atom: string;
	structuredData: string;
};

export function normalizeCanonicalUrl(value: string): string | null {
	try {
		const url = new URL(value.trim());
		if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash)
			return null;
		url.pathname = url.pathname.replace(/\/+$/, '');
		return url.toString().replace(/\/$/, '');
	} catch {
		return null;
	}
}

function project(site: DemoSite, path: string, name: string, seo: DemoPage['seo']): SeoProjection {
	const base = normalizeCanonicalUrl(site.seo.canonicalUrl);
	return {
		title: site.seo.titlePattern.replace('%s', seo.title.trim() || name),
		description: seo.description.trim() || site.seo.description.trim() || site.tagline,
		canonicalUrl: base ? `${base}${path === '/' ? '' : path}` : null,
		robots: `${seo.index && site.seo.visibility === 'public' ? 'index' : 'noindex'},${seo.follow ? 'follow' : 'nofollow'}`,
		socialTitle: seo.socialTitle.trim() || seo.title.trim() || name,
		socialDescription:
			seo.socialDescription.trim() || seo.description.trim() || site.seo.description,
		...(seo.socialImage ? { socialImage: seo.socialImage } : {})
	};
}

export function projectPageSeo(site: DemoSite, page: DemoPage): SeoProjection {
	return project(site, page.slug, page.name, page.seo);
}

export function projectPostSeo(site: DemoSite, post: DemoPost): SeoProjection {
	return project(site, `/journal/${post.slug}`, post.title, post.seo);
}

function xml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

function publishedPosts(site: DemoSite): DemoPost[] {
	return site.collections
		.flatMap((collection) => collection.items)
		.filter((post) => post.status === 'published' && post.publishedAt && post.seo.index)
		.sort(
			(left, right) =>
				(right.publishedAt ?? '').localeCompare(left.publishedAt ?? '') ||
				left.id.localeCompare(right.id)
		);
}

export function analyzeRedirects(site: DemoSite): RedirectIssue[] {
	const destinations = new Set([
		...site.pages.map((page) => page.slug),
		...site.collections.flatMap((collection) =>
			collection.items.map((post) => `/journal/${post.slug}`)
		)
	]);
	const bySource = new Map<string, DemoRedirect[]>();
	for (const redirect of site.redirects)
		bySource.set(redirect.from, [...(bySource.get(redirect.from) ?? []), redirect]);
	const issues: RedirectIssue[] = [];
	for (const redirect of site.redirects) {
		if ((bySource.get(redirect.from)?.length ?? 0) > 1)
			issues.push({
				kind: 'duplicate',
				redirectId: redirect.id,
				message: `${redirect.from} has more than one destination.`
			});
		if (!destinations.has(redirect.to) && !bySource.has(redirect.to))
			issues.push({
				kind: 'missing-target',
				redirectId: redirect.id,
				message: `${redirect.to} does not match a page or post.`
			});
		const visited = new Set([redirect.from]);
		let cursor: DemoRedirect | undefined = redirect;
		while (cursor) {
			if (visited.has(cursor.to)) {
				issues.push({
					kind: 'loop',
					redirectId: redirect.id,
					message: `${redirect.from} is part of a redirect loop.`
				});
				break;
			}
			visited.add(cursor.to);
			cursor = bySource.get(cursor.to)?.[0];
		}
	}
	return issues;
}

export function generateSeoArtifacts(site: DemoSite): SeoArtifacts {
	const base = normalizeCanonicalUrl(site.seo.canonicalUrl);
	const publicPages = site.pages
		.filter((page) => page.seo.index && site.seo.visibility === 'public')
		.map((page) => projectPageSeo(site, page))
		.filter((page): page is SeoProjection & { canonicalUrl: string } => Boolean(page.canonicalUrl));
	const posts = publishedPosts(site);
	const sitemap = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...publicPages.map((page) => `  <url><loc>${xml(page.canonicalUrl)}</loc></url>`),
		...posts.flatMap((post) => {
			const url = projectPostSeo(site, post).canonicalUrl;
			return url ? [`  <url><loc>${xml(url)}</loc></url>`] : [];
		}),
		'</urlset>'
	].join('\n');
	const robots =
		site.seo.visibility === 'public' && base
			? `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`
			: 'User-agent: *\nDisallow: /\n';
	const feedItems = posts.map((post) => {
		const link = projectPostSeo(site, post).canonicalUrl ?? `/journal/${post.slug}`;
		return `  <item><title>${xml(post.title)}</title><link>${xml(link)}</link><guid>${xml(link)}</guid><description>${xml(post.summary)}</description>${post.publishedAt ? `<pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>` : ''}</item>`;
	});
	const feed = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<rss version="2.0"><channel>',
		`  <title>${xml(site.name)}</title>`,
		`  <description>${xml(site.seo.description || site.tagline)}</description>`,
		...(base ? [`  <link>${xml(base)}</link>`] : []),
		...feedItems,
		'</channel></rss>'
	].join('\n');
	const updated = posts[0]?.publishedAt ?? new Date(0).toISOString();
	const atomEntries = posts.map((post) => {
		const link = projectPostSeo(site, post).canonicalUrl ?? `/journal/${post.slug}`;
		return `  <entry><title>${xml(post.title)}</title><id>${xml(link)}</id><link href="${xml(link)}"/><updated>${xml(post.publishedAt ?? updated)}</updated><summary>${xml(post.summary)}</summary></entry>`;
	});
	const atom = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<feed xmlns="http://www.w3.org/2005/Atom">',
		`  <title>${xml(site.name)}</title>`,
		`  <id>${xml(base ?? site.name)}</id>`,
		`  <updated>${xml(updated)}</updated>`,
		...(base ? [`  <link href="${xml(base)}/atom.xml" rel="self"/>`] : []),
		...atomEntries,
		'</feed>'
	].join('\n');
	const graph: Record<string, unknown>[] = [
		{
			'@type': 'WebSite',
			name: site.name,
			description: site.seo.description || site.tagline,
			inLanguage: site.seo.locale,
			...(base ? { url: base } : {})
		},
		{
			'@type': site.seo.identityType === 'person' ? 'Person' : 'Organization',
			name: site.seo.identityName
		}
	];
	for (const post of posts)
		graph.push({
			'@type': 'Article',
			headline: post.seo.title || post.title,
			description: post.seo.description || post.summary,
			datePublished: post.publishedAt,
			author: { '@type': 'Person', name: post.author },
			...(projectPostSeo(site, post).canonicalUrl
				? { url: projectPostSeo(site, post).canonicalUrl }
				: {}),
			...(post.coverImage ? { image: post.coverImage } : {})
		});
	const structuredData = JSON.stringify(
		{ '@context': 'https://schema.org', '@graph': graph },
		null,
		2
	);
	return { robots, sitemap, feed, atom, structuredData };
}
