import { z } from 'zod';

import { sha256CanonicalJson } from './canonical';
import { IdentifierSchema, JsonValueSchema, Sha256HexSchema, type JsonValue } from './sites';

export const HostCapabilityNameSchema = z.enum([
	'repository.inspect',
	'site.create',
	'preview.execute',
	'publish.execute',
	'domain.assign',
	'ai.invoke'
]);

export const AssignedHostContextSchema = z
	.object({
		contract: z.literal('tend.host/sites-assigned-host-context/v1'),
		contextId: z.uuid(),
		capability: HostCapabilityNameSchema,
		projectId: IdentifierSchema,
		repositoryId: IdentifierSchema.nullable(),
		sourceRevision: Sha256HexSchema.nullable(),
		issuedAt: z.iso.datetime({ offset: true }),
		expiresAt: z.iso.datetime({ offset: true })
	})
	.strict()
	.refine((context) => Date.parse(context.expiresAt) > Date.parse(context.issuedAt), {
		path: ['expiresAt'],
		message: 'Host context expiry must follow issuance'
	});

export const HostOperationRequestSchema = z
	.object({
		contract: z.literal('tend.host/sites-host-operation-request/v1'),
		requestId: z.uuid(),
		contextId: z.uuid(),
		capability: HostCapabilityNameSchema,
		projectId: IdentifierSchema,
		intent: JsonValueSchema,
		intentSha256: Sha256HexSchema,
		idempotencySha256: Sha256HexSchema,
		expectedRevision: Sha256HexSchema.nullable(),
		requestedAt: z.iso.datetime({ offset: true })
	})
	.strict();

export const HostOperationEvidenceSchema = z
	.object({
		contract: z.literal('tend.host/sites-host-operation-evidence/v1'),
		operationId: z.uuid(),
		requestId: z.uuid(),
		contextId: z.uuid(),
		capability: HostCapabilityNameSchema,
		projectId: IdentifierSchema,
		intentSha256: Sha256HexSchema,
		idempotencySha256: Sha256HexSchema,
		state: z.enum(['accepted', 'running', 'succeeded', 'failed', 'cancelled']),
		sequence: z.number().int().min(1),
		resultSha256: Sha256HexSchema.nullable(),
		errorCode: IdentifierSchema.nullable(),
		recordedAt: z.iso.datetime({ offset: true })
	})
	.strict()
	.superRefine((evidence, context) => {
		if ((evidence.state === 'succeeded') !== (evidence.resultSha256 !== null)) {
			context.addIssue({
				code: 'custom',
				path: ['resultSha256'],
				message: 'Result evidence is inconsistent'
			});
		}
		const hasError = evidence.state === 'failed' || evidence.state === 'cancelled';
		if (hasError !== (evidence.errorCode !== null)) {
			context.addIssue({
				code: 'custom',
				path: ['errorCode'],
				message: 'Error evidence is inconsistent'
			});
		}
	});

export type AssignedHostContext = z.infer<typeof AssignedHostContextSchema>;
export type HostOperationRequest = z.infer<typeof HostOperationRequestSchema>;
export type HostOperationEvidence = z.infer<typeof HostOperationEvidenceSchema>;

export interface BoundSiteHostCapability {
	readonly context: AssignedHostContext;
	invoke(request: HostOperationRequest): Promise<HostOperationEvidence>;
}

export async function createHostOperationRequest(input: {
	requestId: string;
	context: AssignedHostContext;
	capability: z.infer<typeof HostCapabilityNameSchema>;
	projectId: string;
	intent: JsonValue;
	expectedRevision: string | null;
	requestedAt: string;
}): Promise<HostOperationRequest> {
	const context = AssignedHostContextSchema.parse(input.context);
	const requestedAt = Date.parse(z.iso.datetime({ offset: true }).parse(input.requestedAt));
	if (context.capability !== input.capability || context.projectId !== input.projectId) {
		throw new Error('Host context does not authorize this project operation');
	}
	if (requestedAt < Date.parse(context.issuedAt) || requestedAt >= Date.parse(context.expiresAt)) {
		throw new Error('Host context is not live at request time');
	}
	if (input.expectedRevision !== context.sourceRevision) {
		throw new Error('Host context source revision does not match');
	}
	const intent = JsonValueSchema.parse(input.intent);
	const intentSha256 = await sha256CanonicalJson(intent);
	const idempotencySha256 = await sha256CanonicalJson({
		contextId: context.contextId,
		capability: context.capability,
		projectId: context.projectId,
		intentSha256,
		expectedRevision: input.expectedRevision
	});
	return HostOperationRequestSchema.parse({
		contract: 'tend.host/sites-host-operation-request/v1',
		requestId: input.requestId,
		contextId: context.contextId,
		capability: input.capability,
		projectId: input.projectId,
		intent,
		intentSha256,
		idempotencySha256,
		expectedRevision: input.expectedRevision,
		requestedAt: input.requestedAt
	});
}

export function validateHostOperationEvidence(
	requestInput: HostOperationRequest,
	evidenceInput: HostOperationEvidence,
	previousSequence = 0
): HostOperationEvidence {
	const request = HostOperationRequestSchema.parse(requestInput);
	const evidence = HostOperationEvidenceSchema.parse(evidenceInput);
	for (const field of [
		'requestId',
		'contextId',
		'capability',
		'projectId',
		'intentSha256',
		'idempotencySha256'
	] as const) {
		if (request[field] !== evidence[field])
			throw new Error(`Host operation ${field} does not match`);
	}
	if (evidence.sequence <= previousSequence) throw new Error('Host operation evidence is stale');
	if (Date.parse(evidence.recordedAt) < Date.parse(request.requestedAt)) {
		throw new Error('Host operation evidence predates the request');
	}
	return evidence;
}
