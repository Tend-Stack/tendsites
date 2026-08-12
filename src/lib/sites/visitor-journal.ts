import type { DemoPost, DemoSite } from './demo-site';
import { normalizeCanonicalUrl } from './seo';

export type JournalPage = {
	items: DemoPost[];
	page: number;
	pageCount: number;
	total: number;
};

export type PostNavigation = {
	previous: DemoPost | null;
	next: DemoPost | null;
};

export function publishedJournalPosts(site: DemoSite): DemoPost[] {
	return site.collections
		.flatMap((collection) => collection.items)
		.filter((post) => post.status === 'published' && post.publishedAt !== null)
		.sort(
			(left, right) =>
				(right.publishedAt ?? '').localeCompare(left.publishedAt ?? '') ||
				left.slug.localeCompare(right.slug)
		);
}

export function journalTags(posts: DemoPost[]): Array<{ tag: string; count: number }> {
	const counts = new Map<string, { tag: string; count: number }>();
	for (const post of posts) {
		for (const tag of post.tags) {
			const key = tag.trim().toLocaleLowerCase();
			if (!key) continue;
			const current = counts.get(key);
			counts.set(key, { tag: current?.tag ?? tag.trim(), count: (current?.count ?? 0) + 1 });
		}
	}
	return [...counts.values()].sort(
		(left, right) => right.count - left.count || left.tag.localeCompare(right.tag)
	);
}

export function filterJournalPosts(
	posts: DemoPost[],
	query: string,
	tag: string | null
): DemoPost[] {
	const needle = query.trim().toLocaleLowerCase();
	const tagNeedle = tag?.trim().toLocaleLowerCase() ?? null;
	return posts.filter((post) => {
		const matchesTag =
			!tagNeedle || post.tags.some((candidate) => candidate.toLocaleLowerCase() === tagNeedle);
		if (!matchesTag) return false;
		if (!needle) return true;
		return [post.title, post.summary, post.body, post.author, ...post.tags]
			.join('\n')
			.toLocaleLowerCase()
			.includes(needle);
	});
}

export function paginateJournalPosts(
	posts: DemoPost[],
	requestedPage: number,
	requestedPageSize = 6
): JournalPage {
	const pageSize = Math.max(1, Math.min(12, Math.trunc(requestedPageSize) || 6));
	const pageCount = Math.max(1, Math.ceil(posts.length / pageSize));
	const page = Math.max(1, Math.min(pageCount, Math.trunc(requestedPage) || 1));
	return {
		items: posts.slice((page - 1) * pageSize, page * pageSize),
		page,
		pageCount,
		total: posts.length
	};
}

export function readingMinutes(body: string): number {
	const words = body.trim().match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu)?.length ?? 0;
	return Math.max(1, Math.ceil(words / 220));
}

export function relatedJournalPosts(posts: DemoPost[], current: DemoPost, limit = 3): DemoPost[] {
	const boundedLimit = Math.max(0, Math.min(6, Math.trunc(limit)));
	const publishedById = new Map(
		posts
			.filter(
				(post) => post.id !== current.id && post.status === 'published' && post.publishedAt !== null
			)
			.map((post) => [post.id, post])
	);
	const explicit = current.relatedPostIds
		.map((id) => publishedById.get(id))
		.filter((post): post is DemoPost => Boolean(post))
		.slice(0, boundedLimit);
	const selectedIds = new Set(explicit.map((post) => post.id));
	const tags = new Set(current.tags.map((tag) => tag.toLocaleLowerCase()));
	const fallback = posts
		.filter(
			(post) =>
				post.id !== current.id &&
				!selectedIds.has(post.id) &&
				post.status === 'published' &&
				post.publishedAt !== null
		)
		.map((post) => ({
			post,
			overlap: post.tags.filter((tag) => tags.has(tag.toLocaleLowerCase())).length
		}))
		.filter((candidate) => candidate.overlap > 0)
		.sort(
			(left, right) =>
				right.overlap - left.overlap ||
				(right.post.publishedAt ?? '').localeCompare(left.post.publishedAt ?? '')
		)
		.slice(0, boundedLimit - explicit.length)
		.map((candidate) => candidate.post);
	return [...explicit, ...fallback];
}

export function postNavigation(posts: DemoPost[], currentId: string): PostNavigation {
	const index = posts.findIndex((post) => post.id === currentId);
	if (index < 0) return { previous: null, next: null };
	return {
		previous: posts[index + 1] ?? null,
		next: posts[index - 1] ?? null
	};
}

export function postShareLinks(site: DemoSite, post: DemoPost) {
	const base = normalizeCanonicalUrl(site.seo.canonicalUrl);
	const url = base ? `${base}/journal/${post.slug}` : `/journal/${post.slug}`;
	const encodedUrl = encodeURIComponent(url);
	const encodedTitle = encodeURIComponent(post.title);
	return {
		url,
		email: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
		bluesky: `https://bsky.app/intent/compose?text=${encodedTitle}%20${encodedUrl}`,
		linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
	};
}
