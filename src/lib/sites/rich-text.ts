const safeLinkProtocols = new Set(['http:', 'https:', 'mailto:']);

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function renderSimpleMarkdown(value: string): string {
	return escapeHtml(value)
		.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
		.replace(/_([^_\n]+)_/g, '<em>$1</em>');
}

export function normalizeRichTextLink(value: string): string | null {
	const trimmed = value.trim();
	if (!trimmed) return null;
	if (trimmed.startsWith('/')) return trimmed;
	try {
		const parsed = new URL(trimmed);
		return safeLinkProtocols.has(parsed.protocol) ? parsed.href : null;
	} catch {
		return null;
	}
}

function renderInlineMarkdown(value: string): string {
	const linkPattern = /\[([^\]\n]{1,240})\]\(([^)\s]{1,500})\)/g;
	let cursor = 0;
	let output = '';
	for (const match of value.matchAll(linkPattern)) {
		const index = match.index ?? 0;
		output += renderSimpleMarkdown(value.slice(cursor, index));
		const safeHref = normalizeRichTextLink(match[2]);
		output += safeHref
			? `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer">${renderSimpleMarkdown(match[1])}</a>`
			: renderSimpleMarkdown(match[0]);
		cursor = index + match[0].length;
	}
	return output + renderSimpleMarkdown(value.slice(cursor));
}

export function renderRichMarkdown(value: string): string {
	const output: string[] = [];
	let listItems: string[] = [];
	const flushList = () => {
		if (!listItems.length) return;
		output.push(
			`<ul>${listItems.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</ul>`
		);
		listItems = [];
	};

	for (const line of value.replace(/\r\n?/g, '\n').split('\n')) {
		const bullet = /^\s*[-*]\s+(.+)$/.exec(line);
		if (bullet) {
			listItems.push(bullet[1]);
			continue;
		}
		flushList();
		const heading = /^(#{1,3})\s+(.+)$/.exec(line);
		if (heading) {
			const level = heading[1].length;
			output.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
		} else if (line.trim()) {
			output.push(`<div>${renderInlineMarkdown(line)}</div>`);
		} else {
			output.push('<div><br></div>');
		}
	}
	flushList();
	return output.join('');
}

function serializeNode(node: Node): string {
	if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
	if (!(node instanceof HTMLElement)) return '';
	const content = Array.from(node.childNodes).map(serializeNode).join('');
	const tag = node.tagName.toLowerCase();
	if (tag === 'br') return '\n';
	if (tag === 'strong' || tag === 'b') return `**${content}**`;
	if (tag === 'em' || tag === 'i') return `_${content}_`;
	if (tag === 'a') {
		const href = normalizeRichTextLink(node.getAttribute('href') ?? '');
		return href ? `[${content}](${href})` : content;
	}
	if (tag === 'li') return `- ${content.trim()}\n`;
	if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
		return `${'#'.repeat(Number(tag.slice(1)))} ${content.trim()}\n`;
	}
	if (tag === 'div' || tag === 'p' || tag === 'ul' || tag === 'ol') return `${content}\n`;
	return content;
}

export function richElementToMarkdown(element: HTMLElement): string {
	return Array.from(element.childNodes)
		.map(serializeNode)
		.join('')
		.replace(/\u00a0/g, ' ')
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}
