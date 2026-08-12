import fieldNotesImage from '../assets/demo/field-notes.png';
import forestCabinImage from '../assets/demo/forest-cabin.png';
import weekendLakeImage from '../assets/demo/weekend-lake.png';

import type { DemoThemeId } from './library-catalog';
import type { ImportedSiteProjection } from './host-source';
import { isEmbedReference, type EmbedReference } from './embed';
import {
	createDefaultSiteStructure,
	isDemoSiteStructure,
	upgradeDemoSiteStructure,
	type DemoSiteStructure
} from './site-structure';

const bundledImageTokens = new Map([
	[fieldNotesImage, 'tend-sites-asset://demo/field-notes'],
	[forestCabinImage, 'tend-sites-asset://demo/forest-cabin'],
	[weekendLakeImage, 'tend-sites-asset://demo/weekend-lake']
]);
const bundledImages = new Map([...bundledImageTokens].map(([image, token]) => [token, image]));

function replaceBundledImages(site: DemoSite, replacements: Map<string, string>): DemoSite {
	return JSON.parse(
		JSON.stringify(site, (_key, value) =>
			typeof value === 'string' ? (replacements.get(value) ?? value) : value
		)
	) as DemoSite;
}

export function encodeBundledDemoImages(site: DemoSite): DemoSite {
	return replaceBundledImages(site, bundledImageTokens);
}

export function hydrateBundledDemoImages(site: DemoSite): DemoSite {
	return replaceBundledImages(site, bundledImages);
}

export type DemoSectionKind =
	'hero' | 'story' | 'post-feed' | 'gallery' | 'quote' | 'newsletter' | 'embed' | 'form';

export type DemoPostFeedOrder = 'latest' | 'featured';

export type DemoSection = {
	id: string;
	kind: DemoSectionKind;
	label: string;
	eyebrow: string;
	title: string;
	body: string;
	image?: string;
	imageAlt?: string;
	embed?: EmbedReference;
	collectionId?: string;
	postLimit?: number;
	postOrder?: DemoPostFeedOrder;
	formConsentLabel?: string;
	formRecipientLabel?: string;
};

export type DemoPageSeo = {
	title: string;
	description: string;
	index: boolean;
	follow: boolean;
	socialTitle: string;
	socialDescription: string;
	socialImage?: string;
};

export type DemoPage = {
	id: string;
	name: string;
	slug: string;
	seo: DemoPageSeo;
	sections: DemoSection[];
};

export type DemoSiteSeo = {
	titlePattern: string;
	description: string;
	canonicalUrl: string;
	language: string;
	locale: string;
	favicon?: string;
	visibility: 'public' | 'hidden';
	identityName: string;
	identityType: 'person' | 'organization';
};

export type DemoEntrySeo = DemoPageSeo;

export type DemoPostStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export type DemoMediaReference =
	| {
			kind: 'host_files';
			itemId: string;
			libraryId: string;
			name: string;
			mimeType: string | null;
			size: number | null;
			modifiedAt: number | null;
	  }
	| {
			kind: 'device_upload';
			name: string;
			mimeType: 'image/webp';
			size: number;
	  };

export type DemoImagePresentation = {
	aspect: 'wide' | 'square' | 'portrait';
	fit: 'cover' | 'contain';
	focalX: number;
	focalY: number;
	zoom: number;
};

export type DemoPost = {
	id: string;
	title: string;
	slug: string;
	summary: string;
	body: string;
	coverImage?: string;
	coverImageAlt?: string;
	coverImageSource?: DemoMediaReference;
	coverImagePresentation?: DemoImagePresentation;
	author: string;
	tags: string[];
	relatedPostIds: string[];
	status: DemoPostStatus;
	featured: boolean;
	publishedAt: string | null;
	scheduledAt: string | null;
	seo: DemoEntrySeo;
};

export type DemoRedirect = {
	id: string;
	from: string;
	to: string;
	status: 301 | 302;
};

export type DemoCollection = {
	id: string;
	name: string;
	slug: string;
	kind: 'posts';
	items: DemoPost[];
};

