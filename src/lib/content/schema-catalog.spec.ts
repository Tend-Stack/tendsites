import { describe, expect, it } from 'vitest';

import {
	ContentSchemaCatalogSchema,
	ReviewedEditorBlockSchema,
	importGitCmsConfiguration,
	profileCollectionsFromCatalog
} from './schema-catalog';

const config = {
	backend: { name: 'github', repo: 'private/example' },
	publish_mode: 'editorial_workflow',
	site_url: 'https://example.invalid',
	collections: [
		{
			name: 'posts',
			label: 'Blog posts',
			folder: 'src/content/posts',
			create: true,
			fields: [
				{ name: 'title', label: 'Title', widget: 'string' },
				{ name: 'date', label: 'Publish date', widget: 'datetime' },
				{ name: 'cover', label: 'Cover image', widget: 'image', required: false },
				{ name: 'body', label: 'Story', widget: 'markdown' }
			]
		}
	]
};

describe('declarative content schema catalog', () => {
	it('imports common Git-CMS fields while discarding provider authority', () => {
		const result = importGitCmsConfiguration(config);
		expect(result).toMatchObject({
			ignoredAuthorityKeys: ['backend', 'publish_mode', 'site_url'],
			canWriteRepository: false,
			catalog: { authority: 'none', reviewRequired: true }
		});
		expect(result.catalog.forms[0]).toMatchObject({
			collection: {
				id: 'posts',
				kind: 'posts',
				directory: 'src/content/posts',
				format: 'markdown',
				titleField: 'title',
				bodyField: 'body'
			},
			fields: [
				{ name: 'title', widget: 'string', required: true },
				{ name: 'date', widget: 'datetime', required: true },
				{ name: 'cover', widget: 'image', required: false },
				{ name: 'body', widget: 'markdown', required: true }
			]
		});
		expect(profileCollectionsFromCatalog(result.catalog)).toEqual([
			result.catalog.forms[0].collection
		]);
	});

	it('rejects unsafe folders, unknown widgets, and malformed select fields', () => {
		expect(() =>
			importGitCmsConfiguration({
				...config,
				collections: [{ ...config.collections[0], folder: '../posts' }]
			})
		).toThrow();
		expect(() =>
			importGitCmsConfiguration({
				...config,
				collections: [{ ...config.collections[0], fields: [{ name: 'raw', widget: 'code' }] }]
			})
		).toThrow('Unsupported imported widget');
		expect(() =>
			importGitCmsConfiguration({
				...config,
				collections: [{ ...config.collections[0], fields: [{ name: 'theme', widget: 'select' }] }]
			})
		).toThrow('require options');
	});

	it('rejects duplicate field names and extra authority in the normalized catalog', () => {
		expect(() =>
			importGitCmsConfiguration({
				...config,
				collections: [{ ...config.collections[0], fields: [{ name: 'title' }, { name: 'title' }] }]
			})
		).toThrow('unique');
		const imported = importGitCmsConfiguration(config).catalog;
		expect(() =>
			ContentSchemaCatalogSchema.parse({ ...imported, backend: { name: 'github' } })
		).toThrow();
	});

	it('allows only reviewed declarative blocks with no executable script authority', () => {
		const block = {
			id: 'youtube',
			label: 'YouTube video',
			shortcode: 'youtube',
			fields: [
				{
					name: 'url',
					label: 'Video link',
					widget: 'string',
					required: true,
					hint: null,
					options: []
				}
			],
			reviewSha256: 'a'.repeat(64),
			allowsScript: false
		};
		expect(ReviewedEditorBlockSchema.parse(block)).toEqual(block);
		expect(() => ReviewedEditorBlockSchema.parse({ ...block, allowsScript: true })).toThrow();
		expect(() => ReviewedEditorBlockSchema.parse({ ...block, script: 'alert(1)' })).toThrow();
	});
});
