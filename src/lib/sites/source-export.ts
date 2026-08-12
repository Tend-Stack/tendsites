import { strToU8, zipSync } from 'fflate';

import { cloneDemoSite, type DemoSite } from './demo-site';

export const PORTABLE_SOURCE_CONTRACT = 'tend-sites/portable-source/v1' as const;
export const MAX_EXPORT_ASSETS = 96;
export const MAX_EXPORT_ASSET_BYTES = 5_000_000;
export const MAX_EXPORT_TOTAL_ASSET_BYTES = 30_000_000;

export type PortableAssetRequest = {
	reference: string;
	label: string;
	source: 'bundled' | 'device_upload' | 'host_files' | 'unknown';
};

export type PortableAsset = {
	bytes: Uint8Array;
	mimeType: string;
};

export type PortableSourceResult = {
	archive: Uint8Array;
	filename: string;
	fileCount: number;
	assetCount: number;
	totalAssetBytes: number;
	warnings: string[];
};

type AssetOccurrence = PortableAssetRequest & {
	apply: (portablePath: string | undefined) => void;
};

type AssetGroup = PortableAssetRequest & {
	apply: Array<(portablePath: string | undefined) => void>;
};

const supportedMimeTypes = new Map([
	['image/avif', 'avif'],
	['image/gif', 'gif'],
	['image/jpeg', 'jpg'],
	['image/png', 'png'],
	['image/svg+xml', 'svg'],
	['image/webp', 'webp']
]);

function safeSlug(value: string, fallback: string): string {
	const slug = value
		.normalize('NFKD')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 72);
	return slug || fallback;
}

function yamlString(value: string): string {
	return JSON.stringify(value.replace(/\r\n?/g, '\n'));
}

function markdownImage(image: string | undefined, alt: string | undefined): string {
	return image ? `\n\n![${(alt ?? '').replace(/[\[\]]/g, '')}](${image})` : '';
}

function pageMarkdown(site: DemoSite, pageIndex: number): string {
	const page = site.pages[pageIndex];
	const sections = page.sections
		.map(
			(section) =>
				`## ${section.title}\n\n${section.eyebrow ? `_${section.eyebrow}_\n\n` : ''}${section.body}${markdownImage(section.image, section.imageAlt)}`
		)
		.join('\n\n---\n\n');
	return `---\ntitle: ${yamlString(page.name)}\nslug: ${yamlString(page.slug)}\ndescription: ${yamlString(page.seo.description)}\nindex: ${page.seo.index}\nfollow: ${page.seo.follow}\n---\n\n${sections}\n`;
}

function postMarkdown(site: DemoSite, collectionIndex: number, postIndex: number): string {
	const collection = site.collections[collectionIndex];
	const post = collection.items[postIndex];
	return `---\ntitle: ${yamlString(post.title)}\nslug: ${yamlString(post.slug)}\nsummary: ${yamlString(post.summary)}\nauthor: ${yamlString(post.author)}\nstatus: ${yamlString(post.status)}\nfeatured: ${post.featured}\npublishedAt: ${post.publishedAt ? yamlString(post.publishedAt) : 'null'}\nscheduledAt: ${post.scheduledAt ? yamlString(post.scheduledAt) : 'null'}\ntags: ${JSON.stringify(post.tags)}\nrelated: ${JSON.stringify(post.relatedPostIds)}\ncoverImage: ${post.coverImage ? yamlString(post.coverImage) : 'null'}\ncoverImageAlt: ${post.coverImageAlt ? yamlString(post.coverImageAlt) : 'null'}\n---\n\n${post.body}\n`;
}

function collectOccurrences(site: DemoSite): AssetOccurrence[] {
	const occurrences: AssetOccurrence[] = [];
	const add = (
		reference: string | undefined,
		label: string,
		source: PortableAssetRequest['source'],
		apply: (portablePath: string | undefined) => void
	) => {
		if (!reference) return;
		occurrences.push({ reference, label, source, apply });
	};

	add(site.seo.favicon, 'site favicon', 'unknown', (value) => {
		if (value) site.seo.favicon = value;
		else delete site.seo.favicon;
	});
	for (const page of site.pages) {
		add(page.seo.socialImage, `${page.name} social image`, 'unknown', (value) => {
			if (value) page.seo.socialImage = value;
			else delete page.seo.socialImage;
		});
		for (const section of page.sections) {
			add(section.image, `${page.name} ${section.label}`, 'bundled', (value) => {
				if (value) section.image = value;
				else delete section.image;
			});
		}
	}
	for (const collection of site.collections) {
		for (const post of collection.items) {
			const source = post.coverImageSource?.kind ?? 'bundled';
			add(post.coverImage, `${post.title} cover`, source, (value) => {
				if (value) post.coverImage = value;
				else delete post.coverImage;
			});
			add(post.seo.socialImage, `${post.title} social image`, source, (value) => {
				if (value) post.seo.socialImage = value;
				else delete post.seo.socialImage;
			});
		}
	}
	return occurrences;
}