export type DemoSite = {
	name: string;
	tagline: string;
	accent: string;
	themeId?: DemoThemeId;
	seo: DemoSiteSeo;
	pages: DemoPage[];
	collections: DemoCollection[];
	redirects: DemoRedirect[];
	structure: DemoSiteStructure;
};

export function createDefaultSiteSeo(name: string, tagline: string): DemoSiteSeo {
	return {
		titlePattern: `%s · ${name}`,
		description: tagline,
		canonicalUrl: 'https://willow.example',
		language: 'en',
		locale: 'en-US',
		visibility: 'public',
		identityName: name,
		identityType: 'organization'
	};
}

export function createDefaultEntrySeo(
	title: string,
	summary: string,
	image?: string
): DemoEntrySeo {
	return {
		title,
		description: summary,
		index: true,
		follow: true,
		socialTitle: title,
		socialDescription: summary,
		...(image ? { socialImage: image } : {})
	};
}

export function createDefaultPageSeo(
	name: string,
	sections: DemoSection[],
	defaultDescription = ''
): DemoPageSeo {
	const firstSection = sections[0];
	return {
		title: name,
		description: firstSection?.body || defaultDescription,
		index: true,
		follow: true,
		socialTitle: firstSection?.title || name,
		socialDescription: firstSection?.body || defaultDescription,
		...(firstSection?.image ? { socialImage: firstSection.image } : {})
	};
}

export function normalizePostSlug(value: string): string {
	return (
		value
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '') || 'untitled-post'
	);
}

export function uniquePostSlug(value: string, posts: DemoPost[], excludeId?: string): string {
	const requested = normalizePostSlug(value);
	const occupied = new Set(posts.filter((post) => post.id !== excludeId).map((post) => post.slug));
	if (!occupied.has(requested)) return requested;
	let suffix = 2;
	while (occupied.has(`${requested}-${suffix}`)) suffix += 1;
	return `${requested}-${suffix}`;
}

export function normalizePageSlug(value: string): string {
	const slug = value
		.trim()
		.toLowerCase()
		.replace(/^https?:\/\/[^/]+/i, '')
		.replace(/[^a-z0-9/]+/g, '-')
		.replace(/\/{2,}/g, '/')
		.replace(/-+/g, '-')
		.replace(/^[-/]+|[-/]+$/g, '');
	return slug ? `/${slug}` : '/';
}

export function uniquePageSlug(value: string, pages: DemoPage[], excludeId?: string): string {
	const requested = normalizePageSlug(value);
	const occupied = new Set(pages.filter((page) => page.id !== excludeId).map((page) => page.slug));
	if (!occupied.has(requested)) return requested;
	const base = requested === '/' ? '/page' : requested;
	let suffix = 2;
	while (occupied.has(`${base}-${suffix}`)) suffix += 1;
	return `${base}-${suffix}`;
}

export function duplicateDemoPage(page: DemoPage, pages: DemoPage[], sequence: number): DemoPage {
	const id = `${page.id.replace(/-copy-\d+$/, '')}-copy-${sequence}`;
	return {
		id,
		name: `${page.name} copy`.slice(0, 50),
		slug: uniquePageSlug(`${page.slug}-copy`, pages),
		seo: { ...page.seo, title: `${page.seo.title} copy`.slice(0, 70), index: false },
		sections: page.sections.map((section, index) => ({
			...section,
			id: `${section.kind}-${sequence}-${index + 1}`
		}))
	};
}

export const demoImages = {
	lake: weekendLakeImage,
	notes: fieldNotesImage,
	cabin: forestCabinImage
} as const;

