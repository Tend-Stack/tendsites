import { describe, expect, it } from 'vitest';

import { createRepositoryInspectionIntent } from './repository-inspection';

const input = {
	contract: 'tend.host/sites-repository-inspection-intent/v1' as const,
	projectId: 'existing-site',
	providerConnectionId: 'provider-installation',
	repositoryId: 'repository-42',
	ref: 'refs/heads/main',
	policy: {
		contract: 'tend.host/sites-adoption-policy/v1' as const,
		maxFiles: 20_000,
		maxArchiveBytes: 100_000_000,
		allowSubmodules: false,
		allowLfsPointers: false,
		allowPrivateDependencies: false,
		allowUntrustedSource: false
	},
	checkout: 'host_bounded_disposable' as const,
	credentialDelivery: 'host_only' as const,
	packageScripts: 'disabled' as const,
	productionDestinationAvailable: false as const
};

describe('repository inspection intent', () => {
	it('selects opaque host-owned coordinates without accepting a clone URL', () => {
		const intent = createRepositoryInspectionIntent(input);
		expect(intent.checkout).toBe('host_bounded_disposable');
		expect(intent).not.toHaveProperty('url');
		expect(intent.credentialDelivery).toBe('host_only');
	});

	it.each(['-upload-pack=evil', 'main\nother', ''])('rejects unsafe ref %j', (ref) => {
		expect(() => createRepositoryInspectionIntent({ ...input, ref })).toThrow();
	});

	it('forbids unbounded or secret-bearing policy drift', () => {
		expect(() =>
			createRepositoryInspectionIntent({
				...input,
				policy: { ...input.policy, maxFiles: 1_000_001 }
			})
		).toThrow();
	});
});
