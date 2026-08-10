import { describe, expect, it } from 'vitest';

import {
	createLibrarySection,
	demoLibraryComponents,
	demoThemes,
	getDemoTheme
} from './library-catalog';

describe('local reviewed library', () => {
	it('keeps reviewed identities unique and every theme visibly distinct', () => {
		expect(new Set(demoLibraryComponents.map((item) => item.id)).size).toBe(
			demoLibraryComponents.length
		);
		expect(new Set(demoThemes.map((theme) => theme.id)).size).toBe(demoThemes.length);
		expect(new Set(demoThemes.map((theme) => theme.accent)).size).toBe(demoThemes.length);
	});

	it('creates an editable section from exact reviewed component copy', () => {
		const component = demoLibraryComponents[5];
		expect(createLibrarySection(component, 42)).toMatchObject({
			id: 'quote-42',
			kind: 'quote',
			label: 'Testimonials',
			title: component.title,
			body: component.body
		});
	});

	it('falls back to the reviewed editorial theme for older drafts', () => {
		expect(getDemoTheme(undefined).id).toBe('editorial');
		expect(getDemoTheme('docs').name).toBe('TEND Docs');
	});
});