export function createDemoCollections(): DemoCollection[] {
	const collections: DemoCollection[] = [
		{
			id: 'journal-posts',
			name: 'Journal posts',
			slug: '/journal',
			kind: 'posts',
			items: [
				{
					id: 'field-notes-long-way-home',
					title: 'Field Notes from the long way home',
					slug: 'field-notes-long-way-home',
					summary:
						'A weekend route, a camera, and a few places that deserved more than a drive-by.',
					body: 'We left before sunrise with no schedule beyond the old lake road.\n\n## A slower route\n\nThe best stop was not marked on the map: a quiet shoreline, warm coffee, and enough time to listen.',
					coverImage: fieldNotesImage,
					coverImageAlt: 'An open field notebook beside a camera and wildflowers',
					author: 'Willow Hart',
					tags: ['Field notes', 'Slow travel'],
					relatedPostIds: ['morning-at-the-lake'],
					status: 'published',
					featured: true,
					publishedAt: '2026-08-02T14:00:00.000Z',
					scheduledAt: null,
					seo: createDefaultEntrySeo(
						'Field Notes from the long way home',
						'A weekend route, a camera, and a few places that deserved more than a drive-by.',
						fieldNotesImage
					)
				},
				{
					id: 'morning-at-the-lake',
					title: 'Morning at the lake',
					slug: 'morning-at-the-lake',
					summary: 'Mist, still water, and the first trail before breakfast.',
					body: 'The trail was empty except for a pair of loons crossing the cove.\n\nI kept the camera packed and listened instead.',
					coverImage: weekendLakeImage,
					coverImageAlt: 'A quiet lake reflecting distant green hills',
					author: 'Willow Hart',
					tags: ['Lakes', 'Photography', 'Slow travel'],
					relatedPostIds: ['field-notes-long-way-home'],
					status: 'published',
					featured: false,
					publishedAt: '2026-07-26T13:30:00.000Z',
					scheduledAt: null,
					seo: createDefaultEntrySeo(
						'Morning at the lake',
						'Mist, still water, and the first trail before breakfast.',
						weekendLakeImage
					)
				},
				{
					id: 'cabin-reading-list',
					title: 'A cabin reading list',
					slug: 'cabin-reading-list',
					summary: 'Books and field guides for a rainy weekend in the woods.',
					body: 'A working list for the next quiet weekend. Add notes before publishing.',
					coverImage: forestCabinImage,
					coverImageAlt: 'A warm wooden cabin surrounded by tall forest trees',
					author: 'Willow Hart',
					tags: ['Reading', 'Cabins'],
					relatedPostIds: [],
					status: 'draft',
					featured: false,
					publishedAt: null,
					scheduledAt: null,
					seo: createDefaultEntrySeo(
						'A cabin reading list',
						'Books and field guides for a rainy weekend in the woods.',
						forestCabinImage
					)
				}
			]
		}
	];
	return collections;
}

export function createDemoPost(sequence: number, posts: DemoPost[]): DemoPost {
	const title = 'Untitled post';
	return {
		id: `post-${sequence}`,
		title,
		slug: uniquePostSlug(title, posts),
		summary: 'Add a short description that helps readers decide what this story is about.',
		body: 'Start writing here.',
		author: 'Willow Hart',
		tags: [],
		relatedPostIds: [],
		status: 'draft',
		featured: false,
		publishedAt: null,
		scheduledAt: null,
		seo: createDefaultEntrySeo(
			title,
			'Add a short description that helps readers decide what this story is about.'
		)
	};
}

export function postsForSection(site: DemoSite, section: DemoSection): DemoPost[] {
	if (section.kind !== 'post-feed') return [];
	const collection = site.collections.find((item) => item.id === section.collectionId);
	if (!collection) return [];
	const limit = Math.max(1, Math.min(6, Math.trunc(section.postLimit ?? 3)));
	const order = section.postOrder ?? 'latest';
	return collection.items
		.filter((post) => post.status === 'published' && post.publishedAt !== null)
		.sort((left, right) => {
			if (order === 'featured' && left.featured !== right.featured) return left.featured ? -1 : 1;
			const byDate = Date.parse(right.publishedAt ?? '') - Date.parse(left.publishedAt ?? '');
			return byDate || left.slug.localeCompare(right.slug);
		})
		.slice(0, limit);
}

export const sectionLabels: Record<DemoSectionKind, string> = {
	hero: 'Hero',
	story: 'Story',
	'post-feed': 'Latest posts',
	gallery: 'Photo gallery',
	quote: 'Quote',
	newsletter: 'Newsletter',
	embed: 'Video or social post',
	form: 'Contact form'
};

