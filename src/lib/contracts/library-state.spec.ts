import { describe, expect, it } from 'vitest';
import { InstalledLibraryItemSchema, planLibraryChange } from './library-state';
describe('library state', () => {
	it('tracks installed provenance', () =>
		expect(
			InstalledLibraryItemSchema.parse({
				contract: 'tend.host/sites-installed-library-item/v1',
				projectId: 'site',
				itemId: 'hero',
				version: '1.0.0',
				integritySha256: 'a'.repeat(64),
				source: 'official',
				installedAt: '2026-08-09T20:00:00Z',
				state: 'installed'
			}).state
		).toBe('installed'));
	it('plans reviewed updates without applying', () =>
		expect(
			planLibraryChange('site', 'hero', 'update', 'a'.repeat(64), 'b'.repeat(64)).canApply
		).toBe(false));
	it('rejects incoherent install/update/removal evidence', () => {
		expect(() =>
			planLibraryChange('site', 'hero', 'install', 'a'.repeat(64), 'b'.repeat(64))
		).toThrow();
		expect(() =>
			planLibraryChange('site', 'hero', 'remove', 'a'.repeat(64), 'b'.repeat(64))
		).toThrow();
	});
});
