import { describe, expect, it } from 'vitest';

import {
	appendUndoRevision,
	evaluateDraftSave,
	planDraftConflictResolution,
	type DraftSaveRequest
} from './drafts';

const request: DraftSaveRequest = {
	contract: 'tend.host/sites-draft-save-request/v1',
	requestId: '11111111-1111-4111-8111-111111111111',
	projectId: 'weekend-notes',
	entryId: 'field-notes-en',
	baseRevision: 'a'.repeat(64),
	contentSha256: 'b'.repeat(64),
	sequence: 1,
	requestedAt: '2026-08-09T20:00:00Z'
};

describe('draft revisions', () => {
	it('separates a saved draft from committed source and converges exact retries', () => {
		const saved = evaluateDraftSave(
			request,
			'a'.repeat(64),
			null,
			'22222222-2222-4222-8222-222222222222',
			'2026-08-09T20:00:01Z'
		);
		expect(saved.status).toBe('saved');
		expect(saved.revision?.state).toBe('active');
		const duplicate = evaluateDraftSave(
			request,
			'a'.repeat(64),
			saved.revision,
			'33333333-3333-4333-8333-333333333333',
			'2026-08-09T20:00:02Z'
		);
		expect(duplicate.status).toBe('duplicate');
		expect(duplicate.revision).toEqual(saved.revision);
	});

	it('returns explicit conflict evidence when committed source moved', () => {
		const result = evaluateDraftSave(
			request,
			'c'.repeat(64),
			null,
			'22222222-2222-4222-8222-222222222222',
			'2026-08-09T20:00:01Z'
		);
		expect(result.status).toBe('conflict');
		expect(result.revision).toBeNull();
		expect(result.conflict?.actualSourceRevision).toBe('c'.repeat(64));
	});

	it('rejects stale or drifted sequence reuse and bounds undo history', () => {
		const first = evaluateDraftSave(
			request,
			'a'.repeat(64),
			null,
			'22222222-2222-4222-8222-222222222222',
			'2026-08-09T20:00:01Z'
		).revision!;
		expect(() =>
			evaluateDraftSave(
				{ ...request, contentSha256: 'd'.repeat(64) },
				'a'.repeat(64),
				first,
				first.draftId,
				'2026-08-09T20:00:02Z'
			)
		).toThrow('reused with different evidence');
		const history = appendUndoRevision(
			[first],
			{ ...first, sequence: 2, contentSha256: 'e'.repeat(64) },
			2
		);
		expect(history).toHaveLength(2);
		expect(() => appendUndoRevision(history, { ...first, sequence: 2 }, 2)).toThrow('monotonic');
		expect(() =>
			appendUndoRevision(history, { ...first, sequence: 3, baseRevision: 'f'.repeat(64) }, 2)
		).toThrow('committed source revisions');
	});

	it('produces an explicit, non-applying conflict choice', () => {
		const plan = planDraftConflictResolution(
			'weekend-notes',
			'field-notes-en',
			'a'.repeat(64),
			'b'.repeat(64),
			'keep_draft'
		);
		expect(plan.resultSha256).toBe('a'.repeat(64));
		expect(plan.canApply).toBe(false);
		expect(() =>
			planDraftConflictResolution('site', 'entry', 'a'.repeat(64), 'a'.repeat(64), 'keep_draft')
		).toThrow('not in conflict');
	});
});