export function createSection(kind: DemoSectionKind, sequence: number): DemoSection {
	const id = `${kind}-${sequence}`;
	const templates: Record<DemoSectionKind, Omit<DemoSection, 'id' | 'kind'>> = {
		hero: {
			label: 'Opening hero',
			eyebrow: 'WEEKEND JOURNAL',
			title: 'A new story starts here.',
			body: 'Use this space to introduce the page in one clear, memorable thought.',
			image: weekendLakeImage,
			imageAlt: 'A quiet lake reflecting distant green hills'
		},
		story: {
			label: 'Feature story',
			eyebrow: 'FIELD NOTE',
			title: 'Write about a place worth remembering.',
			body: 'Add the details, observations and small moments that make the story yours.',
			image: fieldNotesImage,
			imageAlt: 'An open field notebook beside a camera and wildflowers'
		},
		'post-feed': {
			label: 'Latest journal posts',
			eyebrow: 'FROM THE JOURNAL',
			title: 'Recent stories',
			body: 'Fresh notes, selected automatically from your published posts.',
			collectionId: 'journal-posts',
			postLimit: 3,
			postOrder: 'latest'
		},
		gallery: {
			label: 'Photo gallery',
			eyebrow: 'FROM THE ROAD',
			title: 'A few frames from the weekend.',
			body: 'A visual pause for landscapes, details and discoveries.',
			image: forestCabinImage,
			imageAlt: 'A warm wooden cabin surrounded by tall forest trees'
		},
		quote: {
			label: 'Pull quote',
			eyebrow: 'REMEMBER THIS',
			title: 'The best routes leave enough room to get a little lost.',
			body: '— Willow Journal'
		},
		newsletter: {
			label: 'Newsletter',
			eyebrow: 'STAY CURIOUS',
			title: 'One thoughtful note, every other Sunday.',
			body: 'New field notes, quiet places and useful routes. No noise.'
		},
		embed: {
			label: 'Embedded content',
			eyebrow: 'FROM THE WEB',
			title: 'A video or social post',
			body: 'External content stays private until a visitor chooses to load it.'
		},
		form: {
			label: 'Contact form',
			eyebrow: 'GET IN TOUCH',
			title: 'Send a thoughtful note.',
			body: 'Review your message before anything is sent.',
			formConsentLabel: 'This site may use my details to reply to this message.',
			formRecipientLabel: 'Delivery destination not connected'
		}
	};
	return { id, kind, ...templates[kind] };
}