function groupOccurrences(occurrences: AssetOccurrence[]): AssetGroup[] {
	const groups = new Map<string, AssetGroup>();
	for (const occurrence of occurrences) {
		const existing = groups.get(occurrence.reference);
		if (existing) {
			existing.apply.push(occurrence.apply);
			if (existing.source === 'unknown') existing.source = occurrence.source;
			continue;
		}
		groups.set(occurrence.reference, {
			reference: occurrence.reference,
			label: occurrence.label,
			source: occurrence.source,
			apply: [occurrence.apply]
		});
	}
	return [...groups.values()];
}

function readme(site: DemoSite): string {
	return `# ${site.name}\n\nThis archive is ordinary, adapter-neutral source exported from TEND Sites. It does not require TEND Sites at runtime.\n\n## Contents\n\n- \`site.json\` — the complete structured site document.\n- \`content/pages\` — portable Markdown for each page.\n- \`content/posts\` — portable Markdown for each collection entry.\n- \`assets\` — media copied into the archive when it could be safely resolved.\n- \`EXPORT-REPORT.md\` — export evidence and any media that needs attention.\n\nA framework adapter can use \`site.json\` as the canonical input or import the Markdown files into an existing project.\n`;
}

export async function createPortableSource(
	sourceSite: DemoSite,
	resolveAsset: (request: PortableAssetRequest) => Promise<PortableAsset | null>,
	now: () => Date = () => new Date()
): Promise<PortableSourceResult> {
	const site = cloneDemoSite(sourceSite);
	const groups = groupOccurrences(collectOccurrences(site));
	if (groups.length > MAX_EXPORT_ASSETS) {
		throw new Error(
			`This site uses more than ${MAX_EXPORT_ASSETS} unique images. Remove some and try again.`
		);
	}

	const files: Record<string, Uint8Array> = {};
	const warnings: string[] = [];
	let assetCount = 0;
	let totalAssetBytes = 0;
	for (let index = 0; index < groups.length; index += 1) {
		const group = groups[index];
		let asset: PortableAsset | null = null;
		try {
			asset = await resolveAsset({
				reference: group.reference,
				label: group.label,
				source: group.source
			});
		} catch {
			asset = null;
		}
		const extension = asset ? supportedMimeTypes.get(asset.mimeType.toLowerCase()) : undefined;
		if (!asset || !extension || asset.bytes.byteLength === 0) {
			group.apply.forEach((apply) => apply(undefined));
			warnings.push(
				`${group.label}: the image could not be copied and its private reference was omitted.`
			);
			continue;
		}
		if (asset.bytes.byteLength > MAX_EXPORT_ASSET_BYTES) {
			group.apply.forEach((apply) => apply(undefined));
			warnings.push(`${group.label}: the image is larger than the 5 MB portable export limit.`);
			continue;
		}
		if (totalAssetBytes + asset.bytes.byteLength > MAX_EXPORT_TOTAL_ASSET_BYTES) {
			group.apply.forEach((apply) => apply(undefined));
			warnings.push(`${group.label}: the archive reached its 30 MB media limit.`);
			continue;
		}
		const stem = safeSlug(group.label, `image-${index + 1}`);
		const path = `assets/${String(index + 1).padStart(2, '0')}-${stem}.${extension}`;
		files[path] = asset.bytes;
		group.apply.forEach((apply) => apply(`/${path}`));
		assetCount += 1;
		totalAssetBytes += asset.bytes.byteLength;
	}
	for (const collection of site.collections) {
		for (const post of collection.items) delete post.coverImageSource;
	}

	const generatedAt = now().toISOString();
	files['site.json'] = strToU8(
		`${JSON.stringify({ contract: PORTABLE_SOURCE_CONTRACT, generatedAt, site }, null, 2)}\n`
	);
	files['README.md'] = strToU8(readme(site));
	for (let index = 0; index < site.pages.length; index += 1) {
		const page = site.pages[index];
		const slug = page.slug === '/' ? 'home' : safeSlug(page.slug, `page-${index + 1}`);
		files[`content/pages/${slug}.md`] = strToU8(pageMarkdown(site, index));
	}
	for (let collectionIndex = 0; collectionIndex < site.collections.length; collectionIndex += 1) {
		const collection = site.collections[collectionIndex];
		const collectionSlug = safeSlug(collection.slug, `collection-${collectionIndex + 1}`);
		for (let postIndex = 0; postIndex < collection.items.length; postIndex += 1) {
			const post = collection.items[postIndex];
			files[`content/posts/${collectionSlug}/${safeSlug(post.slug, `post-${postIndex + 1}`)}.md`] =
				strToU8(postMarkdown(site, collectionIndex, postIndex));
		}
	}
	const report = [
		'# Export report',
		'',
		`Generated: ${generatedAt}`,
		`Pages: ${site.pages.length}`,
		`Entries: ${site.collections.reduce((total, collection) => total + collection.items.length, 0)}`,
		`Copied media: ${assetCount}`,
		'',
		warnings.length ? '## Needs attention' : 'All referenced media was copied into the archive.',
		...(warnings.length ? ['', ...warnings.map((warning) => `- ${warning}`)] : []),
		''
	].join('\n');
	files['EXPORT-REPORT.md'] = strToU8(report);

	const archive = zipSync(files, { level: 6 });
	return {
		archive,
		filename: `${safeSlug(site.name, 'site')}-source.zip`,
		fileCount: Object.keys(files).length,
		assetCount,
		totalAssetBytes,
		warnings
	};
}
