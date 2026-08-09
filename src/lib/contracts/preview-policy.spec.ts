import { describe, expect, it } from 'vitest';

import {
	assessPreviewEvidence,
	type PreviewExecutionEvidence,
	type PreviewExecutionPolicy
} from './preview-policy';

const policy: PreviewExecutionPolicy = {
	contract: 'tend.host/sites-preview-policy/v1',
	policyId: 'safe-default',
	separateOrigin: true,
	panelCredentials: false,
	secrets: 'none',
	network: 'public_packages',
	maxSeconds: 300,
	maxMemoryMiB: 1024,
	maxDiskMiB: 4096,
	maxLogBytes: 1_000_000,
	ttlSeconds: 3600,
	requiredChecks: ['typecheck', 'build']
};

const evidence: PreviewExecutionEvidence = {
	contract: 'tend.host/sites-preview-execution-evidence/v1',
	previewId: '11111111-1111-4111-8111-111111111111',
	policyId: 'safe-default',
	snapshotId: '22222222-2222-4222-8222-222222222222',
	changeSetId: '33333333-3333-4333-8333-333333333333',
	artifactSha256: 'a'.repeat(64),
	previewUrl: 'https://preview-111.sites.invalid',
	startedAt: '2026-08-09T20:00:00Z',
	finishedAt: '2026-08-09T20:01:00Z',
	expiresAt: '2026-08-09T21:01:00Z',
	memoryPeakMiB: 512,
	diskPeakMiB: 1200,
	logBytes: 50_000,
	checks: [
		{
			checkId: 'typecheck',
			checkVersion: '1',
			status: 'passed',
			durationMs: 1000,
			summary: 'Types are valid',
			evidenceSha256: 'b'.repeat(64)
		},
		{
			checkId: 'build',
			checkVersion: '1',
			status: 'passed',
			durationMs: 20_000,
			summary: 'Build completed',
			evidenceSha256: 'c'.repeat(64)
		}
	]
};

describe('isolated preview evidence', () => {
	it('requires all checks while retaining deployment authority', () => {
		const result = assessPreviewEvidence(
			policy,
			evidence,
			'https://panel.tend.invalid',
			'2026-08-09T20:02:00Z'
		);
		expect(result.status).toBe('ready');
		expect(result.canDeploy).toBe(false);
	});

	it.each([
		[
			'failed',
			{
				checks: evidence.checks.map((check) =>
					check.checkId === 'build' ? { ...check, status: 'failed' as const } : check
				)
			},
			'required_check_failed_build'
		],
		[
			'unsupported',
			{
				checks: evidence.checks.map((check) =>
					check.checkId === 'build'
						? { ...check, status: 'not_supported' as const, evidenceSha256: null }
						: check
				)
			},
			'required_check_not_supported_build'
		],
		['memory overflow', { memoryPeakMiB: 1025 }, 'memory_limit_exceeded']
	])('fails on %s evidence', (_label, drift, code) => {
		const result = assessPreviewEvidence(
			policy,
			{ ...evidence, ...drift },
			'https://panel.tend.invalid',
			'2026-08-09T20:02:00Z'
		);
		expect(result.status).toBe('failed');
		expect(result.failureCodes).toContain(code);
	});

	it('rejects same-origin, duplicate checks, policy drift, and invalid expiry', () => {
		expect(() =>
			assessPreviewEvidence(
				policy,
				{ ...evidence, previewUrl: 'https://panel.tend.invalid/preview' },
				'https://panel.tend.invalid',
				'2026-08-09T20:02:00Z'
			)
		).toThrow('separate origin');
		expect(() =>
			assessPreviewEvidence(
				policy,
				{ ...evidence, checks: [evidence.checks[0], evidence.checks[0]] },
				'https://panel.tend.invalid',
				'2026-08-09T20:02:00Z'
			)
		).toThrow('duplicated');
		expect(() =>
			assessPreviewEvidence(
				policy,
				{ ...evidence, policyId: 'other' },
				'https://panel.tend.invalid',
				'2026-08-09T20:02:00Z'
			)
		).toThrow('binding');
		expect(() =>
			assessPreviewEvidence(
				policy,
				{ ...evidence, expiresAt: '2026-08-09T22:01:01Z' },
				'https://panel.tend.invalid',
				'2026-08-09T20:02:00Z'
			)
		).toThrow('exceeds policy');
	});

	it('marks immutable evidence expired without changing check history', () => {
		const result = assessPreviewEvidence(
			policy,
			evidence,
			'https://panel.tend.invalid',
			'2026-08-09T21:01:00Z'
		);
		expect(result.status).toBe('expired');
		expect(result.failureCodes).toEqual([]);
	});

	it('rejects evidence evaluated before its recorded completion', () => {
		expect(() =>
			assessPreviewEvidence(policy, evidence, 'https://panel.tend.invalid', '2026-08-09T20:00:30Z')
		).toThrow('in the future');
	});
});
