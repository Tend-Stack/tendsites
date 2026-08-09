import { describe, expect, it } from 'vitest';

import type { StarterTemplate } from '../contracts/catalog';
import { planSiteCreation, type SiteCreationSelection } from './site-creation';

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
		{ path: 'tend.site.json', sha256: 'c'.repeat(64), role: 'configuration', required: true },
		{ path: 'src/optional.md', sha256: 'd'.repeat(64), role: 'content', required: false },
		{ path: 'package.json', sha256: 'b'.repeat(64), role: 'project', required: true }
	]
};

const selection: SiteCreationSelection = {
	contract: 'tend.host/sites-creation-selection/v1',
	planId: '11111111-1111-4111-8111-111111111111',
	projectId: 'weekend-notes',
	name: 'Weekend Notes',
	goal: 'blog',
	templateId: 'tend-editorial',
	templateRevisionSha256: 'a'.repeat(64),
	modules: ['blog', 'home'],
	accent: '#56e6ad',
	defaultLocale: 'en',
	requestedAt: '2026-08-09T20:00:00Z'
};

describe('site creation planner', () => {
	it('produces a deterministic review-only plan from an exact starter revision', () => {
		const plan = planSiteCreation(selection, template);
		expect(plan.modules).toEqual(['blog', 'home']);
		expect(plan.accent).toBe('#56e6ad');
		expect(plan.defaultLocale).toBe('en');
		expect(plan.files.map((file) => file.path)).toEqual(['package.json', 'tend.site.json']);
		expect(plan.authority).toBe('review_only');
		expect(plan.blockedReason).toBe('host_creation_capability_required');
	});

	it('rejects revision, goal, and module drift', () => {
		expect(() =>
			planSiteCreation({ ...selection, templateRevisionSha256: 'e'.repeat(64) }, template)
		).toThrow('exact starter revision');
		expect(() => planSiteCreation({ ...selection, goal: 'docs' }, template)).toThrow(
			'does not support this goal'
		);
		expect(() => planSiteCreation({ ...selection, modules: ['contact'] }, template)).toThrow(
			'does not support module'
		);
	});
});
