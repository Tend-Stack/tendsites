import { describe, expect, it } from 'vitest';
import { parseMarkdownDocument, serializeMarkdownDocument } from './markdown';
describe('portable Markdown content adapter', () => {
	it('round-trips deterministic JSON frontmatter and body', () => {
		const source = '---\ntitle: "Hello"\ndraft: false\ntags: ["notes","travel"]\n---\n# Hello\n';
		const document = parseMarkdownDocument(source);
		expect(document.frontmatter.title).toBe('Hello');
		expect(parseMarkdownDocument(serializeMarkdownDocument(document))).toEqual(document);
	});
	it('accepts body-only Markdown', () =>
		expect(parseMarkdownDocument('# Hello').body).toBe('# Hello'));
	it('rejects duplicate keys, unsafe keys, malformed values, and unterminated evidence', () => {
		expect(() => parseMarkdownDocument('---\ntitle: "One"\ntitle: "Two"\n---\n')).toThrow('unique');
		expect(() => parseMarkdownDocument('---\n../bad: true\n---\n')).toThrow();
		expect(() => parseMarkdownDocument('---\ntitle: unquoted\n---\n')).toThrow('canonical JSON');
		expect(() => parseMarkdownDocument('---\ntitle: "Oops"')).toThrow('terminated');
	});
});
