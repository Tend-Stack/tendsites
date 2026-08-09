import { z } from 'zod';
import { IdentifierSchema, JsonValueSchema, type JsonValue } from '../contracts/sites';

export const MarkdownDocumentSchema = z
	.object({
		contract: z.literal('tend.host/sites-markdown-document/v1'),
		frontmatter: z.record(IdentifierSchema, JsonValueSchema),
		body: z.string().max(1_000_000)
	})
	.strict();
export type MarkdownDocument = z.infer<typeof MarkdownDocumentSchema>;

export function parseMarkdownDocument(source: string): MarkdownDocument {
	if (source.length > 1_100_000) throw new Error('Markdown document is too large');
	if (!source.startsWith('---\n'))
		return MarkdownDocumentSchema.parse({
			contract: 'tend.host/sites-markdown-document/v1',
			frontmatter: {},
			body: source
		});
	const end = source.indexOf('\n---\n', 4);
	if (end < 0) throw new Error('Markdown frontmatter is not terminated');
	const frontmatter: Record<string, JsonValue> = {};
	for (const line of source.slice(4, end).split('\n')) {
		if (!line.trim()) continue;
		const separator = line.indexOf(':');
		if (separator < 1) throw new Error('Frontmatter line is invalid');
		const key = IdentifierSchema.parse(line.slice(0, separator).trim());
		if (key in frontmatter) throw new Error('Frontmatter keys must be unique');
		const encoded = line.slice(separator + 1).trim();
		try {
			frontmatter[key] = JsonValueSchema.parse(JSON.parse(encoded));
		} catch {
			throw new Error(`Frontmatter value must be canonical JSON: ${key}`);
		}
	}
	return MarkdownDocumentSchema.parse({
		contract: 'tend.host/sites-markdown-document/v1',
		frontmatter,
		body: source.slice(end + 5)
	});
}

export function serializeMarkdownDocument(input: MarkdownDocument): string {
	const document = MarkdownDocumentSchema.parse(input);
	const keys = Object.keys(document.frontmatter).sort();
	if (!keys.length) return document.body;
	return `---\n${keys.map((key) => `${key}: ${JSON.stringify(document.frontmatter[key])}`).join('\n')}\n---\n${document.body}`;
}
