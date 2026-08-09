import { describe, expect, it } from 'vitest';
import { planPreviewCleanup, supersedePreview, type PreviewLease } from './preview-lifecycle';
const lease: PreviewLease = {
	contract: 'tend.host/sites-preview-lease/v1',
	previewId: '11111111-1111-4111-8111-111111111111',
	projectId: 'site',
	snapshotSha256: 'a'.repeat(64),
	generation: 1,
	state: 'ready',
	issuedAt: '2026-08-09T20:00:00Z',
	expiresAt: '2026-08-09T21:00:00Z',
	supersededBy: null,
	cleanupEvidenceSha256: null
};
const next: PreviewLease = {
	...lease,
	previewId: '22222222-2222-4222-8222-222222222222',
	generation: 2,
	state: 'queued',
	issuedAt: '2026-08-09T20:30:00Z',
	expiresAt: '2026-08-09T21:30:00Z'
};
describe('preview lifecycle', () => {
	it('supersedes only the next bound generation', () =>
		expect(supersedePreview(lease, next, next.issuedAt).supersededBy).toBe(next.previewId));
	it('makes terminal and expired work cleanup eligible without granting cleanup', () => {
		const plan = planPreviewCleanup(lease, lease.expiresAt);
		expect(plan.eligible).toBe(true);
		expect(plan.canCleanup).toBe(false);
	});
	it('rejects cross-project and skipped generations', () =>
		expect(() =>
			supersedePreview(lease, { ...next, projectId: 'other', generation: 4 }, next.issuedAt)
		).toThrow());
});
