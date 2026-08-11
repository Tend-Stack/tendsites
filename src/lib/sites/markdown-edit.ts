export type MarkdownEditAction =
	| 'heading'
	| 'subheading'
	| 'bold'
	| 'italic'
	| 'strike'
	| 'code'
	| 'bullet-list'
	| 'ordered-list'
	| 'quote'
	| 'code-block'
	| 'divider'
	| 'link';

export interface MarkdownEditResult {
	value: string;
	selectionStart: number;
	selectionEnd: number;
}

function replaceSelection(
	value: string,
	start: number,
	end: number,
	replacement: string,
	selectedStart = 0,
	selectedLength = replacement.length
): MarkdownEditResult {
	return {
		value: value.slice(0, start) + replacement + value.slice(end),
		selectionStart: start + selectedStart,
		selectionEnd: start + selectedStart + selectedLength
	};
}

function prefixLines(selection: string, prefix: (index: number) => string): string {
	return (selection || 'List item')
		.split(/\r?\n/)
		.map((line, index) => `${prefix(index)}${line}`)
		.join('\n');
}

export function applyMarkdownEdit(
	value: string,
	selectionStart: number,
	selectionEnd: number,
	action: MarkdownEditAction
): MarkdownEditResult {
	const start = Math.max(0, Math.min(selectionStart, value.length));
	const end = Math.max(start, Math.min(selectionEnd, value.length));
	const selection = value.slice(start, end);

	const wrapped = (before: string, fallback: string, after = before) => {
		const content = selection || fallback;
		return replaceSelection(
			value,
			start,
			end,
			before + content + after,
			before.length,
			content.length
		);
	};

	if (action === 'bold') return wrapped('**', 'Bold text');
	if (action === 'italic') return wrapped('_', 'Emphasized text');
	if (action === 'strike') return wrapped('~~', 'Removed text');
	if (action === 'code') return wrapped('`', 'Code');
	if (action === 'link') {
		const label = selection || 'Link text';
		return replaceSelection(value, start, end, `[${label}](https://example.com)`, 1, label.length);
	}
	if (action === 'heading' || action === 'subheading') {
		const prefix = action === 'heading' ? '## ' : '### ';
		const content = selection || (action === 'heading' ? 'Heading' : 'Subheading');
		return replaceSelection(
			value,
			start,
			end,
			`${prefix}${content}`,
			prefix.length,
			content.length
		);
	}
	if (action === 'bullet-list' || action === 'ordered-list' || action === 'quote') {
		const replacement = prefixLines(selection, (index) =>
			action === 'ordered-list' ? `${index + 1}. ` : action === 'quote' ? '> ' : '- '
		);
		return replaceSelection(value, start, end, replacement);
	}
	if (action === 'code-block') {
		const content = selection || 'Code';
		return replaceSelection(
			value,
			start,
			end,
			`\n\n\`\`\`\n${content}\n\`\`\`\n\n`,
			5,
			content.length
		);
	}
	return replaceSelection(value, start, end, '\n\n---\n\n', 7, 0);
}
