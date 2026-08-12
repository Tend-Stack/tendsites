import { describe, expect, it } from 'vitest';

import { normalizeRichTextLink, renderRichMarkdown } from './rich-text';

describe('rich text Markdown', () => {
	it('renders portable formatting without allowing raw HTML', () => {
		const rendered = renderRichMarkdown(
			'## A **clear** _story_\n\n~~Old wording~~ and `portable code`\n<script>alert(1)</script>'
		);

		expect(rendered).toContain('<h2>A <strong>clear</strong> <em>story</em></h2>');
		expect(rendered).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
		expect(rendered).toContain('<s>Old wording</s>');
		expect(rendered).toContain('<code>portable code</code>');
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

	it('renders ordered lists, quotes, fenced code and dividers as safe blocks', () => {
		const rendered = renderRichMarkdown(
			'3. Third\n4. Fourth\n\n> A useful **aside**\n\n```js\nconst tag = "<script>";\n```\n\n---'
		);

		expect(rendered).toContain('<ol start="3"><li>Third</li><li>Fourth</li></ol>');
		expect(rendered).toContain(
			'<blockquote><div>A useful <strong>aside</strong></div></blockquote>'
		);
		expect(rendered).toContain(
			'<pre data-language="js"><code>const tag = &quot;&lt;script&gt;&quot;;</code></pre>'
		);
		expect(rendered).toContain('<hr>');
		expect(rendered).not.toContain('<script>');
	});

	it('renders safe portable tables, callouts, and footnotes', () => {
		const rendered = renderRichMarkdown(
			'| Place | Note |\n| --- | --- |\n| Lake | **Quiet** |\n\n> [!TIP]\n> Leave before sunrise.\n\nPack lightly[^route].\n\n[^route]: Check the <script>weather</script>.'
		);

		expect(rendered).toContain('<div class="table-scroll"><table>');
		expect(rendered).toContain('<th scope="col">Place</th>');
		expect(rendered).toContain('<td><strong>Quiet</strong></td>');
		expect(rendered).toContain(
			'<aside class="markdown-callout" data-kind="tip"><strong>Tip</strong>'
		);
		expect(rendered).toContain('href="#fn-route"');
		expect(rendered).toContain('<section class="footnotes" aria-label="Footnotes">');
		expect(rendered).toContain('&lt;script&gt;weather&lt;/script&gt;');
		expect(rendered).not.toContain('<script>');
	});

	it('leaves malformed advanced structures inert', () => {
		const rendered = renderRichMarkdown(
			'| One | Two |\n| -- | --- |\n\n> [!SCRIPT]\n> unsafe\n\nMissing[^unknown]'
		);
		expect(rendered).not.toContain('<table>');
		expect(rendered).not.toContain('markdown-callout');
		expect(rendered).toContain('Missing[^unknown]');
	});
});