export function createDemoSite(): DemoSite {
	const pagesWithoutSeo: Array<Omit<DemoPage, 'seo'>> = [
		{
			id: 'home',
			name: 'Home',
			slug: '/',
			sections: [
				{
					id: 'hero-1',
					kind: 'hero',
					label: 'Lake hero',
					eyebrow: 'PERSONAL JOURNAL',
					title: 'Stories, sound & places worth remembering.',
					body: 'A personal corner for essays, field recordings and the occasional experiment.',
					image: weekendLakeImage,
					imageAlt: 'A quiet lake reflecting distant green hills'
				},
				{
					id: 'story-2',
					kind: 'story',
					label: 'Field Notes',
					eyebrow: 'LATEST STORY',
					title: 'Field Notes from the long way home',
					body: 'A weekend route, a camera, and a few places that deserved more than a drive-by.',
					image: fieldNotesImage,
					imageAlt: 'An open field notebook beside a camera and wildflowers'
				},
				{
					id: 'post-feed-3',
					kind: 'post-feed',
					label: 'Latest journal posts',
					eyebrow: 'FROM THE JOURNAL',
					title: 'Recent stories',
					body: 'A few new field notes from the long way home.',
					collectionId: 'journal-posts',
					postLimit: 3,
					postOrder: 'latest'
				},
				{
					id: 'newsletter-4',
					kind: 'newsletter',
					label: 'Sunday letter',
					eyebrow: 'THE SUNDAY NOTE',
					title: 'A calmer way to keep in touch.',
					body: 'A short letter about good places and the people who care for them.'
				}
			]
		},
		{
			id: 'about',
			name: 'About',
			slug: '/about',
			sections: [
				{
					id: 'hero-4',
					kind: 'hero',
					label: 'About Willow',
					eyebrow: 'HELLO, I’M WILLOW',
					title: 'I collect thoughtful places and the stories behind them.',
					body: 'This journal is where photography, slow travel and useful notes meet.',
					image: forestCabinImage,
					imageAlt: 'A warm wooden cabin surrounded by tall forest trees'
				},
				{
					id: 'quote-5',
					kind: 'quote',
					label: 'Journal motto',
					eyebrow: 'WHY THIS EXISTS',
					title: 'Pay attention. Leave a place better than you found it.',
					body: 'A simple rule for travel and for life.'
				},
				{
					id: 'form-6',
					kind: 'form',
					label: 'Contact Willow',
					eyebrow: 'GET IN TOUCH',
					title: 'Send a thoughtful note.',
					body: 'Review your message before anything is sent.',
					formConsentLabel: 'This site may use my details to reply to this message.',
					formRecipientLabel: 'Delivery destination not connected'
				}
			]
		},
		{
			id: 'journal',
			name: 'Journal',
			slug: '/journal',
			sections: [
				{
					id: 'gallery-6',
					kind: 'gallery',
					label: 'Recent journeys',
					eyebrow: 'RECENT JOURNEYS',
					title: 'Three weekends, three different kinds of quiet.',
					body: 'Lake mornings, cabin evenings and the notes collected between them.',
					image: fieldNotesImage,
					imageAlt: 'An open field notebook beside a camera and wildflowers'
				}
			]
		}
	];
	const pages = pagesWithoutSeo.map((page) => ({
		...page,
		seo: createDefaultPageSeo(page.name, page.sections)
	}));
	const site: DemoSite = {
		name: 'Willow Journal',
		tagline: 'Stories, sound and places worth remembering.',
		accent: '#d88152',
		themeId: 'editorial',
		seo: createDefaultSiteSeo('Willow Journal', 'Stories, sound and places worth remembering.'),
		pages,
		collections: createDemoCollections(),
		redirects: [],
		structure: createDefaultSiteStructure(pages)
	};
	return site;
}

export function createImportedSite(name: string, projection: ImportedSiteProjection): DemoSite {
	const projectedPages = projection.pages.length
		? projection.pages
		: [
				{
					path: '/',
					title: 'Repository content',
					summary: 'No static page copy could be mapped safely from this custom renderer.',
					sections: [
						{
							title: 'Custom site connected',
							body: 'The repository remains connected and its custom components and styles stay in source.'
						}
					]
				}
			];
	const pages: DemoPage[] = projectedPages.map((page, pageIndex) => {
		const id = page.path === '/' ? 'home' : `imported-page-${pageIndex + 1}`;
		const sections = (
			page.sections.length ? page.sections : [{ title: page.title, body: page.summary }]
		).map((section, sectionIndex): DemoSection => ({
			id: `imported-${pageIndex + 1}-${sectionIndex + 1}`,
			kind: sectionIndex === 0 ? 'hero' : 'story',
			label: section.title,
			eyebrow: sectionIndex === 0 ? 'IMPORTED PAGE' : 'IMPORTED SECTION',
			title: section.title,
			body: section.body
		}));
		return {
			id,
			name: page.path === '/' ? 'Home' : page.title,
			slug: normalizePageSlug(page.path),
			seo: createDefaultPageSeo(page.title, sections, page.summary),
			sections
		};
	});
	const collections: DemoCollection[] = projection.posts.length
		? [
				{
					id: 'imported-posts',
					name: 'Imported posts',
					slug: 'posts',
					kind: 'posts',
					items: projection.posts.map((post, index) => ({
						id: `imported-post-${index + 1}`,
						title: post.title,
						slug: normalizePostSlug(purePostName(post.path, post.title)),
						summary: post.summary,
						body: post.body,
						author: name,
						tags: [],
						relatedPostIds: [],
						status: 'published',
						featured: index === 0,
						publishedAt: '2026-01-01T00:00:00.000Z',
						scheduledAt: null,
						seo: createDefaultEntrySeo(post.title, post.summary)
					}))
				}
			]
		: [];
	const tagline = pages[0]?.seo.description || `Imported from ${name}`;
	return {
		name,
		tagline,
		accent: '#56e6ad',
		themeId: 'minimal',
		seo: {
			...createDefaultSiteSeo(name, tagline),
			canonicalUrl: projection.canonicalUrl ?? ''
		},
		pages,
		collections,
		redirects: [],
		structure: createDefaultSiteStructure(pages)
	};
}

