import fieldNotesImage from '../assets/demo/field-notes.png';
import forestCabinImage from '../assets/demo/forest-cabin.png';
import weekendLakeImage from '../assets/demo/weekend-lake.png';

import type { DemoThemeId } from './library-catalog';
import { isEmbedReference, type EmbedReference } from './embed';

export type DemoSectionKind = 'hero' | 'story' | 'gallery' | 'quote' | 'newsletter' | 'embed';

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
};

export type DemoPage = {
	id: string;
	name: string;
	slug: string;
	sections: DemoSection[];
};

export type DemoSite = {
	name: string;
	tagline: string;
	accent: string;
	themeId?: DemoThemeId;
	pages: DemoPage[];
};

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

export const sectionLabels: Record<DemoSectionKind, string> = {
	hero: 'Hero',
	story: 'Story',
	gallery: 'Photo gallery',
	quote: 'Quote',
	newsletter: 'Newsletter',
	embed: 'Video or social post'
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
		}
	};
	return { id, kind, ...templates[kind] };
}

export function createDemoSite(): DemoSite {
	return {
		name: 'Willow Journal',
		tagline: 'Stories, sound and places worth remembering.',
		accent: '#d88152',
		themeId: 'editorial',
		pages: [
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
						id: 'newsletter-3',
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
		]
	};
}

export function cloneDemoSite(site: DemoSite): DemoSite {
	// Svelte deep-state values are proxies in the browser. A schema-owned JSON
	// round trip creates a plain bounded draft that can safely cross storage.
	return JSON.parse(JSON.stringify(site)) as DemoSite;
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
		candidate.pages.length > 24
	)
		return false;
	if (
		candidate.themeId !== undefined &&
		!['minimal', 'editorial', 'studio', 'docs'].includes(candidate.themeId)
	)
		return false;
	return candidate.pages.every(
		(page) =>
			Boolean(page) &&
			typeof page.id === 'string' &&
			typeof page.name === 'string' &&
			typeof page.slug === 'string' &&
			Array.isArray(page.sections) &&
			page.sections.length <= 48 &&
			page.sections.every(
				(section) =>
					Boolean(section) &&
					typeof section.id === 'string' &&
					['hero', 'story', 'gallery', 'quote', 'newsletter', 'embed'].includes(section.kind) &&
					typeof section.label === 'string' &&
					typeof section.eyebrow === 'string' &&
					typeof section.title === 'string' &&
					typeof section.body === 'string' &&
					(section.image === undefined || typeof section.image === 'string') &&
					(section.imageAlt === undefined || typeof section.imageAlt === 'string') &&
					(section.kind === 'embed' ? isEmbedReference(section.embed) : section.embed === undefined)
			)
	);
}
