import { describe, expect, it } from 'vitest';

import { SitePreviewSchema } from './host-preview';

describe('site preview host contract', () => {
	it('accepts bounded credential-free readiness evidence', () => {
		const preview = SitePreviewSchema.parse({
			contract: 'tend.host/sites-preview/v1',
			previewId: 'preview-1',
			projectId: 'site.alpha',
			sourceId: 'source.alpha',
			sourceRevision: 'a'.repeat(64),
			gitCommit: 'b'.repeat(40),
			hostname: 'preview.example.com',
			url: 'https://preview.example.com',
			generation: 1,
			state: 'ready',
			requestedAt: '2026-08-12T00:00:00.000Z',
			startedAt: '2026-08-12T00:00:01.000Z',
			readyAt: '2026-08-12T00:00:20.000Z',
			expiresAt: '2026-08-12T01:00:00.000Z',
			artifact: {
				sha256: 'c'.repeat(64),
				files: 8,
				bytes: 4096,
				builderImage: 'node@example',
				serverImage: 'nginx@example'
			},
			errorCode: null
		});

		expect(preview.url).toBe('https://preview.example.com');
		expect(JSON.stringify(preview)).not.toContain('server_uuid');
		expect(JSON.stringify(preview)).not.toContain('/sources');
	});

	it('rejects an unrecognized lifecycle state', () => {
		expect(() =>
			SitePreviewSchema.parse({
				contract: 'tend.host/sites-preview/v1',
				previewId: 'preview-1',
				projectId: 'site.alpha',
				sourceId: 'source.alpha',
				sourceRevision: 'a'.repeat(64),
				gitCommit: 'b'.repeat(40),
				hostname: 'preview.example.com',
				url: null,
				generation: 1,
				state: 'deploying-forever',
				requestedAt: '2026-08-12T00:00:00.000Z',
				startedAt: null,
				readyAt: null,
				expiresAt: '2026-08-12T01:00:00.000Z',
				artifact: null,
				errorCode: null
			})
		).toThrow();
	});
});
