import { z } from 'zod';

import { IdentifierSchema, RelativeProjectPathSchema, Sha256HexSchema } from './sites';

export const LibraryItemSchema = z
	.object({
		contract: z.literal('tend.host/sites-library-item/v1'),
		kind: z.enum(['theme', 'component']),
		id: IdentifierSchema,
		name: z.string().min(1).max(100),
		version: z.string().regex(/^\d+\.\d+\.\d+$/),
		publisherId: IdentifierSchema,
		trust: z.enum(['official', 'community', 'installed']),
		adapter: z.literal('sveltekit'),
		adapterRange: z.string().regex(/^\^\d+\.\d+\.\d+$/),
		entryPath: RelativeProjectPathSchema,
		integritySha256: Sha256HexSchema,
		panelScript: z.literal(false)
	})
	.strict();

export const CertificationEvidenceSchema = z
	.object({
		contract: z.literal('tend.host/sites-library-certification/v1'),
		certificationId: z.uuid(),
		itemId: IdentifierSchema,
		itemVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
		itemIntegritySha256: Sha256HexSchema,
		repositoryId: IdentifierSchema,
		commit: z.string().regex(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/),
		archiveSha256: Sha256HexSchema,
		checks: z
			.array(
				z
					.object({
						id: z.enum(['schema', 'integrity', 'accessibility', 'responsive', 'security']),
						status: z.enum(['passed', 'failed']),
						evidenceSha256: Sha256HexSchema
					})
					.strict()
			)
			.length(5),
		certifiedAt: z.iso.datetime({ offset: true })
	})
	.strict();

export const LibraryAssessmentSchema = z
	.object({
		contract: z.literal('tend.host/sites-library-assessment/v1'),
		itemId: IdentifierSchema,
		itemVersion: z.string(),
		status: z.enum(['installable', 'blocked']),
		reasons: z.array(IdentifierSchema).max(12),
		canInstall: z.literal(false),
		blockedReason: z.literal('host_library_install_capability_required')
	})
	.strict();

export type LibraryItem = z.infer<typeof LibraryItemSchema>;
export type CertificationEvidence = z.infer<typeof CertificationEvidenceSchema>;
export type LibraryAssessment = z.infer<typeof LibraryAssessmentSchema>;

export function assessLibraryItem(
	itemInput: LibraryItem,
	evidenceInput: CertificationEvidence,
	adapterVersion = '2.0.0'
): LibraryAssessment {
	const item = LibraryItemSchema.parse(itemInput);
	const evidence = CertificationEvidenceSchema.parse(evidenceInput);
	const reasons: string[] = [];
	const parsedAdapterVersion = z
		.string()
		.regex(/^\d+\.\d+\.\d+$/)
		.parse(adapterVersion);
	const requiredMajor = Number(item.adapterRange.slice(1).split('.')[0]);
	const actualMajor = Number(parsedAdapterVersion.split('.')[0]);
	if (requiredMajor !== actualMajor) reasons.push('adapter_version_incompatible');
	if (evidence.itemId !== item.id) reasons.push('item_id_mismatch');
	if (evidence.itemVersion !== item.version) reasons.push('item_version_mismatch');
	if (evidence.itemIntegritySha256 !== item.integritySha256) reasons.push('integrity_mismatch');
	const checkIds = evidence.checks.map((check) => check.id);
	if (new Set(checkIds).size !== checkIds.length) reasons.push('duplicate_certification_check');
	for (const required of [
		'schema',
		'integrity',
		'accessibility',
		'responsive',
		'security'
	] as const) {
		const check = evidence.checks.find((candidate) => candidate.id === required);
		if (!check || check.status !== 'passed') reasons.push(`${required}_check_failed`);
	}
	return LibraryAssessmentSchema.parse({
		contract: 'tend.host/sites-library-assessment/v1',
		itemId: item.id,
		itemVersion: item.version,
		status: reasons.length === 0 ? 'installable' : 'blocked',
		reasons,
		canInstall: false,
		blockedReason: 'host_library_install_capability_required'
	});
}
