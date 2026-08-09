import { describe, expect, it } from 'vitest';
import { diffContentRecord } from './content-diff';
describe('content-aware review', () => {
	it('sorts readable field changes and cannot apply them', () => {
		const result = diffContentRecord(
			'site',
			'content/home.md',
			{ title: 'Old', summary: 'Keep' },
			{ title: 'New', summary: 'Keep', cta: 'Read' },
			'a'.repeat(64),
			'b'.repeat(64)
		);
		expect(result.hunks.map((h) => h.field)).toEqual(['cta', 'title']);
		expect(result.canApply).toBe(false);
	});
	it('requires named approval for removals', () =>
		expect(
			diffContentRecord(
				'site',
				'content/home.md',
				{ title: 'Old' },
				{},
				'a'.repeat(64),
				'b'.repeat(64)
			).requiresNamedApproval
		).toBe(true));
	it('rejects empty or unchanged evidence', () => {
		expect(() => diffContentRecord('site', 'content/home.md', null, null, null, null)).toThrow();
		expect(() =>
			diffContentRecord(
				'site',
				'content/home.md',
				{ title: 'Same' },
				{ title: 'Same' },
				'a'.repeat(64),
				'a'.repeat(64)
			)
		).toThrow();
	});
});
