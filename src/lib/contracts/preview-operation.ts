import { z } from 'zod';

import { SourceSnapshotSchema } from './adoption';
import { PreviewExecutionPolicySchema } from './preview-policy';
import { ChangeSetSchema, IdentifierSchema } from './sites';

export const PreviewExecutionIntentSchema = z
	.object({
		contract: z.literal('tend.host/sites-preview-execution-intent/v1'),
		projectId: IdentifierSchema,
		snapshot: SourceSnapshotSchema,
		changeSet: ChangeSetSchema,
		policy: PreviewExecutionPolicySchema,
		originClass: z.literal('separate_untrusted_preview'),
		panelCredentials: z.literal(false),
		deploymentAuthority: z.literal(false)
	})
	.strict()
	.superRefine((intent, context) => {
		if (intent.changeSet.projectId !== intent.projectId) {
			context.addIssue({
				code: 'custom',
				path: ['changeSet'],
				message: 'Change set project does not match'
			});
		}
		if (intent.changeSet.baseRevision !== intent.snapshot.treeSha256) {
			context.addIssue({
				code: 'custom',
				path: ['snapshot'],
				message: 'Preview source revision does not match'
			});
		}
	});

export type PreviewExecutionIntent = z.infer<typeof PreviewExecutionIntentSchema>;

export function createPreviewExecutionIntent(
	input: z.input<typeof PreviewExecutionIntentSchema>
): PreviewExecutionIntent {
	return PreviewExecutionIntentSchema.parse(input);
}
