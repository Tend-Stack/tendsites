<script lang="ts">
	import type { DemoSection } from './demo-site';
	import { planVisitorDelivery, reviewVisitorForm, type VisitorFormReview } from './visitor-form';

	let { section }: { section: DemoSection } = $props();
	const formId = $props.id();
	let name = $state('');
	let email = $state('');
	let message = $state('');
	let consent = $state(false);
	let website = $state('');
	let stage = $state<'editing' | 'review'>('editing');
	let review = $state<VisitorFormReview | null>(null);

	const delivery = $derived(review ? planVisitorDelivery(review) : null);

	function prepareReview() {
		review = reviewVisitorForm({ name, email, message, consent, website });
		if (review.status === 'review_ready') stage = 'review';
	}

	function startOver() {
		name = '';
		email = '';
		message = '';
		consent = false;
		website = '';
		review = null;
		stage = 'editing';
	}
</script>

<div class="visitor-form-shell">
	{#if stage === 'editing'}
		<form
			aria-label={section.label}
			onsubmit={(event) => {
				event.preventDefault();
				prepareReview();
			}}
		>
			{#if review?.status === 'invalid'}
				<div class="form-alert" role="alert">
					<strong>Check the highlighted fields.</strong>
					<span>Your message is still here and nothing was sent.</span>
				</div>
			{:else if review?.status === 'spam_blocked'}
				<div class="form-alert" role="alert">
					<strong>Entry blocked</strong><span>{review.errors.form}</span>
				</div>
			{/if}

			<div class="field-grid">
				<label for={`${formId}-name`}>
					<span>Name</span>
					<input
						id={`${formId}-name`}
						name="name"
						autocomplete="name"
						maxlength="80"
						aria-invalid={review?.errors.name ? 'true' : undefined}
						aria-describedby={review?.errors.name ? `${formId}-name-error` : undefined}
						bind:value={name}
					/>
					{#if review?.errors.name}<small id={`${formId}-name-error`}>{review.errors.name}</small
						>{/if}
				</label>
				<label for={`${formId}-email`}>
					<span>Email</span>
					<input
						id={`${formId}-email`}
						name="email"
						type="email"
						autocomplete="email"
						maxlength="254"
						aria-invalid={review?.errors.email ? 'true' : undefined}
						aria-describedby={review?.errors.email ? `${formId}-email-error` : undefined}
						bind:value={email}
					/>
					{#if review?.errors.email}<small id={`${formId}-email-error`}>{review.errors.email}</small
						>{/if}
				</label>
			</div>

			<label for={`${formId}-message`}>
				<span>Message</span>
				<textarea
					id={`${formId}-message`}
					name="message"
					rows="6"
					maxlength="2000"
					aria-invalid={review?.errors.message ? 'true' : undefined}
					aria-describedby={review?.errors.message ? `${formId}-message-error` : undefined}
					bind:value={message}></textarea>
				{#if review?.errors.message}<small id={`${formId}-message-error`}
						>{review.errors.message}</small
					>{/if}
			</label>

			<label class="honeypot" for={`${formId}-website`} aria-hidden="true">
				<span>Website</span>
				<input
					id={`${formId}-website`}
					name="website"
					tabindex="-1"
					autocomplete="off"
					bind:value={website}
				/>
			</label>

			<label class="consent" for={`${formId}-consent`}>
				<input
					id={`${formId}-consent`}
					name="consent"
					type="checkbox"
					aria-invalid={review?.errors.consent ? 'true' : undefined}
					aria-describedby={review?.errors.consent ? `${formId}-consent-error` : undefined}
					bind:checked={consent}
				/>
				<span>{section.formConsentLabel}</span>
			</label>
			{#if review?.errors.consent}<small id={`${formId}-consent-error`} class="consent-error"
					>{review.errors.consent}</small
				>{/if}

			<div class="form-actions">
				<button type="submit">Review message</button>
				<span>Nothing is sent from this preview.</span>
			</div>
		</form>
	{:else if review && delivery}
		<div class="review-card" aria-live="polite">
			<div class="delivery-state">
				<strong>{section.formRecipientLabel}</strong>
				<span>{delivery.message}</span>
			</div>
			<dl>
				<div>
					<dt>From</dt>
					<dd>{review.values.name} · {review.values.email}</dd>
				</div>
				<div>
					<dt>Message</dt>
					<dd>{review.values.message}</dd>
				</div>
				<div>
					<dt>Consent</dt>
					<dd>Confirmed for a reply to this message</dd>
				</div>
			</dl>
			<div class="review-actions">
				<button type="button" onclick={() => (stage = 'editing')}>Edit message</button>
				<button type="button" class="quiet" onclick={startOver}>Start over</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.visitor-form-shell {
		width: min(100%, 44rem);
		margin-top: 1.5rem;
	}
	form,
	.review-card {
		display: grid;
		gap: 1rem;
		padding: clamp(1rem, 3vw, 1.5rem);
		border: 1px solid color-mix(in srgb, var(--site-ink) 16%, transparent);
		border-radius: 1.25rem;
		background: color-mix(in srgb, var(--site-paper) 94%, var(--site-ink) 6%);
	}
	.field-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}
	label {
		display: grid;
		gap: 0.45rem;
		font-weight: 700;
	}
	input,
	textarea {
		width: 100%;
		box-sizing: border-box;
		border: 1px solid color-mix(in srgb, var(--site-ink) 22%, transparent);
		border-radius: 0.75rem;
		padding: 0.8rem 0.9rem;
		background: var(--site-paper);
		color: var(--site-ink);
		font: inherit;
	}
	textarea {
		resize: vertical;
	}
	input:focus-visible,
	textarea:focus-visible,
	button:focus-visible {
		outline: 3px solid color-mix(in srgb, var(--accent) 55%, transparent);
		outline-offset: 2px;
	}
	input[aria-invalid='true'],
	textarea[aria-invalid='true'] {
		border-color: #b5473c;
	}
	label small,
	.consent-error {
		color: #b5473c;
		font-weight: 700;
	}
	.consent {
		display: flex;
		align-items: flex-start;
		font-weight: 500;
	}
	.consent input {
		width: 1.1rem;
		height: 1.1rem;
		margin-top: 0.15rem;
		accent-color: var(--accent);
	}
	.honeypot {
		position: absolute;
		left: -10000px;
		width: 1px;
		height: 1px;
		overflow: hidden;
	}
	.form-alert,
	.delivery-state {
		display: grid;
		gap: 0.25rem;
		padding: 0.85rem 1rem;
		border-radius: 0.8rem;
		background: color-mix(in srgb, var(--accent) 12%, var(--site-paper));
	}
	.form-actions,
	.review-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.form-actions span {
		opacity: 0.68;
		font-size: 0.9rem;
	}
	button {
		border: 0;
		border-radius: 999px;
		padding: 0.75rem 1.1rem;
		background: var(--accent);
		color: #111;
		font: inherit;
		font-weight: 800;
		cursor: pointer;
	}
	button.quiet {
		border: 1px solid color-mix(in srgb, var(--site-ink) 22%, transparent);
		background: transparent;
		color: var(--site-ink);
	}
	dl,
	dl div {
		display: grid;
		gap: 0.35rem;
	}
	dl {
		margin: 0;
		gap: 1rem;
	}
	dt {
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.6;
	}
	dd {
		margin: 0;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	@media (max-width: 640px) {
		.field-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
