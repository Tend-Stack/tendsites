import { describe, expect, it } from 'vitest';

import { findStarterTemplate, StarterTemplateSchema, type StarterTemplate } from './catalog';

const template: StarterTemplate = {
	contract: 'tend.host/sites-starter-template/v1',
	id: 'tend-editorial',
	name: 'Tend Editorial',
	summary: 'A calm writing-focused starter.',
	version: '1.0.0',
	revisionSha256: 'a'.repeat(64),
	adapter: 'sveltekit',
	goals: ['blog'],
	modules: ['home', 'about', 'blog'],
	themeId: 'editorial',
	locales: { defaultLocale: 'en', locales: ['en'], strategy: 'multiple_folders' },
	files: [
		{ path: 'package.json', sha256: 'b'.repeat(64), role: 'project', required: true },
		{ path: 'tend.site.json', sha256: 'c'.repeat(64), role: 'configuration', required: true }
	]
};

describe('starter catalog contract', () => {
	it('requires immutable identity and the portable project anchors', () => {
		expect(StarterTemplateSchema.parse(template).id).toBe('tend-editorial');
		expect(() =>
			StarterTemplateSchema.parse({ ...template, files: template.files.slice(0, 1) })
		).toThrow('tend.site.json');
	});

	it('loads only an exact revision and rejects ambiguous catalog evidence', () => {
		expect(findStarterTemplate([template], template.id, template.revisionSha256).name).toBe(
			'Tend Editorial'
		);
		expect(() => findStarterTemplate([template], template.id, 'd'.repeat(64))).toThrow(
			'Exact immutable starter revision'
		);
		expect(() =>
			findStarterTemplate([template, template], template.id, template.revisionSha256)
		).toThrow();
	});
});
