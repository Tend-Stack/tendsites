import { createSection, type DemoSection, type DemoSectionKind } from './demo-site';

export type DemoThemeId = 'minimal' | 'editorial' | 'studio' | 'docs';

export type DemoTheme = {
	id: DemoThemeId;
	name: string;
	description: string;
	accent: string;
	paper: string;
	ink: string;
	label: string;
};

export type DemoLibraryComponent = {
	id: string;
	name: string;
	category: string;
	description: string;
	kind: DemoSectionKind;
	eyebrow: string;
	title: string;
	body: string;
};

export const demoThemes: readonly DemoTheme[] = [
	{
		id: 'minimal',
		name: 'TEND Minimal',
		description: 'Quiet spacing, clean type and a crisp green accent.',
		accent: '#56e6ad',
		paper: '#f6f7f2',
		ink: '#163128',
		label: 'Calm and direct'
	},
	{
		id: 'editorial',
		name: 'TEND Editorial',
		description: 'Warm paper and expressive headlines for stories and publications.',
		accent: '#d88152',
		paper: '#f5efe4',
		ink: '#2e332c',
		label: 'Warm and expressive'
	},
	{
		id: 'studio',
		name: 'TEND Studio',
		description: 'High contrast presentation for portfolios and visual work.',
		accent: '#8b7cf6',
		paper: '#f2f0fa',
		ink: '#222033',
		label: 'Bold and visual'
	},
	{
		id: 'docs',
		name: 'TEND Docs',
		description: 'Structured, readable navigation for guides and reference material.',
		accent: '#4b9fe1',
		paper: '#eef4f7',
		ink: '#18303f',
		label: 'Clear and structured'
	}
];

export const demoLibraryComponents: readonly DemoLibraryComponent[] = [
	{
		id: 'split-hero',
		name: 'Split Hero',
		category: 'Hero',
		description: 'A clear opening message paired with a strong image.',
		kind: 'hero',
		eyebrow: 'A FRESH START',
		title: 'Give your idea a memorable first impression.',
		body: 'Lead with one clear promise, a useful next step and imagery that feels like you.'
	},
	{
		id: 'timeline',
		name: 'Timeline',
		category: 'Content',
		description: 'Stories, milestones and history in an easy reading rhythm.',
		kind: 'story',
		eyebrow: 'HOW WE GOT HERE',
		title: 'A few meaningful moments along the way.',
		body: 'Share the decisions, launches and people that shaped the work without overwhelming the page.'
	},
	{
		id: 'podcast-player',
		name: 'Podcast Player',
		category: 'Media',
		description: 'A welcoming episode feature with native-looking controls.',
		kind: 'story',
		eyebrow: 'LATEST EPISODE',
		title: 'A thoughtful conversation worth hearing.',
		body: 'Introduce the guest and the question at the heart of this episode before inviting visitors to listen.'
	},
	{
		id: 'api-reference',
		name: 'API Reference',
		category: 'Docs',
		description: 'Readable endpoints, explanations and examples.',
		kind: 'story',
		eyebrow: 'REFERENCE',
		title: 'Everything needed to make the first request.',
		body: 'Explain the endpoint, expected response and one safe copy-ready example in plain language.'
	},
	{
		id: 'places-map',
		name: 'Places Map',
		category: 'Data',
		description: 'A visual collection for locations, routes and discoveries.',
		kind: 'gallery',
		eyebrow: 'PLACES TO REMEMBER',
		title: 'A route made from favorite stops.',
		body: 'Collect the locations that matter and give each one enough context to become a destination.'
	},
	{
		id: 'testimonials',
		name: 'Testimonials',
		category: 'Business',
		description: 'A focused customer quote with room to breathe.',
		kind: 'quote',
		eyebrow: 'KIND WORDS',
		title: '“The process felt simple, thoughtful and completely ours.”',
		body: '— A happy customer'
	}
];

export function createLibrarySection(
	component: DemoLibraryComponent,
	sequence: number
): DemoSection {
	const section = createSection(component.kind, sequence);
	return {
		...section,
		label: component.name,
		eyebrow: component.eyebrow,
		title: component.title,
		body: component.body
	};
}

export function getDemoTheme(themeId: DemoThemeId | undefined): DemoTheme {
	return demoThemes.find((theme) => theme.id === themeId) ?? demoThemes[1];
}
