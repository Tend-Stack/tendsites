import type { DemoPage, DemoSite } from './demo-site';

export type PageSeoProjection = {
	title: string;
	description: string;
	canonicalUrl: string | null;
	robots: string;
	socialTitle: string;
	socialDescription: string;
	socialImage?: string;
};

export type SeoArtifacts = {
	robots: string;
	sitemap: string;
	feed: string;
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

export function projectPageSeo(site: DemoSite, page: DemoPage): PageSeoProjection {
	const base = normalizeCanonicalUrl(site.seo.canonicalUrl);
	const path = page.slug === '/' ? '' : page.slug;
	return {
		title: site.seo.titlePattern.replace('%s', page.seo.title.trim() || page.name),
		description: page.seo.description.trim() || site.seo.description.trim() || site.tagline,
		canonicalUrl: base ? `${base}${path}` : null,
		robots: `${page.seo.index && site.seo.visibility === 'public' ? 'index' : 'noindex'},${page.seo.follow ? 'follow' : 'nofollow'}`,
		socialTitle: page.seo.socialTitle.trim() || page.seo.title.trim() || page.name,
		socialDescription:
			page.seo.socialDescription.trim() || page.seo.description.trim() || site.seo.description,
		...(page.seo.socialImage ? { socialImage: page.seo.socialImage } : {})
	};
}

function xml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

export function generateSeoArtifacts(site: DemoSite): SeoArtifacts {
	const base = normalizeCanonicalUrl(site.seo.canonicalUrl);
	const publicPages = site.pages
		.filter((page) => page.seo.index && site.seo.visibility === 'public')
		.map((page) => projectPageSeo(site, page))
		.filter((page): page is PageSeoProjection & { canonicalUrl: string } =>
			Boolean(page.canonicalUrl)
		);
	const sitemap = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...publicPages.map((page) => `  <url><loc>${xml(page.canonicalUrl)}</loc></url>`),
		'</urlset>'
	].join('\n');
	const robots =
		site.seo.visibility === 'public' && base
			? `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`
			: 'User-agent: *\nDisallow: /\n';
	const posts = site.collections
		.flatMap((collection) => collection.items)
		.filter((post) => post.status === 'published')
		.sort(
			(left, right) =>
				(right.publishedAt ?? '').localeCompare(left.publishedAt ?? '') ||
				left.id.localeCompare(right.id)
		);
	const feed = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<rss version="2.0"><channel>',
		`  <title>${xml(site.name)}</title>`,
		`  <description>${xml(site.seo.description || site.tagline)}</description>`,
		...(base ? [`  <link>${xml(base)}</link>`] : []),
		...posts.map((post) => {
			const link = base ? `${base}/journal/${post.slug}` : `/journal/${post.slug}`;
			return `  <item><title>${xml(post.title)}</title><link>${xml(link)}</link><guid>${xml(link)}</guid><description>${xml(post.summary)}</description>${post.publishedAt ? `<pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>` : ''}</item>`;
		}),
		'</channel></rss>'
	].join('\n');
	return { robots, sitemap, feed };
}