function purePostName(path: string, fallback: string): string {
	return (
		path
			.split('/')
			.at(-1)
			?.replace(/\.(?:md|mdx|mdsvex)$/i, '') || fallback
	);
}

export function cloneDemoSite(site: DemoSite): DemoSite {
	// Svelte deep-state values are proxies in the browser. A schema-owned JSON
	// round trip creates a plain bounded draft that can safely cross storage.
	return JSON.parse(JSON.stringify(site)) as DemoSite;
}

export function upgradeDemoSite(value: unknown): DemoSite | null {
	if (isDemoSite(value)) return cloneDemoSite(value);
	if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
	const legacy = value as Record<string, unknown>;
	if (!Array.isArray(legacy.pages)) return null;
	const name = typeof legacy.name === 'string' ? legacy.name : '';
	const tagline = typeof legacy.tagline === 'string' ? legacy.tagline : '';
	const upgradedPages = legacy.pages.map((value) => {
		if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
		const page = value as Record<string, unknown>;
		return {
			...page,
			seo:
				page.seo ??
				createDefaultPageSeo(
					typeof page.name === 'string' ? page.name : '',
					Array.isArray(page.sections) ? (page.sections as DemoSection[]) : [],
					tagline
				)
		};
	});
	const upgraded = {
		...legacy,
		seo: {
			...createDefaultSiteSeo(name, tagline),
			...(legacy.seo && typeof legacy.seo === 'object' ? legacy.seo : {})
		},
		pages: upgradedPages,
		collections: (legacy.collections ?? createDemoCollections()) as DemoCollection[],
		redirects: legacy.redirects ?? [],
		structure: upgradeDemoSiteStructure(legacy.structure, upgradedPages as DemoPage[])
	};
	for (const collection of upgraded.collections) {
		if (!collection || !Array.isArray(collection.items)) continue;
		for (const post of collection.items) {
			if (post && typeof post === 'object' && !post.seo) {
				post.seo = createDefaultEntrySeo(post.title ?? '', post.summary ?? '', post.coverImage);
			}
			if (post && typeof post === 'object' && post.scheduledAt === undefined) {
				post.scheduledAt = null;
			}
			if (post && typeof post === 'object' && post.relatedPostIds === undefined) {
				post.relatedPostIds = [];
			}
			if (
				post &&
				typeof post === 'object' &&
				post.coverImagePresentation &&
				typeof post.coverImagePresentation === 'object' &&
				post.coverImagePresentation.zoom === undefined
			) {
				post.coverImagePresentation.zoom = 1;
			}
		}
	}
	return isDemoSite(upgraded) ? cloneDemoSite(upgraded) : null;
}

function isBoundedString(value: unknown, maximum: number): value is string {
	return typeof value === 'string' && value.length <= maximum;
}

function isDemoSiteSeo(value: unknown): value is DemoSiteSeo {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const seo = value as Partial<DemoSiteSeo>;
	return (
		isBoundedString(seo.titlePattern, 120) &&
		seo.titlePattern.includes('%s') &&
		isBoundedString(seo.description, 320) &&
		isBoundedString(seo.canonicalUrl, 300) &&
		isBoundedString(seo.language, 20) &&
		isBoundedString(seo.locale, 35) &&
		(seo.favicon === undefined || isBoundedString(seo.favicon, 2_000)) &&
		['public', 'hidden'].includes(seo.visibility ?? '') &&
		isBoundedString(seo.identityName, 120) &&
		['person', 'organization'].includes(seo.identityType ?? '')
	);
}

function isDemoPageSeo(value: unknown): value is DemoPageSeo {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const seo = value as Partial<DemoPageSeo>;
	return (
		isBoundedString(seo.title, 120) &&
		isBoundedString(seo.description, 320) &&
		typeof seo.index === 'boolean' &&
		typeof seo.follow === 'boolean' &&
		isBoundedString(seo.socialTitle, 120) &&
		isBoundedString(seo.socialDescription, 320) &&
		(seo.socialImage === undefined || isBoundedString(seo.socialImage, 2_000))
	);
}

