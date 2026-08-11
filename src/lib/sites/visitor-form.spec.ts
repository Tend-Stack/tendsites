import { describe, expect, it } from 'vitest';

import { planVisitorDelivery, reviewVisitorForm } from './visitor-form';

const valid = {
	name: '  Willow   Hart ',
	email: ' HELLO@EXAMPLE.COM ',
	message: '  I would like to learn more.  ',
	consent: true,
	website: ''
};

describe('visitor form review', () => {
	it('normalizes a bounded entry without claiming delivery', () => {
		const review = reviewVisitorForm(valid);
		expect(review).toMatchObject({
			status: 'review_ready',
			values: { name: 'Willow Hart', email: 'hello@example.com' },
			errors: {}
		});
		expect(planVisitorDelivery(review)).toEqual({
			status: 'not_connected',
			delivered: false,
			message: 'No message was sent. Delivery is not connected for this preview.'
		});
	});

	it('reports accessible field-specific validation', () => {
		const review = reviewVisitorForm({
			name: 'x',
			email: 'missing-domain',
			message: 'short',
			consent: false,
			website: ''
		});
		expect(review.status).toBe('invalid');
		expect(Object.keys(review.errors)).toEqual(['name', 'email', 'message', 'consent']);
	});

	it('blocks a filled honeypot without retaining it', () => {
		const review = reviewVisitorForm({ ...valid, website: 'https://spam.example' });
		expect(review.status).toBe('spam_blocked');
		expect(review.values).not.toHaveProperty('website');
	});

	it('requires separate delivery authorization even when connected', () => {
		const plan = planVisitorDelivery(reviewVisitorForm(valid), true);
		expect(plan.status).toBe('ready_for_authorized_delivery');
		expect(plan.delivered).toBe(false);
	});
});
