import { describe, expect, it } from 'vitest';

import { previewChangeSet } from './change-preview';

const changeSet = {
	contract: 'tend.host/sites-change-set/v1' as const,
	id: '11111111-1111-4111-8111-111111111111',
	projectId: 'weekend-notes',
	baseRevision: 'a'.repeat(64),
	summary: 'Update home and remove an old page',
	files: [
		{
			path: 'src/content/pages/home.md',
			kind: 'update' as const,
			beforeSha256: 'b'.repeat(64),
			afterSha256: 'c'.repeat(64)
		},
		{
			path: 'src/content/pages/old.md',
			kind: 'delete' as const,
			beforeSha256: 'd'.repeat(64),
			afterSha256: null
		}
	],
	validation: 'pending' as const,
	createdAt: '2026-08-09T20:00:00Z'
};

describe('change-set preview', () => {
	it('surfaces destructive impact without claiming apply authority', () => {
		const preview = previewChangeSet(changeSet);
		expect(preview.status).toBe('destructive_review_required');
		expect(preview.counts).toEqual({ create: 0, update: 1, delete: 1 });
		expect(preview.requiresNamedApproval).toBe(true);
		expect(preview.canApply).toBe(false);
	});

	it('rejects duplicate path ambiguity', () => {
		expect(() =>
			previewChangeSet({ ...changeSet, files: [changeSet.files[0], changeSet.files[0]] })
		).toThrow('duplicate paths');
	});

	it('surfaces failed validation ahead of a non-destructive review', () => {
		const preview = previewChangeSet({
			...changeSet,
			validation: 'failed',
			files: [changeSet.files[0]]
		});
		expect(preview.status).toBe('validation_failed');
		expect(preview.validation).toBe('failed');
	});
});
