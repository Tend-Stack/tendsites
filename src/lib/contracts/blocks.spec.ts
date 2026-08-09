import { describe, expect, it } from 'vitest';
import { inspectPageBlock, movePageBlock, type BlockDefinition, type PageDocument } from './blocks';

const definition: BlockDefinition = {
	contract: 'tend.host/sites-block-definition/v1',
	id: 'split-hero',
	version: '1.0.0',
	label: 'Split Hero',
	category: 'hero',
	fields: [
		{ id: 'title', label: 'Title', kind: 'text', required: true, maxLength: 120 },
		{ id: 'layout', label: 'Layout', kind: 'choice', required: true, options: ['left', 'right'] }
	],
	responsive: true,
	panelScript: false,
	integritySha256: 'a'.repeat(64)
};
const document: PageDocument = {
	contract: 'tend.host/sites-page-document/v1',
	projectId: 'weekend-notes',
	pageId: 'home',
	locale: 'en',
	baseRevision: 'b'.repeat(64),
	blocks: [
		{
			instanceId: '11111111-1111-4111-8111-111111111111',
			definitionId: 'split-hero',
			definitionVersion: '1.0.0',
			values: { title: 'Hello', layout: 'left' }
		},
		{
			instanceId: '22222222-2222-4222-8222-222222222222',
			definitionId: 'split-hero',
			definitionVersion: '1.0.0',
			values: { title: 'Next', layout: 'right' }
		}
	]
};

describe('page block contracts', () => {
	it('inspects typed fields without write authority', () =>
		expect(inspectPageBlock(document, document.blocks[0].instanceId, [definition]).canWrite).toBe(
			false
		));
	it('supports deterministic keyboard-style reordering', () =>
		expect(movePageBlock(document, document.blocks[1].instanceId, 'up').blocks[0].instanceId).toBe(
			document.blocks[1].instanceId
		));
	it('rejects unknown fields and unavailable definitions', () => {
		expect(() =>
			inspectPageBlock(
				{
					...document,
					blocks: [
						{ ...document.blocks[0], values: { title: 'Hi', layout: 'left', script: 'bad' } }
					]
				},
				document.blocks[0].instanceId,
				[definition]
			)
		).toThrow('unknown field');
		expect(() => inspectPageBlock(document, document.blocks[0].instanceId, [])).toThrow(
			'unavailable'
		);
	});
});
