export type VisitorFormInput = {
	name: string;
	email: string;
	message: string;
	consent: boolean;
	website: string;
};

export type VisitorFormField = 'name' | 'email' | 'message' | 'consent' | 'form';

export type VisitorFormReview = {
	status: 'invalid' | 'spam_blocked' | 'review_ready';
	values: Omit<VisitorFormInput, 'website'>;
	errors: Partial<Record<VisitorFormField, string>>;
};

export type VisitorDeliveryPlan = {
	status: 'not_connected' | 'ready_for_authorized_delivery';
	delivered: false;
	message: string;
};

function normalizeLine(value: string, maximum: number): string {
	return value.trim().replace(/\s+/g, ' ').slice(0, maximum);
}

function normalizeMessage(value: string): string {
	return value.trim().replace(/\r\n?/g, '\n').slice(0, 2_000);
}

export function reviewVisitorForm(input: VisitorFormInput): VisitorFormReview {
	const values = {
		name: normalizeLine(input.name, 80),
		email: normalizeLine(input.email, 254).toLocaleLowerCase(),
		message: normalizeMessage(input.message),
		consent: input.consent
	};
	if (input.website.trim()) {
		return {
			status: 'spam_blocked',
			values,
			errors: { form: 'This entry was blocked by the spam check.' }
		};
	}
	const errors: VisitorFormReview['errors'] = {};
	if (values.name.length < 2) errors.name = 'Enter your name using at least 2 characters.';
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
		errors.email = 'Enter a complete email address.';
	if (values.message.length < 10) errors.message = 'Write at least 10 characters.';
	if (!values.consent) errors.consent = 'Confirm that this site may use these details to reply.';
	return {
		status: Object.keys(errors).length ? 'invalid' : 'review_ready',
		values,
		errors
	};
}

export function planVisitorDelivery(
	review: VisitorFormReview,
	destinationConnected = false
): VisitorDeliveryPlan {
	if (review.status !== 'review_ready' || !destinationConnected) {
		return {
			status: 'not_connected',
			delivered: false,
			message:
				review.status === 'review_ready'
					? 'No message was sent. Delivery is not connected for this preview.'
					: 'Resolve the form issues before a delivery destination can be considered.'
		};
	}
	return {
		status: 'ready_for_authorized_delivery',
		delivered: false,
		message: 'Ready for a separately authorized delivery operation. Nothing has been sent.'
	};
}
