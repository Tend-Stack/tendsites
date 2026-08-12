import { describe, expect, it } from 'vitest';

import { SourceCommitResultSchema, createSourceCommitRequest } from './host-source-commit';

describe('host source commit contract', () => {
	it('creates one exact bounded source request', () => {
		const request = createSourceCommitRequest({
			operationId: '123e4567-e89b-42d3-a456-426614174000',
			projectId: 'site.alpha',
			sourceId: 'source.alpha',
			baseRevision: 'a'.repeat(64),
			baseGitCommit: 'b'.repeat(40),
			archiveSha256: 'c'.repeat(64),
			archiveBytes: 4096,
			requestedAt: '2026-08-12T12:00:00.000Z'
		});

		expect(request.contract).toBe('tend.host/sites-source-commit-request/v1');
		expect(request.archiveBytes).toBe(4096);
	});

	it('rejects widened requests and malformed results', () => {
		expect(() =>
			createSourceCommitRequest({
				operationId: 'not-a-uuid',
				projectId: 'site.alpha',
				sourceId: 'source.alpha',
				baseRevision: 'a'.repeat(64),
				baseGitCommit: 'b'.repeat(40),
				archiveSha256: 'c'.repeat(64),
				archiveBytes: 35_000_001,
				requestedAt: '2026-08-12T12:00:00.000Z'
			})
		).toThrow();
		expect(() =>
			SourceCommitResultSchema.parse({
				contract: 'tend.host/sites-source-commit-result/v1',
				operationId: '123e4567-e89b-42d3-a456-426614174000',
				projectId: 'site.alpha',
				sourceId: 'source.alpha',
				parentRevision: 'a'.repeat(64),
				sourceRevision: 'b'.repeat(64),
				gitCommit: 'not-a-commit',
				created: true,
				committedAt: '2026-08-12T12:00:00.000Z'
			})
		).toThrow();
	});
});
