import { z } from 'zod';
import { IdentifierSchema, Sha256HexSchema } from './sites';
export const InstalledLibraryItemSchema = z
	.object({
		contract: z.literal('tend.host/sites-installed-library-item/v1'),
		projectId: IdentifierSchema,
		itemId: IdentifierSchema,
		version: z.string().regex(/^\d+\.\d+\.\d+$/),
		integritySha256: Sha256HexSchema,
		source: z.enum(['official', 'community']),
		installedAt: z.iso.datetime({ offset: true }),
		state: z.enum(['installed', 'update_available', 'removal_planned'])
	})
	.strict();
export const LibraryChangePlanSchema = z
	.object({
		contract: z.literal('tend.host/sites-library-change-plan/v1'),
		projectId: IdentifierSchema,
		itemId: IdentifierSchema,
		action: z.enum(['install', 'update', 'remove']),
		fromIntegritySha256: Sha256HexSchema.nullable(),
		toIntegritySha256: Sha256HexSchema.nullable(),
		requiresReview: z.literal(true),
		canApply: z.literal(false)
	})
	.strict()
	.superRefine((value, context) => {
		if (value.action === 'install' && value.fromIntegritySha256 !== null)
			context.addIssue({ code: 'custom', message: 'Install cannot have prior evidence' });
		if (value.action === 'remove' && value.toIntegritySha256 !== null)
			context.addIssue({ code: 'custom', message: 'Removal cannot have target evidence' });
		if (
			value.action === 'update' &&
			(!value.fromIntegritySha256 ||
				!value.toIntegritySha256 ||
				value.fromIntegritySha256 === value.toIntegritySha256)
		)
			context.addIssue({ code: 'custom', message: 'Update requires changed evidence' });
	});
export function planLibraryChange(
	projectId: string,
	itemId: string,
	action: 'install' | 'update' | 'remove',
	from: string | null,
	to: string | null
) {
	return LibraryChangePlanSchema.parse({
		contract: 'tend.host/sites-library-change-plan/v1',
		projectId,
		itemId,
		action,
		fromIntegritySha256: from,
		toIntegritySha256: to,
		requiresReview: true,
		canApply: false
	});
}
