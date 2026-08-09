import { z } from 'zod';

import { CommitPlanSchema } from './publishing';
import { IdentifierSchema, Sha256HexSchema } from './sites';

export const PublishExecutionIntentSchema = z
	.object({
		contract: z.literal('tend.host/sites-publish-execution-intent/v1'),
		projectId: IdentifierSchema,
		assignedDeploymentId: IdentifierSchema,
		commitPlan: CommitPlanSchema,
		previewId: z.uuid(),
		previewEvidenceSha256: Sha256HexSchema,
		approvedArtifactPlatform: z.string().regex(/^[a-z0-9]+\/[a-z0-9_]+$/),
		approval: z.literal('explicit_user_review'),
		routing: z.literal('health_gated_retain_previous'),
		buildPlacement: z.literal('host_assigned'),
		browserCredentials: z.literal(false)
	})
	.strict()
	.refine((intent) => intent.commitPlan.projectId === intent.projectId, {
		path: ['commitPlan'],
		message: 'Commit plan project does not match'
	});

export type PublishExecutionIntent = z.infer<typeof PublishExecutionIntentSchema>;

export function createPublishExecutionIntent(
	input: z.input<typeof PublishExecutionIntentSchema>
): PublishExecutionIntent {
	return PublishExecutionIntentSchema.parse(input);
}
