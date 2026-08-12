import { describe, expect, it } from 'vitest';

import { CreatedSiteSummarySchema, CreationServerSchema } from './host-creation';

describe('host creation bridge evidence', () => {
	it('accepts only sanitized creation-server summaries', () => {
		expect(
			CreationServerSchema.parse({
				id: 'server-one',
				name: 'Primary server',
				local: false,
				ready: true,
				reason: null
			})
		).toMatchObject({ id: 'server-one', ready: true });
		expect(() =>
			CreationServerSchema.parse({
				id: 'server-one',
				name: 'Primary server',
				local: false,
				ready: true,
				reason: null,
				host: 'private.example'
			})
		).toThrow();
	});

	it('requires versioned durable My-sites evidence', () => {
		expect(
			CreatedSiteSummarySchema.parse({
				projectId: 'site.alpha',
				name: 'Field notes',
				sourceId: 'source.alpha',
				sourceRevision: 'a'.repeat(64),
				gitCommit: 'b'.repeat(40),
				serverName: 'Primary server',
				durability: 'versioned_only',
				createdAt: '2026-08-12T04:00:00.000Z'
			})
		).toMatchObject({ projectId: 'site.alpha', durability: 'versioned_only' });
	});
});