function isDemoMediaReference(value: unknown): value is DemoMediaReference {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const media = value as Partial<DemoMediaReference>;
	if (media.kind === 'device_upload') {
		return (
			isBoundedString(media.name, 240) &&
			media.name.length > 0 &&
			media.mimeType === 'image/webp' &&
			Number.isInteger(media.size) &&
			(media.size ?? -1) > 0 &&
			(media.size ?? 0) <= 700 * 1024
		);
	}
	return (
		media.kind === 'host_files' &&
		isBoundedString(media.itemId, 200) &&
		media.itemId.length > 0 &&
		isBoundedString(media.libraryId, 200) &&
		media.libraryId.length > 0 &&
		isBoundedString(media.name, 240) &&
		media.name.length > 0 &&
		(media.mimeType === null || isBoundedString(media.mimeType, 120)) &&
		(media.size === null || (Number.isInteger(media.size) && (media.size ?? -1) >= 0)) &&
		(media.modifiedAt === null || Number.isFinite(media.modifiedAt))
	);
}

function isDemoImagePresentation(value: unknown): value is DemoImagePresentation {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const presentation = value as Partial<DemoImagePresentation>;
	return (
		['wide', 'square', 'portrait'].includes(presentation.aspect ?? '') &&
		['cover', 'contain'].includes(presentation.fit ?? '') &&
		Number.isFinite(presentation.focalX) &&
		(presentation.focalX ?? -1) >= 0 &&
		(presentation.focalX ?? 101) <= 100 &&
		Number.isFinite(presentation.focalY) &&
		(presentation.focalY ?? -1) >= 0 &&
		(presentation.focalY ?? 101) <= 100 &&
		Number.isFinite(presentation.zoom) &&
		(presentation.zoom ?? 0) >= 1 &&
		(presentation.zoom ?? 4) <= 3
	);
}

