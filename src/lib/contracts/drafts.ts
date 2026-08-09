import { z } from 'zod';

import { IdentifierSchema, Sha256HexSchema } from './sites';

export const DraftSaveRequestSchema = z
	.object({
		contract: z.literal('tend.host/sites-draft-save-request/v1'),
		requestId: z.uuid(),
		projectId: IdentifierSchema,
		entryId: IdentifierSchema,
		baseRevision: Sha256HexSchema,
		contentSha256: Sha256HexSchema,
		sequence: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
		requestedAt: z.iso.datetime({ offset: true })
	})
	.strict();

export const DraftRevisionSchema = z
	.object({
		contract: z.literal('tend.host/sites-draft-revision/v1'),
		draftId: z.uuid(),
		projectId: IdentifierSchema,
		entryId: IdentifierSchema,
		baseRevision: Sha256HexSchema,
		contentSha256: Sha256HexSchema,
		sequence: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
		state: z.literal('active'),
		savedAt: z.iso.datetime({ offset: true })
	})
	.strict();

export const DraftSaveResultSchema = z
	.object({
		contract: z.literal('tend.host/sites-draft-save-result/v1'),
		requestId: z.uuid(),
		status: z.enum(['saved', 'duplicate', 'conflict']),
		revision: DraftRevisionSchema.nullable(),
		conflict: z
			.object({
				expectedBaseRevision: Sha256HexSchema,
				actualSourceRevision: Sha256HexSchema
			})
			.strict()
			.nullable()
	})
	.strict()
	.superRefine((result, context) => {
		const isConflict = result.status === 'conflict';
		if (isConflict !== (result.conflict !== null) || isConflict === (result.revision !== null)) {
			context.addIssue({ code: 'custom', message: 'Draft result evidence is inconsistent' });
		}
	});

export type DraftSaveRequest = z.infer<typeof DraftSaveRequestSchema>;
export type DraftRevision = z.infer<typeof DraftRevisionSchema>;
export type DraftSaveResult = z.infer<typeof DraftSaveResultSchema>;

export function evaluateDraftSave(
	requestInput: DraftSaveRequest,
	actualSourceRevision: string,
	previous: DraftRevision | null,
	draftId: string,
	savedAt: string
): DraftSaveResult {
	const request = DraftSaveRequestSchema.parse(requestInput);
	const actual = Sha256HexSchema.parse(actualSourceRevision);
	if (request.baseRevision !== actual) {
		return DraftSaveResultSchema.parse({
			contract: 'tend.host/sites-draft-save-result/v1',
			requestId: request.requestId,
			status: 'conflict',
			revision: null,
			conflict: { expectedBaseRevision: request.baseRevision, actualSourceRevision: actual }
		});
	}
	if (previous) {
		const parsedPrevious = DraftRevisionSchema.parse(previous);
		if (
			parsedPrevious.projectId !== request.projectId ||
			parsedPrevious.entryId !== request.entryId
		) {
			throw new Error('Previous draft belongs to different content');
		}
		if (request.sequence < parsedPrevious.sequence)
			throw new Error('Draft sequence moved backwards');
		if (request.sequence === parsedPrevious.sequence) {
			if (
				request.contentSha256 !== parsedPrevious.contentSha256 ||
				request.baseRevision !== parsedPrevious.baseRevision
			) {
				throw new Error('Draft sequence was reused with different evidence');
			}
			return DraftSaveResultSchema.parse({
				contract: 'tend.host/sites-draft-save-result/v1',
				requestId: request.requestId,
				status: 'duplicate',
				revision: parsedPrevious,
				conflict: null
			});
		}
	}
	const parsedDraftId = previous?.draftId ?? z.uuid().parse(draftId);
	const parsedSavedAt = z.iso.datetime({ offset: true }).parse(savedAt);
	if (Date.parse(parsedSavedAt) < Date.parse(request.requestedAt)) {
		throw new Error('Draft save time precedes the request');
	}
	return DraftSaveResultSchema.parse({
		contract: 'tend.host/sites-draft-save-result/v1',
		requestId: request.requestId,
		status: 'saved',
		revision: {
			contract: 'tend.host/sites-draft-revision/v1',
			draftId: parsedDraftId,
			projectId: request.projectId,
			entryId: request.entryId,
			baseRevision: request.baseRevision,
			contentSha256: request.contentSha256,
			sequence: request.sequence,
			state: 'active',
			savedAt: parsedSavedAt
		},
		conflict: null
	});
}

export function appendUndoRevision(
	history: readonly DraftRevision[],
	revisionInput: DraftRevision,
	limit = 25
): readonly DraftRevision[] {
	if (!Number.isInteger(limit) || limit < 2 || limit > 50) throw new Error('Undo limit is invalid');
	const revision = DraftRevisionSchema.parse(revisionInput);
	const parsed = history.map((item) => DraftRevisionSchema.parse(item));
	const last = parsed.at(-1);
	if (last && (last.projectId !== revision.projectId || last.entryId !== revision.entryId)) {
		throw new Error('Undo history cannot cross content entries');
	}
	if (last && last.baseRevision !== revision.baseRevision) {
		throw new Error('Undo history cannot cross committed source revisions');
	}
	if (last && revision.sequence <= last.sequence) throw new Error('Undo history must be monotonic');
	return [...parsed, revision].slice(-limit);
}
