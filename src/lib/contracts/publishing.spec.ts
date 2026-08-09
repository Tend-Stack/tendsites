import { describe, expect, it } from 'vitest';
import {
	ArtifactIdentitySchema,
	CommitPlanSchema,
	DomainEvidenceSchema,
	decideTraffic,
	validateRecoveryMatrix
} from './publishing';
describe('publishing evidence', () => {
	it('freezes reviewed commit and build-once artifact identity', () => {
		expect(
			CommitPlanSchema.parse({
				contract: 'tend.host/sites-commit-plan/v1',
				planId: '11111111-1111-4111-8111-111111111111',
				projectId: 'site',
				changeSetId: '22222222-2222-4222-8222-222222222222',
				baseRevision: 'a'.repeat(64),
				branch: 'main',
				message: 'Update home',
				fileDigests: [{ path: 'src/home.md', sha256: 'b'.repeat(64) }],
				reviewedAt: '2026-08-09T20:00:00Z',
				canCommit: false
			}).canCommit
		).toBe(false);
		expect(
			ArtifactIdentitySchema.parse({
				contract: 'tend.host/sites-artifact-identity/v1',
				artifactSha256: 'a'.repeat(64),
				commitSha256: 'b'.repeat(64),
				recipeSha256: 'c'.repeat(64),
				platform: 'linux/amd64',
				sbomSha256: 'd'.repeat(64),
				provenanceSha256: 'e'.repeat(64),
				builtAt: '2026-08-09T20:00:00Z'
			}).platform
		).toBe('linux/amd64');
	});
	it('never routes a failed or incomplete candidate', () => {
		expect(
			decideTraffic(
				'33333333-3333-4333-8333-333333333333',
				'a'.repeat(64),
				'b'.repeat(64),
				'passed',
				3,
				3
			).decision
		).toBe('switch');
		expect(
			decideTraffic(
				'33333333-3333-4333-8333-333333333333',
				'a'.repeat(64),
				'b'.repeat(64),
				'passed',
				3,
				2
			).decision
		).toBe('retain_previous');
	});
	it('requires coherent DNS and TLS evidence', () =>
		expect(() =>
			DomainEvidenceSchema.parse({
				contract: 'tend.host/sites-domain-evidence/v1',
				projectId: 'site',
				hostname: 'www.example.com',
				ownership: 'verified',
				dnsSha256: null,
				tls: 'pending',
				certificateSha256: null,
				canAssign: false
			})
		).toThrow());
	it('requires each outage class exactly once', () => {
		const policies = [
			'provider',
			'queue',
			'worker',
			'registry',
			'destination',
			'acknowledgement'
		].map((dependency) => ({
			dependency,
			acceptedWork: 'reconcile',
			retry: 'after_authoritative_recovery',
			customerState: 'online_unchanged'
		}));
		expect(
			validateRecoveryMatrix({ contract: 'tend.host/sites-recovery-matrix/v1', policies } as never)
				.policies
		).toHaveLength(6);
		expect(() =>
			validateRecoveryMatrix({
				contract: 'tend.host/sites-recovery-matrix/v1',
				policies: policies.map((p) => ({ ...p, dependency: 'provider' }))
			} as never)
		).toThrow();
	});
});
