import { z } from 'zod';
import { IdentifierSchema, Sha256HexSchema } from './sites';

export const PreviewLeaseSchema = z
	.object({
		contract: z.literal('tend.host/sites-preview-lease/v1'),
		previewId: z.uuid(),
		projectId: IdentifierSchema,
		snapshotSha256: Sha256HexSchema,
		generation: z.number().int().min(1),
		state: z.enum(['queued', 'running', 'ready', 'failed', 'expired', 'superseded', 'cleaned']),
		issuedAt: z.iso.datetime({ offset: true }),
		expiresAt: z.iso.datetime({ offset: true }),
		supersededBy: z.uuid().nullable(),
		cleanupEvidenceSha256: Sha256HexSchema.nullable()
	})
	.strict()
	.superRefine((value, context) => {
		if (Date.parse(value.expiresAt) <= Date.parse(value.issuedAt))
			context.addIssue({ code: 'custom', message: 'Preview lease must have a positive window' });
		if ((value.state === 'superseded') !== (value.supersededBy !== null))
			context.addIssue({
				code: 'custom',
				message: 'Preview supersession evidence is inconsistent'
			});
		if ((value.state === 'cleaned') !== (value.cleanupEvidenceSha256 !== null))
			context.addIssue({ code: 'custom', message: 'Preview cleanup evidence is inconsistent' });
	});
export type PreviewLease = z.infer<typeof PreviewLeaseSchema>;

export function supersedePreview(
	currentInput: PreviewLease,
	replacementInput: PreviewLease,
	at: string
): PreviewLease {
	const current = PreviewLeaseSchema.parse(currentInput);
	const replacement = PreviewLeaseSchema.parse(replacementInput);
	const time = Date.parse(z.iso.datetime({ offset: true }).parse(at));
	if (
		current.projectId !== replacement.projectId ||
		replacement.generation !== current.generation + 1
	)
		throw new Error('Preview replacement binding is invalid');
	if (['cleaned', 'superseded'].includes(current.state))
		throw new Error('Terminal preview cannot be superseded');
	if (time < Date.parse(replacement.issuedAt))
		throw new Error('Preview supersession precedes replacement');
	return PreviewLeaseSchema.parse({
		...current,
		state: 'superseded',
		supersededBy: replacement.previewId
	});
}

export function planPreviewCleanup(leaseInput: PreviewLease, at: string) {
	const lease = PreviewLeaseSchema.parse(leaseInput);
	const time = Date.parse(z.iso.datetime({ offset: true }).parse(at));
	const eligible =
		lease.state === 'superseded' ||
		lease.state === 'failed' ||
		lease.state === 'expired' ||
		time >= Date.parse(lease.expiresAt);
	return {
		contract: 'tend.host/sites-preview-cleanup-plan/v1' as const,
		previewId: lease.previewId,
		eligible,
		canCleanup: false as const,
		blockedReason: 'host_preview_cleanup_capability_required' as const
	};
}
