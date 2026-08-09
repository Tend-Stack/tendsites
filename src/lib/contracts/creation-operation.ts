import { z } from 'zod';

import { SiteCreationPlanSchema, type SiteCreationPlan } from '../planning/site-creation';
import { IdentifierSchema, Sha256HexSchema } from './sites';

export const SiteCreationExecutionIntentSchema = z
	.object({
		contract: z.literal('tend.host/sites-creation-execution-intent/v1'),
		projectId: IdentifierSchema,
		planId: z.uuid(),
		starterRevisionSha256: Sha256HexSchema,
		plan: SiteCreationPlanSchema,
		target: z.literal('new_assigned_repository'),
		secretAccess: z.literal('none'),
		productionDestinationAvailable: z.literal(false)
	})
	.strict();

export type SiteCreationExecutionIntent = z.infer<typeof SiteCreationExecutionIntentSchema>;

export function createSiteCreationExecutionIntent(
	planInput: SiteCreationPlan
): SiteCreationExecutionIntent {
	const plan = SiteCreationPlanSchema.parse(planInput);
	return SiteCreationExecutionIntentSchema.parse({
		contract: 'tend.host/sites-creation-execution-intent/v1',
		projectId: plan.projectId,
		planId: plan.planId,
		starterRevisionSha256: plan.templateRevisionSha256,
		plan,
		target: 'new_assigned_repository',
		secretAccess: 'none',
		productionDestinationAvailable: false
	});
}
