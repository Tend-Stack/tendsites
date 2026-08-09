import { describe, expect, it } from 'vitest';

import {
	assessLibraryItem,
	LibraryItemSchema,
	type CertificationEvidence,
	type LibraryItem
} from './library';

const item: LibraryItem = {
	contract: 'tend.host/sites-library-item/v1',
	kind: 'component',
	id: 'split-hero',
	name: 'Split Hero',
	version: '1.0.0',
	publisherId: 'tend-stack',
	trust: 'official',
	adapter: 'sveltekit',
	adapterRange: '^2.0.0',
	entryPath: 'src/lib/blocks/SplitHero.svelte',
	integritySha256: 'a'.repeat(64),
	panelScript: false
};

const checks = ['schema', 'integrity', 'accessibility', 'responsive', 'security'] as const;
const evidence: CertificationEvidence = {
	contract: 'tend.host/sites-library-certification/v1',
	certificationId: '11111111-1111-4111-8111-111111111111',
	itemId: 'split-hero',
	itemVersion: '1.0.0',
	itemIntegritySha256: 'a'.repeat(64),
	repositoryId: 'official-sites-library',
	commit: 'b'.repeat(40),
	archiveSha256: 'c'.repeat(64),
	checks: checks.map((id, index) => ({
		id,
		status: 'passed',
		evidenceSha256: String(index + 1).repeat(64)
	})),
	certifiedAt: '2026-08-09T20:00:00Z'
};

describe('library certification', () => {
	it('recognizes exact complete certification while retaining host install authority', () => {
		const assessment = assessLibraryItem(item, evidence);
		expect(assessment.status).toBe('installable');
		expect(assessment.reasons).toEqual([]);
		expect(assessment.canInstall).toBe(false);
	});

	it.each([
		['item identity', { itemId: 'other-item' }],
		['version', { itemVersion: '2.0.0' }],
		['integrity', { itemIntegritySha256: 'd'.repeat(64) }]
	])('blocks %s drift', (_label, drift) => {
		expect(assessLibraryItem(item, { ...evidence, ...drift }).status).toBe('blocked');
	});

	it('blocks failed or duplicate certification checks and panel scripts', () => {
		expect(
			assessLibraryItem(item, {
				...evidence,
				checks: evidence.checks.map((check) =>
					check.id === 'security' ? { ...check, status: 'failed' as const } : check
				)
			}).reasons
		).toContain('security_check_failed');
		expect(
			assessLibraryItem(item, {
				...evidence,
				checks: evidence.checks.map((check, index) =>
					index === 4 ? { ...check, id: 'schema' } : check
				)
			}).reasons
		).toContain('duplicate_certification_check');
		expect(() => LibraryItemSchema.parse({ ...item, panelScript: true })).toThrow();
		expect(assessLibraryItem(item, evidence, '3.0.0').reasons).toContain(
			'adapter_version_incompatible'
		);
	});
});
