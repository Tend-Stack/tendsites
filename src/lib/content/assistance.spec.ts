import { describe, expect, it } from 'vitest';
import { inspectContentAssistance } from './assistance';
describe('local content assistance', () => {
	it('provides useful SEO and accessibility checks without applying', () => {
		const report = inspectContentAssistance('home', {
			title: 'Short',
			description: null,
			body: '[click here](/about)',
			imageAlt: ['']
		});
		expect(report.checks.filter((check) => check.status === 'attention')).toHaveLength(5);
		expect(report.canApply).toBe(false);
	});
	it('recognizes a well-formed entry', () => {
		const report = inspectContentAssistance('home', {
			title: 'A complete and useful page title',
			description:
				'A concise description that explains the page clearly for people and search engines.',
			body: '# Welcome\n[Learn about us](/about)',
			imageAlt: ['A green sprout']
		});
		expect(report.checks.every((check) => check.status === 'passed')).toBe(true);
	});
});
