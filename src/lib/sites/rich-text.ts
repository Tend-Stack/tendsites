const safeLinkProtocols = new Set(['http:', 'https:', 'mailto:']);

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function renderSimpleMarkdown(value: string, footnoteIds: ReadonlySet<string>): string {
	return escapeHtml(value)
		.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
		.replace(/_([^_\n]+)_/g, '<em>$1</em>')
		.replace(/~~([^~\n]+)~~/g, '<s>$1</s>')
		.replace(/`([^`\n]+)`/g, '<code>$1</code>')
		.replace(/\[\^([a-z0-9_-]{1,32})\]/gi, (reference, id: string) =>
			footnoteIds.has(id.toLowerCase())
				? `<sup class="footnote-ref"><a href="#fn-${id.toLowerCase()}" aria-label="Footnote ${id}">${id}</a></sup>`
				: reference
		);
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

function renderInlineMarkdown(value: string, footnoteIds: ReadonlySet<string>): string {
	const linkPattern = /\[([^\]\n]{1,240})\]\(([^)\s]{1,500})\)/g;
	let cursor = 0;
	let output = '';
	for (const match of value.matchAll(linkPattern)) {
		const index = match.index ?? 0;
		output += renderSimpleMarkdown(value.slice(cursor, index), footnoteIds);
		const safeHref = normalizeRichTextLink(match[2]);
		output += safeHref
			? `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer">${renderSimpleMarkdown(match[1], footnoteIds)}</a>`
			: renderSimpleMarkdown(match[0], footnoteIds);
		cursor = index + match[0].length;
	}
	return output + renderSimpleMarkdown(value.slice(cursor), footnoteIds);
}

function tableCells(line: string): string[] {
	return line
		.trim()
		.replace(/^\|/, '')
		.replace(/\|$/, '')
		.split('|')
		.map((cell) => cell.trim());
}

