import { z } from 'zod';

import {
	IdentifierSchema,
	LocaleTagSchema,
	RelativeProjectPathSchema,
	Sha256HexSchema
} from './sites';

export const MediaAssetSchema = z
	.object({
		contract: z.literal('tend.host/sites-media-asset/v1'),
		assetId: IdentifierSchema,
		projectId: IdentifierSchema,
		path: RelativeProjectPathSchema,
		sha256: Sha256HexSchema,
		contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
		bytes: z.number().int().min(1).max(100_000_000),
		width: z.number().int().min(1).max(50_000),
		height: z.number().int().min(1).max(50_000),
		alt: z
			.record(LocaleTagSchema, z.string().trim().min(1).max(500))
			.refine((alt) => Object.keys(alt).length > 0, 'Media requires alternative text'),
		createdAt: z.iso.datetime({ offset: true })
	})
	.strict();

export const MediaVariantRequestSchema = z
	.object({
		variantId: IdentifierSchema,
		purpose: z.enum(['thumbnail', 'card', 'hero', 'preview']),
		width: z.number().int().min(16).max(8_192),
		height: z.number().int().min(16).max(8_192),
		format: z.enum(['jpeg', 'png', 'webp', 'avif']),
		quality: z.number().int().min(40).max(95)
	})
	.strict();

export const MediaVariantPlanSchema = z
	.object({
		contract: z.literal('tend.host/sites-media-variant-plan/v1'),
		assetId: IdentifierSchema,
		sourceSha256: Sha256HexSchema,
		variants: z
			.array(MediaVariantRequestSchema.extend({ outputPath: RelativeProjectPathSchema }).strict())
			.min(1)
			.max(16),
		canTransform: z.literal(false),
		blockedReason: z.literal('host_media_transform_capability_required')
	})
	.strict();

export type MediaAsset = z.infer<typeof MediaAssetSchema>;
export type MediaVariantRequest = z.infer<typeof MediaVariantRequestSchema>;
export type MediaVariantPlan = z.infer<typeof MediaVariantPlanSchema>;

export function planMediaVariants(
	assetInput: MediaAsset,
	requestsInput: readonly MediaVariantRequest[]
): MediaVariantPlan {
	const asset = MediaAssetSchema.parse(assetInput);
	const requests = requestsInput.map((request) => MediaVariantRequestSchema.parse(request));
	if (requests.length === 0) throw new Error('At least one media variant is required');
	if (new Set(requests.map((request) => request.variantId)).size !== requests.length) {
		throw new Error('Media variant IDs must be unique');
	}
	for (const request of requests) {
		if (request.width > asset.width || request.height > asset.height) {
			throw new Error('Media variants cannot upscale the source asset');
		}
	}
	const base = asset.path.replace(/\.[^/.]+$/, '');
	return MediaVariantPlanSchema.parse({
		contract: 'tend.host/sites-media-variant-plan/v1',
		assetId: asset.assetId,
		sourceSha256: asset.sha256,
		variants: requests
			.map((request) => ({
				...request,
				outputPath: `${base}.${request.variantId}.${request.format}`
			}))
			.sort((left, right) => left.variantId.localeCompare(right.variantId)),
		canTransform: false,
		blockedReason: 'host_media_transform_capability_required'
	});
}