export function isDemoSite(value: unknown): value is DemoSite {
	if (!value || typeof value !== 'object') return false;
	const candidate = value as Partial<DemoSite>;
	if (
		typeof candidate.name !== 'string' ||
		typeof candidate.tagline !== 'string' ||
		typeof candidate.accent !== 'string' ||
		!Array.isArray(candidate.pages) ||
		candidate.pages.length === 0 ||
		candidate.pages.length > 24 ||
		!Array.isArray(candidate.collections) ||
		candidate.collections.length > 12 ||
		!Array.isArray(candidate.redirects) ||
		candidate.redirects.length > 50 ||
		!isDemoSiteSeo(candidate.seo) ||
		!isDemoSiteStructure(candidate.structure, candidate.pages)
	)
		return false;
	if (
		candidate.themeId !== undefined &&
		!['minimal', 'editorial', 'studio', 'docs'].includes(candidate.themeId)
	)
		return false;
	const pagesValid = candidate.pages.every(
		(page) =>
			Boolean(page) &&
			typeof page.id === 'string' &&
			typeof page.name === 'string' &&
			typeof page.slug === 'string' &&
			isDemoPageSeo(page.seo) &&
			Array.isArray(page.sections) &&
			page.sections.length <= 48 &&
			page.sections.every(
				(section) =>
					Boolean(section) &&
					typeof section.id === 'string' &&
					[
						'hero',
						'story',
						'post-feed',
						'gallery',
						'quote',
						'newsletter',
						'embed',
						'form'
					].includes(section.kind) &&
					typeof section.label === 'string' &&
					typeof section.eyebrow === 'string' &&
					typeof section.title === 'string' &&
					typeof section.body === 'string' &&
					(section.image === undefined || typeof section.image === 'string') &&
					(section.imageAlt === undefined || typeof section.imageAlt === 'string') &&
					(section.kind === 'embed'
						? isEmbedReference(section.embed)
						: section.embed === undefined) &&
					(section.kind === 'post-feed'
						? typeof section.collectionId === 'string' &&
							Number.isInteger(section.postLimit) &&
							(section.postLimit ?? 0) >= 1 &&
							(section.postLimit ?? 0) <= 6 &&
							['latest', 'featured'].includes(section.postOrder ?? '')
						: section.collectionId === undefined &&
							section.postLimit === undefined &&
							section.postOrder === undefined) &&
					(section.kind === 'form'
						? isBoundedString(section.formConsentLabel, 240) &&
							isBoundedString(section.formRecipientLabel, 120)
						: section.formConsentLabel === undefined && section.formRecipientLabel === undefined)
			)
	);
	if (!pagesValid) return false;

	const collectionIds = new Set<string>();
	const collectionsValid = candidate.collections.every((collection) => {
		if (
			!collection ||
			typeof collection.id !== 'string' ||
			collectionIds.has(collection.id) ||
			typeof collection.name !== 'string' ||
			typeof collection.slug !== 'string' ||
			collection.kind !== 'posts' ||
			!Array.isArray(collection.items) ||
			collection.items.length > 250
		)
			return false;
		collectionIds.add(collection.id);
		const postIds = new Set<string>();
		const postSlugs = new Set<string>();
		return collection.items.every((post) => {
			if (
				!post ||
				typeof post.id !== 'string' ||
				postIds.has(post.id) ||
				typeof post.title !== 'string' ||
				typeof post.slug !== 'string' ||
				post.slug !== normalizePostSlug(post.slug) ||
				postSlugs.has(post.slug) ||
				typeof post.summary !== 'string' ||
				typeof post.body !== 'string' ||
				typeof post.author !== 'string' ||
				!Array.isArray(post.tags) ||
				post.tags.length > 20 ||
				!post.tags.every((tag) => typeof tag === 'string' && tag.length <= 40) ||
				!Array.isArray(post.relatedPostIds) ||
				post.relatedPostIds.length > 4 ||
				new Set(post.relatedPostIds).size !== post.relatedPostIds.length ||
				!post.relatedPostIds.every((id) => isBoundedString(id, 120) && id !== post.id) ||
				!['draft', 'scheduled', 'published', 'archived'].includes(post.status) ||
				typeof post.featured !== 'boolean' ||
				(post.publishedAt !== null &&
					(typeof post.publishedAt !== 'string' ||
						!Number.isFinite(Date.parse(post.publishedAt)))) ||
				(post.scheduledAt !== null &&
					(typeof post.scheduledAt !== 'string' ||
						!Number.isFinite(Date.parse(post.scheduledAt)))) ||
				(post.status === 'scheduled' && post.scheduledAt === null) ||
				(post.status !== 'scheduled' && post.scheduledAt !== null) ||
				(post.coverImage !== undefined && typeof post.coverImage !== 'string') ||
				(post.coverImageAlt !== undefined && typeof post.coverImageAlt !== 'string') ||
				(post.coverImageSource !== undefined && !isDemoMediaReference(post.coverImageSource)) ||
				(post.coverImagePresentation !== undefined &&
					!isDemoImagePresentation(post.coverImagePresentation)) ||
				!isDemoPageSeo(post.seo)
			)
				return false;
			postIds.add(post.id);
			postSlugs.add(post.slug);
			return true;
		});
	});
	if (!collectionsValid) return false;
	if (
		!candidate.collections.every((collection) => {
			const postIds = new Set(collection.items.map((post) => post.id));
			return collection.items.every((post) =>
				post.relatedPostIds.every((relatedId) => postIds.has(relatedId))
			);
		})
	)
		return false;
	const redirectIds = new Set<string>();
	if (
		!candidate.redirects.every((redirect) => {
			if (!redirect || !isBoundedString(redirect.id, 80) || redirectIds.has(redirect.id))
				return false;
			redirectIds.add(redirect.id);
			return (
				normalizePageSlug(redirect.from) === redirect.from &&
				normalizePageSlug(redirect.to) === redirect.to &&
				redirect.from !== redirect.to &&
				[301, 302].includes(redirect.status)
			);
		})
	)
		return false;
	return candidate.pages.every((page) =>
		page.sections.every(
			(section) => section.kind !== 'post-feed' || collectionIds.has(section.collectionId ?? '')
		)
	);
}
