import { z } from 'zod';

import { IdentifierSchema, JsonValueSchema, LocaleTagSchema, Sha256HexSchema } from './sites';

export const BlockFieldSchema = z.discriminatedUnion('kind', [
	z
		.object({
			id: IdentifierSchema,
			label: z.string().min(1).max(80),
			kind: z.literal('text'),
			required: z.boolean(),
			maxLength: z.number().int().min(1).max(10_000)
		})
		.strict(),
	z
		.object({
			id: IdentifierSchema,
			label: z.string().min(1).max(80),
			kind: z.literal('choice'),
			required: z.boolean(),
			options: z.array(z.string().min(1).max(80)).min(1).max(30)
		})
		.strict(),
	z
		.object({
			id: IdentifierSchema,
			label: z.string().min(1).max(80),
			kind: z.literal('media'),
			required: z.boolean(),
			accepted: z.array(z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])).min(1)
		})
		.strict()
]);

export const BlockDefinitionSchema = z
	.object({
		contract: z.literal('tend.host/sites-block-definition/v1'),
		id: IdentifierSchema,
		version: z.string().regex(/^\d+\.\d+\.\d+$/),
		label: z.string().min(1).max(100),
		category: IdentifierSchema,
		fields: z.array(BlockFieldSchema).min(1).max(40),
		responsive: z.literal(true),
		panelScript: z.literal(false),
		integritySha256: Sha256HexSchema
	})
	.strict()
	.refine(
		(value) => new Set(value.fields.map((field) => field.id)).size === value.fields.length,
		'Block fields must be unique'
	);

export const PageBlockSchema = z
	.object({
		instanceId: z.uuid(),
		definitionId: IdentifierSchema,
		definitionVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
		values: z.record(IdentifierSchema, JsonValueSchema)
	})
	.strict();

export const PageDocumentSchema = z
	.object({
		contract: z.literal('tend.host/sites-page-document/v1'),
		projectId: IdentifierSchema,
		pageId: IdentifierSchema,
		locale: LocaleTagSchema,
		baseRevision: Sha256HexSchema,
		blocks: z.array(PageBlockSchema).min(1).max(100)
	})
	.strict()
	.refine(
		(value) => new Set(value.blocks.map((block) => block.instanceId)).size === value.blocks.length,
		'Block instances must be unique'
	);

export type BlockDefinition = z.infer<typeof BlockDefinitionSchema>;
export type PageDocument = z.infer<typeof PageDocumentSchema>;

export function inspectPageBlock(
	documentInput: PageDocument,
	instanceId: string,
	definitionsInput: readonly BlockDefinition[]
) {
	const document = PageDocumentSchema.parse(documentInput);
	const definitions = definitionsInput.map((definition) => BlockDefinitionSchema.parse(definition));
	const block = document.blocks.find(
		(candidate) => candidate.instanceId === z.uuid().parse(instanceId)
	);
	if (!block) throw new Error('Selected block does not exist');
	const definition = definitions.find(
		(candidate) =>
			candidate.id === block.definitionId && candidate.version === block.definitionVersion
	);
	if (!definition) throw new Error('Selected block definition is unavailable');
	const known = new Set(definition.fields.map((field) => field.id));
	for (const key of Object.keys(block.values))
		if (!known.has(key)) throw new Error('Block contains an unknown field');
	for (const field of definition.fields) {
		const value = block.values[field.id];
		if (field.required && (value === undefined || value === ''))
			throw new Error(`Required block field is missing: ${field.id}`);
		if (value === undefined) continue;
		if (field.kind === 'text' && (typeof value !== 'string' || value.length > field.maxLength))
			throw new Error(`Block text field is invalid: ${field.id}`);
		if (field.kind === 'choice' && (typeof value !== 'string' || !field.options.includes(value)))
			throw new Error(`Block choice field is invalid: ${field.id}`);
		if (
			field.kind === 'media' &&
			(typeof value !== 'string' || !IdentifierSchema.safeParse(value).success)
		)
			throw new Error(`Block media field is invalid: ${field.id}`);
	}
	return {
		document,
		block,
		definition,
		canWrite: false as const,
		blockedReason: 'host_repository_capability_required' as const
	};
}

export function movePageBlock(
	documentInput: PageDocument,
	instanceId: string,
	direction: 'up' | 'down'
): PageDocument {
	const document = PageDocumentSchema.parse(documentInput);
	const index = document.blocks.findIndex(
		(block) => block.instanceId === z.uuid().parse(instanceId)
	);
	if (index < 0) throw new Error('Selected block does not exist');
	const target = direction === 'up' ? index - 1 : index + 1;
	if (target < 0 || target >= document.blocks.length) return document;
	const blocks = [...document.blocks];
	[blocks[index], blocks[target]] = [blocks[target], blocks[index]];
	return PageDocumentSchema.parse({ ...document, blocks });
}
