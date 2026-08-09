import { describe, expect, it } from 'vitest';

import { MediaAssetSchema, planMediaVariants, type MediaAsset } from './media';

const asset: MediaAsset = {
	contract: 'tend.host/sites-media-asset/v1',
	assetId: 'field-notes-cover',
	projectId: 'weekend-notes',
	path: 'static/media/field-notes.jpg',
	sha256: 'a'.repeat(64),
	contentType: 'image/jpeg',
	bytes: 1_200_000,
	width: 2400,
	height: 1600,
	alt: { en: 'A quiet road through the hills' },
	createdAt: '2026-08-09T20:00:00Z'
};

describe('repository media evidence', () => {
	it('creates a deterministic non-executing variant plan', () => {
		const plan = planMediaVariants(asset, [
			{
				variantId: 'hero',
				purpose: 'hero',
				width: 1600,
				height: 1000,
				format: 'avif',
				quality: 82
			},
			{ variantId: 'card', purpose: 'card', width: 800, height: 600, format: 'webp', quality: 80 }
		]);
		expect(plan.variants.map((variant) => variant.variantId)).toEqual(['card', 'hero']);
		expect(plan.variants[0].outputPath).toBe('static/media/field-notes.card.webp');
		expect(plan.canTransform).toBe(false);
	});

	it('rejects upscaling, duplicate variants, unsafe paths, and unbounded files', () => {
		expect(() =>
			planMediaVariants(asset, [
				{
					variantId: 'huge',
					purpose: 'hero',
					width: 3000,
					height: 1600,
					format: 'avif',
					quality: 80
				}
			])
		).toThrow('cannot upscale');
		const variant = {
			variantId: 'card',
			purpose: 'card' as const,
			width: 800,
			height: 600,
			format: 'webp' as const,
			quality: 80
		};
		expect(() => planMediaVariants(asset, [variant, variant])).toThrow('must be unique');
		expect(() => MediaAssetSchema.parse({ ...asset, path: '../secret.jpg' })).toThrow();
		expect(() => MediaAssetSchema.parse({ ...asset, bytes: 100_000_001 })).toThrow();
		expect(() => MediaAssetSchema.parse({ ...asset, contentType: 'image/svg+xml' })).toThrow();
		expect(() => MediaAssetSchema.parse({ ...asset, alt: {} })).toThrow('alternative text');
	});
});
