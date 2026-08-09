import { describe, expect, it } from 'vitest';

import { createPublishExecutionIntent } from './publish-operation';

const input = {
	contract: 'tend.host/sites-publish-execution-intent/v1' as const,
	projectId: 'site-one',
	assignedDeploymentId: 'deployment-one',
	commitPlan: {
		contract: 'tend.host/sites-commit-plan/v1' as const,
		planId: '11111111-1111-4111-8111-111111111111',
		projectId: 'site-one',
		changeSetId: '22222222-2222-4222-8222-222222222222',
		baseRevision: 'a'.repeat(64),
		branch: 'main',
		message: 'Update home page',
		fileDigests: [{ path: 'src/routes/+page.svelte', sha256: 'b'.repeat(64) }],
		reviewedAt: '2026-08-09T20:00:00Z',
		canCommit: false as const
	},
	previewId: '33333333-3333-4333-8333-333333333333',
	previewEvidenceSha256: 'c'.repeat(64),
	approvedArtifactPlatform: 'linux/amd64',
	approval: 'explicit_user_review' as const,
	routing: 'health_gated_retain_previous' as const,
	buildPlacement: 'host_assigned' as const,
	browserCredentials: false as const
};

describe('publish execution intent', () => {
	it('requires an assigned deployment and retained rollback policy', () => {
		const intent = createPublishExecutionIntent(input);
		expect(intent.routing).toBe('health_gated_retain_previous');
		expect(intent.browserCredentials).toBe(false);
	});

	it('rejects a coherent commit plan for another project', () => {
		expect(() =>
			createPublishExecutionIntent({
				...input,
				commitPlan: { ...input.commitPlan, projectId: 'other-site' }
			})
		).toThrow('project');
	});

	it('rejects unknown routing modes and extra authority fields', () => {
		expect(() =>
			createPublishExecutionIntent({ ...input, routing: 'switch_now' as never })
		).toThrow();
		expect(() => createPublishExecutionIntent({ ...input, sshKey: 'secret' } as never)).toThrow();
	});
});