function isTableDivider(line: string, columns: number): boolean {
	const cells = tableCells(line);
	return cells.length === columns && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

export function renderRichMarkdown(value: string): string {
	const footnotes = new Map<string, string>();
	const lines = value.replace(/\r\n?/g, '\n').split('\n');
	const contentLines = lines.filter((line) => {
		const definition = /^\[\^([a-z0-9_-]{1,32})\]:\s+(.+)$/i.exec(line);
		if (!definition) return true;
		footnotes.set(definition[1].toLowerCase(), definition[2]);
		return false;
	});
	const footnoteIds = new Set(footnotes.keys());
	const output: string[] = [];
	let listItems: string[] = [];
	let listKind: 'ordered' | 'unordered' | null = null;
	let orderedStart = 1;
	let quoteLines: string[] = [];
	let codeLines: string[] | null = null;
	let codeLanguage = '';
	const flushList = () => {
		if (!listItems.length) return;
		const tag = listKind === 'ordered' ? 'ol' : 'ul';
		const start = tag === 'ol' && orderedStart !== 1 ? ` start="${orderedStart}"` : '';
		output.push(
			`<${tag}${start}>${listItems.map((item) => `<li>${renderInlineMarkdown(item, footnoteIds)}</li>`).join('')}</${tag}>`
		);
		listItems = [];
		listKind = null;
	};
	const flushQuote = () => {
		if (!quoteLines.length) return;
		const callout = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]$/i.exec(quoteLines[0] ?? '');
		if (callout) {
			const kind = callout[1].toLowerCase();
			output.push(
				`<aside class="markdown-callout" data-kind="${kind}"><strong>${callout[1][0] + callout[1].slice(1).toLowerCase()}</strong>${quoteLines
					.slice(1)
					.map((line) => `<div>${renderInlineMarkdown(line, footnoteIds)}</div>`)
					.join('')}</aside>`
			);
		} else {
			output.push(
				`<blockquote>${quoteLines.map((line) => `<div>${renderInlineMarkdown(line, footnoteIds)}</div>`).join('')}</blockquote>`
			);
		}
		quoteLines = [];
	};

	for (let lineIndex = 0; lineIndex < contentLines.length; lineIndex += 1) {
		const line = contentLines[lineIndex];
		if (codeLines) {
			if (/^```\s*$/.test(line)) {
				const language = /^[a-z0-9+-]{1,24}$/i.test(codeLanguage)
					? ` data-language="${escapeHtml(codeLanguage.toLowerCase())}"`
					: '';
				output.push(`<pre${language}><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
				codeLines = null;
				codeLanguage = '';
			} else codeLines.push(line);
			continue;
		}
		const fence = /^```\s*([^\s`]*)\s*$/.exec(line);
		if (fence) {
			flushList();
			flushQuote();
			codeLines = [];
			codeLanguage = fence[1];
			continue;
		}
		const bullet = /^\s*[-*]\s+(.+)$/.exec(line);
		if (bullet) {
			flushQuote();
			if (listKind === 'ordered') flushList();
			listKind = 'unordered';
			listItems.push(bullet[1]);
			continue;
		}
		const ordered = /^\s*(\d+)\.\s+(.+)$/.exec(line);
		if (ordered) {
			flushQuote();
			if (listKind === 'unordered') flushList();
			if (!listItems.length) orderedStart = Math.max(1, Number(ordered[1]));
			listKind = 'ordered';
			listItems.push(ordered[2]);
			continue;
		}
		flushList();
		const quote = /^>\s?(.*)$/.exec(line);
		if (quote) {
			quoteLines.push(quote[1]);
			continue;
		}
		flushQuote();
		const headerCells = tableCells(line);
		if (
			line.includes('|') &&
			headerCells.length >= 2 &&
			isTableDivider(contentLines[lineIndex + 1] ?? '', headerCells.length)
		) {
			const rows: string[][] = [];
			lineIndex += 2;
			while (lineIndex < contentLines.length && contentLines[lineIndex].includes('|')) {
				const cells = tableCells(contentLines[lineIndex]);
				if (cells.length !== headerCells.length) break;
				rows.push(cells);
				lineIndex += 1;
			}
			lineIndex -= 1;
			output.push(
				`<div class="table-scroll"><table><thead><tr>${headerCells.map((cell) => `<th scope="col">${renderInlineMarkdown(cell, footnoteIds)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${renderInlineMarkdown(cell, footnoteIds)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
			);
			continue;
		}
		const heading = /^(#{1,3})\s+(.+)$/.exec(line);
		if (heading) {
			const level = heading[1].length;
			output.push(`<h${level}>${renderInlineMarkdown(heading[2], footnoteIds)}</h${level}>`);
		} else if (/^\s*(?:---|\*\*\*|___)\s*$/.test(line)) {
			output.push('<hr>');
		} else if (line.trim()) {
			output.push(`<div>${renderInlineMarkdown(line, footnoteIds)}</div>`);
		} else {
			output.push('<div><br></div>');
		}
	}
	flushList();
	flushQuote();
	if (codeLines) {
		output.push(
			`<pre><code>${escapeHtml(['```' + codeLanguage, ...codeLines].join('\n'))}</code></pre>`
		);
	}
	if (footnotes.size) {
		output.push(
			`<section class="footnotes" aria-label="Footnotes"><ol>${[...footnotes]
				.map(
					([id, definition]) =>
						`<li id="fn-${id}">${renderInlineMarkdown(definition, footnoteIds)}</li>`
				)
				.join('')}</ol></section>`
		);
	}
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
	if (tag === 's' || tag === 'del' || tag === 'strike') return `~~${content}~~`;
	if (tag === 'code') return `\`${content.replaceAll('`', '\\`')}\``;
	if (tag === 'a') {
		const href = normalizeRichTextLink(node.getAttribute('href') ?? '');
		return href ? `[${content}](${href})` : content;
	}
	if (tag === 'li') {
		if (node.parentElement?.tagName.toLowerCase() === 'ol') {
			const start = Number(node.parentElement.getAttribute('start') ?? '1');
			const index = Array.from(node.parentElement.children).indexOf(node);
			return `${Math.max(1, start) + Math.max(0, index)}. ${content.trim()}\n`;
		}
		return `- ${content.trim()}\n`;
	}
	if (tag === 'blockquote') {
		return `${(node.textContent ?? '')
			.split(/\r?\n/)
			.map((line) => `> ${line}`)
			.join('\n')}\n`;
	}
	if (tag === 'pre') return `\`\`\`\n${node.textContent ?? ''}\n\`\`\`\n`;
	if (tag === 'hr') return '---\n';
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
