import { describe, expect, it } from 'vitest';
import { starterArchives, verifyStarterArchive } from './archives';
describe('starter source archives', () => {
	it('certifies all four complete source bundles', async () => {
		for (const archive of Object.values(starterArchives))
			await expect(verifyStarterArchive(archive)).resolves.toEqual(archive);
	});
	it('rejects changed source and revision evidence', async () => {
		const archive = starterArchives.minimal;
		await expect(
			verifyStarterArchive({
				...archive,
				files: archive.files.map((file, index) =>
					index ? file : { ...file, content: `${file.content} ` }
				)
			})
		).rejects.toThrow('digest mismatch');
		await expect(
			verifyStarterArchive({ ...archive, revisionSha256: 'f'.repeat(64) })
		).rejects.toThrow('revision digest');
	});
});
