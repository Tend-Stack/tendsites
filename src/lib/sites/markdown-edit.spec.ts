import { describe, expect, it } from 'vitest';

import { applyMarkdownEdit } from './markdown-edit';

describe('Markdown editor actions', () => {
	it('wraps selected inline text and keeps it selected', () => {
		const result = applyMarkdownEdit('A clear story', 2, 7, 'bold');

		expect(result).toEqual({
			value: 'A **clear** story',
			selectionStart: 4,
			selectionEnd: 9
		});
	});

	it('creates ordered lists from multiple lines', () => {
		expect(applyMarkdownEdit('First\nSecond', 0, 12, 'ordered-list').value).toBe(
			'1. First\n2. Second'
		);
	});

	it('inserts portable block structures without executable markup', () => {
		expect(applyMarkdownEdit('const safe = true;', 0, 18, 'code-block').value).toBe(
			'\n\n```\nconst safe = true;\n```\n\n'
		);
		expect(applyMarkdownEdit('Before', 6, 6, 'divider').value).toBe('Before\n\n---\n\n');
	});
});
