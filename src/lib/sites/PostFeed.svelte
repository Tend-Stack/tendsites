<script lang="ts">
	import { ArrowRight, CalendarDays } from '@lucide/svelte';

	import type { DemoPost } from './demo-site';

	let {
		posts,
		interactive = false,
		onopen
	}: {
		posts: DemoPost[];
		interactive?: boolean;
		onopen?: (post: DemoPost) => void;
	} = $props();

	function displayDate(value: string | null): string {
		if (!value) return '';
		return new Intl.DateTimeFormat('en', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			timeZone: 'UTC'
		}).format(new Date(value));
	}
</script>

{#if posts.length > 0}
	<div class="post-grid" aria-label="Published posts">
		{#each posts as post (post.id)}
			<article class="post-card">
				{#if post.coverImage}<img
						src={post.coverImage}
						alt={post.coverImageAlt ?? ''}
						style:object-fit={post.coverImagePresentation?.fit ?? 'cover'}
						style:object-position={`${post.coverImagePresentation?.focalX ?? 50}% ${post.coverImagePresentation?.focalY ?? 50}%`}
					/>{/if}
				<div>
					<small><CalendarDays size={13} /> {displayDate(post.publishedAt)}</small>
					<h3>{post.title}</h3>
					<p>{post.summary}</p>
					{#if interactive}
						<button onclick={() => onopen?.(post)}>Read story <ArrowRight size={14} /></button>
					{:else}
						<span>Read story <ArrowRight size={14} /></span>
					{/if}
				</div>
			</article>
		{/each}
	</div>
{:else}
	<div class="empty-feed">
		<strong>No published posts yet</strong>
		<span>Publish a post in Content and it will appear here automatically.</span>
	</div>
{/if}

<style>
	.post-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
		gap: 1rem;
		width: 100%;
		margin-top: 1.2rem;
	}
	.post-card {
		display: flex;
		flex-direction: column;
		min-width: 0;
		overflow: hidden;
		border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
		border-radius: 1rem;
		background: color-mix(in srgb, var(--site-paper, #fff) 92%, white);
	}
	.post-card > img {
		width: 100%;
		aspect-ratio: 16 / 10;
		object-fit: cover;
	}
	.post-card > div {
		display: flex;
		flex: 1;
		flex-direction: column;
		align-items: flex-start;
		padding: 1rem;
	}
	.post-card small {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		color: color-mix(in srgb, currentColor 65%, transparent);
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.post-card h3 {
		margin: 0.65rem 0 0.45rem;
		font-size: clamp(1.05rem, 2vw, 1.35rem);
		line-height: 1.12;
	}
	.post-card p {
		margin: 0;
		color: color-mix(in srgb, currentColor 72%, transparent);
		font-size: 0.88rem;
		line-height: 1.55;
	}
	.post-card button,
	.post-card span {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: auto;
		padding: 0.9rem 0 0;
		border: 0;
		background: transparent;
		color: var(--accent, #087d60);
		font: inherit;
		font-size: 0.82rem;
		font-weight: 800;
	}
	.post-card button {
		cursor: pointer;
	}
	.post-card button:hover,
	.post-card button:focus-visible {
		text-decoration: underline;
	}
	.empty-feed {
		display: grid;
		gap: 0.35rem;
		width: 100%;
		margin-top: 1rem;
		padding: 1.2rem;
		border: 1px dashed color-mix(in srgb, currentColor 24%, transparent);
		border-radius: 1rem;
		color: color-mix(in srgb, currentColor 65%, transparent);
	}
	.empty-feed strong {
		color: currentColor;
	}
</style>
