import { z } from 'zod';

import { ChangeSetSchema, IdentifierSchema, RelativeProjectPathSchema } from '../contracts/sites';

export const ChangePreviewSchema = z
	.object({
		contract: z.literal('tend.host/sites-change-preview/v1'),
		changeSetId: z.uuid(),
		projectId: IdentifierSchema,
		status: z.enum(['safe_to_review', 'destructive_review_required', 'validation_failed']),
		validation: z.enum(['pending', 'passed', 'failed']),
		counts: z
			.object({
				create: z.number().int().min(0),
				update: z.number().int().min(0),
				delete: z.number().int().min(0)
			})
			.strict(),
		files: z
			.array(
				z
					.object({ path: RelativeProjectPathSchema, kind: z.enum(['create', 'update', 'delete']) })
					.strict()
			)
			.min(1)
			.max(250),
		requiresNamedApproval: z.boolean(),
		canApply: z.literal(false),
		blockedReason: z.literal('host_repository_capability_required')
	})
	.strict();

export type ChangePreview = z.infer<typeof ChangePreviewSchema>;

export function previewChangeSet(changeSetInput: z.input<typeof ChangeSetSchema>): ChangePreview {
	const changeSet = ChangeSetSchema.parse(changeSetInput);
	const paths = changeSet.files.map((file) => file.path);
	if (new Set(paths).size !== paths.length) throw new Error('Change set contains duplicate paths');
	const counts = { create: 0, update: 0, delete: 0 };
	for (const file of changeSet.files) counts[file.kind] += 1;
	return ChangePreviewSchema.parse({
		contract: 'tend.host/sites-change-preview/v1',
		changeSetId: changeSet.id,
		projectId: changeSet.projectId,
		status:
			changeSet.validation === 'failed'
				? 'validation_failed'
				: counts.delete > 0
					? 'destructive_review_required'
					: 'safe_to_review',
		validation: changeSet.validation,
		counts,
		files: changeSet.files
			.map(({ path, kind }) => ({ path, kind }))
			.sort((left, right) => left.path.localeCompare(right.path)),
		requiresNamedApproval: counts.delete > 0,
		canApply: false,
		blockedReason: 'host_repository_capability_required'
	});
}
