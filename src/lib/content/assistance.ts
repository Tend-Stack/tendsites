import { z } from 'zod';
import { IdentifierSchema } from '../contracts/sites';

export const ContentAssistanceReportSchema = z
	.object({
		contract: z.literal('tend.host/sites-content-assistance/v1'),
		entryId: IdentifierSchema,
		checks: z
			.array(
				z
					.object({
						id: z.enum(['title', 'description', 'heading', 'link_text', 'image_alt']),
						status: z.enum(['passed', 'attention']),
						message: z.string().min(1).max(300)
					})
					.strict()
			)
			.length(5),
		suggestions: z
			.array(
				z
					.object({
						purpose: z.enum(['content', 'seo', 'accessibility', 'block_composition']),
						message: z.string().min(1).max(300)
					})
					.strict()
			)
			.max(20),
		canApply: z.literal(false)
	})
	.strict();

export function inspectContentAssistance(
	entryId: string,
	input: { title: string; description: string | null; body: string; imageAlt: readonly string[] }
) {
	const checks = [
		{
			id: 'title' as const,
			status:
				input.title.length >= 10 && input.title.length <= 65
					? ('passed' as const)
					: ('attention' as const),
			message: 'Use a clear title between 10 and 65 characters.'
		},
		{
			id: 'description' as const,
			status:
				!!input.description && input.description.length >= 50 && input.description.length <= 160
					? ('passed' as const)
					: ('attention' as const),
			message: 'Add a useful search description between 50 and 160 characters.'
		},
		{
			id: 'heading' as const,
			status: /^#\s+\S+/m.test(input.body) ? ('passed' as const) : ('attention' as const),
			message: 'Start the page with one clear main heading.'
		},
		{
			id: 'link_text' as const,
			status: !/\[(?:click here|read more|here)\]/i.test(input.body)
				? ('passed' as const)
				: ('attention' as const),
			message: 'Use link text that explains the destination.'
		},
		{
			id: 'image_alt' as const,
			status: input.imageAlt.every((alt) => alt.trim().length > 0)
				? ('passed' as const)
				: ('attention' as const),
			message: 'Describe meaningful images for people using assistive technology.'
		}
	];
	return ContentAssistanceReportSchema.parse({
		contract: 'tend.host/sites-content-assistance/v1',
		entryId,
		checks,
		suggestions: checks
			.filter((check) => check.status === 'attention')
			.map((check) => ({
				purpose:
					check.id === 'title' || check.id === 'description'
						? ('seo' as const)
						: ('accessibility' as const),
				message: check.message
			})),
		canApply: false
	});
}
