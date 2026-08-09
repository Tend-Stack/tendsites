import { describe, expect, it } from 'vitest';

import { createSiteCreationExecutionIntent } from './creation-operation';
import type { SiteCreationPlan } from '../planning/site-creation';

const plan: SiteCreationPlan = {
	contract: 'tend.host/sites-creation-plan/v1',
	planId: '11111111-1111-4111-8111-111111111111',
	projectId: 'new-site',
	name: 'New site',
	goal: 'business',
	templateId: 'minimal',
	templateRevisionSha256: 'a'.repeat(64),
	modules: ['home'],
	accent: '#00c896',
	defaultLocale: 'en-US',
	files: [
		{ path: 'package.json', sourceSha256: 'b'.repeat(64) },
		{ path: 'tend.site.json', sourceSha256: 'c'.repeat(64) }
	],
	authority: 'review_only',
	blockedReason: 'host_creation_capability_required',
	requestedAt: '2026-08-09T20:00:00Z'
};

describe('site creation execution intent', () => {
	it('binds the exact reviewed plan without granting secrets or production', () => {
		const intent = createSiteCreationExecutionIntent(plan);
		expect(intent.starterRevisionSha256).toBe(plan.templateRevisionSha256);
		expect(intent.secretAccess).toBe('none');
		expect(intent.productionDestinationAvailable).toBe(false);
	});

	it('rejects starter revision drift inside the reviewed plan', () => {
		expect(() =>
			createSiteCreationExecutionIntent({
				...plan,
				templateRevisionSha256: 'not-a-digest'
			})
		).toThrow();
	});
});
