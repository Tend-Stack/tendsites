import { z } from 'zod';
import { IdentifierSchema, RelativeProjectPathSchema, Sha256HexSchema } from '../contracts/sites';

export const ContentDiffSchema = z
	.object({
		contract: z.literal('tend.host/sites-content-diff/v1'),
		projectId: IdentifierSchema,
		path: RelativeProjectPathSchema,
		beforeSha256: Sha256HexSchema.nullable(),
		afterSha256: Sha256HexSchema.nullable(),
		hunks: z
			.array(
				z
					.object({
						field: IdentifierSchema,
						before: z.string().max(10_000).nullable(),
						after: z.string().max(10_000).nullable(),
						change: z.enum(['added', 'updated', 'removed'])
					})
					.strict()
			)
			.min(1)
			.max(100),
		requiresNamedApproval: z.boolean(),
		canApply: z.literal(false)
	})
	.strict();

export function diffContentRecord(
	projectId: string,
	path: string,
	before: Readonly<Record<string, string>> | null,
	after: Readonly<Record<string, string>> | null,
	beforeSha256: string | null,
	afterSha256: string | null
) {
	if (!before && !after) throw new Error('Content diff requires evidence');
	const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])].sort();
	const hunks = keys
		.filter((key) => before?.[key] !== after?.[key])
		.map((field) => ({
			field,
			before: before?.[field] ?? null,
			after: after?.[field] ?? null,
			change:
				before?.[field] === undefined
					? ('added' as const)
					: after?.[field] === undefined
						? ('removed' as const)
						: ('updated' as const)
		}));
	if (!hunks.length) throw new Error('Content evidence is unchanged');
	return ContentDiffSchema.parse({
		contract: 'tend.host/sites-content-diff/v1',
		projectId,
		path,
		beforeSha256,
		afterSha256,
		hunks,
		requiresNamedApproval: hunks.some((hunk) => hunk.change === 'removed'),
		canApply: false
	});
}
