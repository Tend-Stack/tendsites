import { describe, expect, it } from 'vitest';

import {
	assessStarterRepository,
	CustomSiteProfileSchema,
	planCustomSiteAdoption,
	type CustomSiteProfile,
	type StarterRepository
} from './custom-site';

const profile: CustomSiteProfile = {
	contract: 'tend.host/sites-custom-site-profile/v1',
	snapshotId: '11111111-1111-4111-8111-111111111111',
	repositoryId: 'custom-journal',
	commit: 'a'.repeat(40),
	framework: 'astro',
	rendererOwnership: 'repository',
	configuration: 'manifest',
	visualEditing: 'content_only',
	collections: [
		{
			id: 'posts',
			label: 'Posts',
			kind: 'posts',
			directory: 'src/content/posts',
			format: 'markdown',
			titleField: null,
			bodyField: null,
			slugField: null
		}
	],
	build: { script: 'build', output: 'dist' }
};

const starter: StarterRepository = {
	contract: 'tend.host/sites-starter-repository/v1',
	id: 'community-journal',
	name: 'Community Journal',
	summary: 'A writing-focused starter with ordinary Markdown content.',
	publisher: 'Example publisher',
	trust: 'community',
	reviewStatus: 'reviewed',
	framework: 'eleventy',
	provider: 'github',
	repositoryId: 'starter-community-journal',
	commit: 'b'.repeat(40),
	treeSha256: 'c'.repeat(64),
	license: 'MIT',
	contentFormats: ['markdown'],
	goals: ['blog'],
	metadata: {}
};

describe('custom site adoption', () => {
	it('preserves a custom renderer and limits Sites to declared content', () => {
		expect(planCustomSiteAdoption(profile)).toEqual({
			contract: 'tend.host/sites-custom-site-adoption-plan/v1',
			snapshotId: profile.snapshotId,
			repositoryId: profile.repositoryId,
			commit: profile.commit,
			framework: 'astro',
			mode: 'content_only',
			rendererPreserved: true,
			collectionIds: ['posts'],
			reviewOnly: true,
			canApply: false,
			blockedReason: 'host_repository_capability_required'
		});
	});

	it('supports a hybrid visual mode only when the profile explicitly declares it', () => {
		expect(planCustomSiteAdoption({ ...profile, visualEditing: 'supported_blocks' }).mode).toBe(
			'visual_and_content'
		);
	});

	it('rejects traversal, ambiguous collections, and implicit structured fields', () => {
		expect(() =>
			CustomSiteProfileSchema.parse({
				...profile,
				collections: [{ ...profile.collections[0], directory: '../posts' }]
			})
		).toThrow();
		expect(() =>
			CustomSiteProfileSchema.parse({
				...profile,
				collections: [profile.collections[0], profile.collections[0]]
			})
		).toThrow('unique');
		expect(() =>
			CustomSiteProfileSchema.parse({
				...profile,
				collections: [{ ...profile.collections[0], format: 'json', titleField: null }]
			})
		).toThrow('title field');
	});
});

describe('starter repository trust', () => {
	it('keeps reviewed community identity distinct from first-party identity', () => {
		expect(assessStarterRepository(starter)).toMatchObject({
			starterId: starter.id,
			selectable: true,
			status: 'reviewed'
		});
	});

	it('does not make unreviewed community code selectable', () => {
		expect(assessStarterRepository({ ...starter, reviewStatus: 'unreviewed' })).toMatchObject({
			selectable: false,
			status: 'review_required'
		});
	});

	it('rejects mutable or malformed repository evidence', () => {
		expect(() => assessStarterRepository({ ...starter, commit: 'main' })).toThrow();
		expect(() =>
			assessStarterRepository({ ...starter, contentFormats: ['markdown', 'markdown'] })
		).toThrow('unique');
	});
});
