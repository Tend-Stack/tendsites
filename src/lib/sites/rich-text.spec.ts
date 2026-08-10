import { describe, expect, it } from 'vitest';

import { normalizeRichTextLink, renderRichMarkdown } from './rich-text';

describe('rich text Markdown', () => {
	it('renders portable formatting without allowing raw HTML', () => {
		const rendered = renderRichMarkdown('## A **clear** _story_\n\n<script>alert(1)</script>');

		expect(rendered).toContain('<h2>A <strong>clear</strong> <em>story</em></h2>');
		expect(rendered).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
		expect(rendered).not.toContain('<script>');
	});

	it('renders safe links and leaves unsafe destinations inert', () => {
		const rendered = renderRichMarkdown(
			'[Guide](https://example.com/docs) [Bad](javascript:alert(1))'
		);

		expect(rendered).toContain('href="https://example.com/docs"');
		expect(rendered).not.toContain('href="javascript:');
		expect(rendered).toContain('[Bad](javascript:alert(1))');
	});

	it('accepts web, email and site-local destinations only', () => {
		expect(normalizeRichTextLink('https://example.com')).toBe('https://example.com/');
		expect(normalizeRichTextLink('mailto:hello@example.com')).toBe('mailto:hello@example.com');
		expect(normalizeRichTextLink('/journal')).toBe('/journal');
		expect(normalizeRichTextLink('javascript:alert(1)')).toBeNull();
		expect(normalizeRichTextLink('data:text/html,hello')).toBeNull();
	});

	it('renders bullet lists as structured content', () => {
		expect(renderRichMarkdown('- First\n- **Second**')).toBe(
			'<ul><li>First</li><li><strong>Second</strong></li></ul>'
		);
	});
});
