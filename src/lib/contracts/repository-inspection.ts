import { z } from 'zod';

import { AdoptionPolicySchema, SourceSnapshotSchema } from './adoption';
import { IdentifierSchema } from './sites';

const RepositoryRefSchema = z
	.string()
	.min(1)
	.max(255)
	.refine((value) => !value.startsWith('-'), 'Repository ref cannot be option-like')
	.refine(
		(value) => [...value].every((character) => (character.codePointAt(0) ?? 0) > 31),
		'Repository ref contains a control character'
	);

export const RepositoryInspectionIntentSchema = z
	.object({
		contract: z.literal('tend.host/sites-repository-inspection-intent/v1'),
		projectId: IdentifierSchema,
		providerConnectionId: IdentifierSchema,
		repositoryId: IdentifierSchema,
		ref: RepositoryRefSchema,
		policy: AdoptionPolicySchema,
		checkout: z.literal('host_bounded_disposable'),
		credentialDelivery: z.literal('host_only'),
		packageScripts: z.literal('disabled'),
		productionDestinationAvailable: z.literal(false)
	})
	.strict();

export const RepositoryInspectionResultSchema = z
	.object({
		contract: z.literal('tend.host/sites-repository-inspection-result/v1'),
		requestId: z.uuid(),
		projectId: IdentifierSchema,
		snapshot: SourceSnapshotSchema,
		checkoutRemoved: z.literal(true),
		secretCount: z.literal(0)
	})
	.strict();

export type RepositoryInspectionIntent = z.infer<typeof RepositoryInspectionIntentSchema>;

export function createRepositoryInspectionIntent(
	input: z.input<typeof RepositoryInspectionIntentSchema>
): RepositoryInspectionIntent {
	return RepositoryInspectionIntentSchema.parse(input);
}
