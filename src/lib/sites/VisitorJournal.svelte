<script lang="ts">
	import {
		ArrowLeft,
		ArrowRight,
		CalendarDays,
		ChevronLeft,
		ChevronRight,
		Clock3,
		Mail,
		Search,
		Share2,
		Tag,
		Undo2
	} from '@lucide/svelte';

	import type { DemoPost, DemoSite } from './demo-site';
	import { renderRichMarkdown } from './rich-text';
	import {
		filterJournalPosts,
		journalTags,
		paginateJournalPosts,
		postNavigation,
		postShareLinks,
		publishedJournalPosts,
		readingMinutes,
		relatedJournalPosts
	} from './visitor-journal';

	let {
		site,
		postId = $bindable(null)
	}: {
		site: DemoSite;
		postId?: string | null;
	} = $props();

	let query = $state('');
	let selectedTag = $state<string | null>(null);
	let requestedPage = $state(1);
	const posts = $derived(publishedJournalPosts(site));
	const tags = $derived(journalTags(posts));
	const filtered = $derived(filterJournalPosts(posts, query, selectedTag));
	const journalPage = $derived(paginateJournalPosts(filtered, requestedPage, 6));
	const selectedPost = $derived(posts.find((post) => post.id === postId) ?? null);
	const navigation = $derived(selectedPost ? postNavigation(posts, selectedPost.id) : null);
	const related = $derived(selectedPost ? relatedJournalPosts(posts, selectedPost) : []);
	const shareLinks = $derived(selectedPost ? postShareLinks(site, selectedPost) : null);

	function richContent(node: HTMLElement, markdown: string) {
		const update = (next: string) => (node.innerHTML = renderRichMarkdown(next));
		update(markdown);
		return { update };
	}

	function chooseTag(tag: string | null) {
		selectedTag = tag;
		requestedPage = 1;
	}

	function openPost(post: DemoPost) {
		postId = post.id;
	}

	function displayDate(value: string | null): string {
		if (!value) return '';
		return new Intl.DateTimeFormat(site.seo.locale || 'en', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			timeZone: 'UTC'
		}).format(new Date(value));
	}
</script>

<a class="skip-link" href="#journal-main">Skip to journal content</a>

{#if postId !== null && !selectedPost}
	<main id="journal-main" class="journal-state" tabindex="-1">
		<span>404 · Story not found</span>
		<h1>This story may have moved or returned to drafts.</h1>
		<p>Browse the published journal to find another story.</p>
		<button onclick={() => (postId = null)}><Undo2 size={17} /> Return to the journal</button>
	</main>
{:else if selectedPost}
	<main id="journal-main" class="journal-article" tabindex="-1">
		<nav class="breadcrumbs" aria-label="Breadcrumb">
			<button onclick={() => (postId = null)}>Journal</button><span aria-hidden="true">/</span><span
				aria-current="page">{selectedPost.title}</span
			>
		</nav>
		{#if selectedPost.coverImage}
			<img
				class="article-cover"
				src={selectedPost.coverImage}
				alt={selectedPost.coverImageAlt ?? ''}
			/>
		{/if}
		<div class="article-heading">
			<div class="article-meta">
				<span><CalendarDays size={15} /> {displayDate(selectedPost.publishedAt)}</span>
				<span><Clock3 size={15} /> {readingMinutes(selectedPost.body)} min read</span>
			</div>
			<h1>{selectedPost.title}</h1>
			<p>{selectedPost.summary}</p>
			<div class="tag-row" aria-label="Story tags">
				{#each selectedPost.tags as tag (tag)}<button
						onclick={() => {
							postId = null;
							chooseTag(tag);
						}}><Tag size={13} /> {tag}</button
					>{/each}
			</div>
		</div>
		<div class="article-body" use:richContent={selectedPost.body}></div>
		{#if shareLinks}
			<section class="share-row" aria-label="Share this story">
				<strong><Share2 size={17} /> Share this story</strong>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- generated mailto destination leaves the client app. -->
				<a href={shareLinks.email}><Mail size={15} /> Email</a>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- generated external share destination leaves the client app. -->
				<a href={shareLinks.bluesky} target="_blank" rel="noopener noreferrer">Bluesky</a>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- generated external share destination leaves the client app. -->
				<a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
			</section>
		{/if}
		<nav class="post-navigation" aria-label="More journal stories">
			{#if navigation?.previous}<button onclick={() => openPost(navigation!.previous!)}
					><ChevronLeft size={18} /><span
						><small>Previous story</small><strong>{navigation.previous.title}</strong></span
					></button
				>{:else}<span></span>{/if}
			{#if navigation?.next}<button class="next" onclick={() => openPost(navigation!.next!)}
					><span><small>Next story</small><strong>{navigation.next.title}</strong></span
					><ChevronRight size={18} /></button
				>{/if}
		</nav>
		{#if related.length}
			<section class="related">
				<div>
					<span>Keep reading</span>
					<h2>Related stories</h2>
				</div>
				<div class="related-grid">
					{#each related as post (post.id)}<button onclick={() => openPost(post)}
							><small>{post.tags[0] ?? 'Journal'}</small><strong>{post.title}</strong><span
								>Read story <ArrowRight size={14} /></span
							></button
						>
					{/each}
				</div>
			</section>
		{/if}
	</main>
{:else}
	<main id="journal-main" class="journal-index" tabindex="-1">
		<header>
			<div>
				<span>Journal</span>
				<h1>Field notes and slower routes.</h1>
				<p>Search every published story or browse by topic.</p>
			</div>
			<label
				><Search size={18} /><span class="sr-only">Search the journal</span><input
					aria-label="Search the journal"
					placeholder="Search stories"
					value={query}
					oninput={(event) => {
						query = event.currentTarget.value;
						requestedPage = 1;
					}}
				/></label
			>
		</header>
		<nav class="tag-filter" aria-label="Browse stories by tag">
			<button class:active={selectedTag === null} onclick={() => chooseTag(null)}
				>All <span>{posts.length}</span></button
			>
			{#each tags as item (item.tag)}<button
					class:active={selectedTag === item.tag}
					onclick={() => chooseTag(item.tag)}>{item.tag} <span>{item.count}</span></button
				>{/each}
		</nav>
		<div class="results-summary" aria-live="polite">
			<strong>{journalPage.total} {journalPage.total === 1 ? 'story' : 'stories'}</strong>
			{#if query || selectedTag}<button
					onclick={() => {
						query = '';
						chooseTag(null);
					}}>Clear filters</button
				>{/if}
		</div>
		{#if journalPage.items.length}
			<section class="journal-grid" aria-label="Journal stories">
				{#each journalPage.items as post (post.id)}
					<article>
						{#if post.coverImage}<img
								src={post.coverImage}
								alt={post.coverImageAlt ?? ''}
								loading="lazy"
							/>{/if}
						<div>
							<small>{displayDate(post.publishedAt)} · {readingMinutes(post.body)} min read</small>
							<h2>{post.title}</h2>
							<p>{post.summary}</p>
							<button onclick={() => openPost(post)}>Read story <ArrowRight size={15} /></button>
						</div>
					</article>
				{/each}
			</section>
		{:else}
			<section class="journal-state">
				<Search size={28} />
				<h2>No stories match those filters.</h2>
				<p>Try a different phrase or browse every published story.</p>
				<button
					onclick={() => {
						query = '';
						chooseTag(null);
					}}>Show all stories</button
				>
			</section>
		{/if}
		{#if journalPage.pageCount > 1}
			<nav class="pagination" aria-label="Journal pages">
				<button
					disabled={journalPage.page === 1}
					onclick={() => (requestedPage = journalPage.page - 1)}
					><ArrowLeft size={15} /> Previous</button
				>
				<span>Page {journalPage.page} of {journalPage.pageCount}</span>
				<button
					disabled={journalPage.page === journalPage.pageCount}
					onclick={() => (requestedPage = journalPage.page + 1)}
					>Next <ArrowRight size={15} /></button
				>
			</nav>
		{/if}
	</main>
{/if}

<style>
	.skip-link {
		position: fixed;
		top: 0.5rem;
		left: 0.5rem;
		z-index: 10;
		padding: 0.65rem 0.8rem;
		color: #fff;
		background: #0b3b2a;
		border-radius: 0.5rem;
		transform: translateY(-180%);
	}
	.skip-link:focus {
		transform: translateY(0);
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	.journal-index,
	.journal-article,
	.journal-state {
		max-width: 1180px;
		margin: 0 auto;
		padding: clamp(2.5rem, 7vw, 6rem) clamp(1.25rem, 5vw, 4rem);
	}
	.journal-index > header {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(16rem, 0.45fr);
		align-items: end;
		gap: 2rem;
	}
	.journal-index header span,
	.related > div > span,
	.journal-state > span {
		color: var(--accent);
		font-size: 0.72rem;
		font-weight: 850;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.journal-index h1,
	.journal-article h1 {
		margin: 0.45rem 0;
		font-family: Georgia, serif;
		font-size: clamp(2.6rem, 7vw, 5.5rem);
		line-height: 0.98;
	}
	.journal-index header p {
		margin: 0;
		color: color-mix(in srgb, currentColor 68%, transparent);
	}
	.journal-index header label {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.75rem 0.9rem;
		border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
		border-radius: 999px;
	}
	.journal-index header input {
		width: 100%;
		color: inherit;
		background: transparent;
		border: 0;
		outline: 0;
		font: inherit;
	}
	.tag-filter {
		display: flex;
		gap: 0.45rem;
		margin: 2rem 0 1rem;
		padding-bottom: 0.5rem;
		overflow-x: auto;
	}
	.tag-filter button,
	.tag-row button {
		flex: 0 0 auto;
		padding: 0.48rem 0.72rem;
		color: inherit;
		background: transparent;
		border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
		border-radius: 999px;
		cursor: pointer;
	}
	.tag-filter button.active {
		color: #fff;
		background: var(--accent);
		border-color: var(--accent);
	}
	.tag-filter span {
		margin-left: 0.3rem;
		opacity: 0.68;
	}
	.results-summary {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}
	.results-summary button {
		color: var(--accent);
		background: transparent;
		border: 0;
		cursor: pointer;
	}
	.journal-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1.25rem;
	}
	.journal-grid article {
		overflow: hidden;
		border: 1px solid color-mix(in srgb, currentColor 15%, transparent);
		border-radius: 1.1rem;
	}
	.journal-grid img {
		width: 100%;
		aspect-ratio: 16 / 9;
		object-fit: cover;
	}
	.journal-grid article > div {
		padding: 1.15rem;
	}
	.journal-grid small,
	.article-meta {
		color: color-mix(in srgb, currentColor 64%, transparent);
		font-size: 0.75rem;
	}
	.journal-grid h2 {
		margin: 0.55rem 0;
		font-family: Georgia, serif;
		font-size: 1.55rem;
	}
	.journal-grid p {
		min-height: 3.2rem;
		margin: 0;
		color: color-mix(in srgb, currentColor 70%, transparent);
	}
	.journal-grid button,
	.journal-state button {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 1rem;
		padding: 0;
		color: var(--accent);
		background: transparent;
		border: 0;
		font: inherit;
		font-weight: 800;
		cursor: pointer;
	}
	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-top: 2rem;
	}
	.pagination button {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.55rem 0.75rem;
		color: inherit;
		background: transparent;
		border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
		border-radius: 0.6rem;
		cursor: pointer;
	}
	.pagination button:disabled {
		opacity: 0.4;
		cursor: default;
	}
	.breadcrumbs {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		color: color-mix(in srgb, currentColor 62%, transparent);
		font-size: 0.82rem;
	}
	.breadcrumbs button {
		padding: 0;
		color: var(--accent);
		background: transparent;
		border: 0;
		cursor: pointer;
	}
	.article-cover {
		width: 100%;
		max-height: 32rem;
		object-fit: cover;
		border-radius: 1.25rem;
	}
	.article-heading {
		max-width: 52rem;
		margin: 2rem auto;
	}
	.article-meta {
		display: flex;
		gap: 1rem;
	}
	.article-meta span {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}
	.article-heading > p {
		font-size: 1.18rem;
		line-height: 1.6;
	}
	.tag-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.tag-row button {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
	}
	.article-body {
		max-width: 70ch;
		margin: 0 auto;
		font-size: 1.05rem;
		line-height: 1.8;
	}
	.article-body :global(h2) {
		margin: 2.2rem 0 0.7rem;
		font-family: Georgia, serif;
		font-size: 2rem;
	}
	.article-body :global(ol),
	.article-body :global(ul) {
		padding-left: 1.5rem;
	}
	.article-body :global(blockquote) {
		margin: 1.6rem 0;
		padding: 0.15rem 0 0.15rem 1.15rem;
		border-left: 3px solid var(--visitor-accent, #168b62);
		font-size: 1.08em;
		font-style: italic;
	}
	.article-body :global(pre) {
		overflow-x: auto;
		padding: 1rem;
		border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
		border-radius: 0.75rem;
		background: color-mix(in srgb, currentColor 6%, transparent);
		font-size: 0.86rem;
		line-height: 1.6;
	}
	.article-body :global(hr) {
		margin: 2rem 0;
		border: 0;
		border-top: 1px solid color-mix(in srgb, currentColor 22%, transparent);
	}
	.share-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem;
		max-width: 70ch;
		margin: 2.5rem auto;
		padding: 1rem 0;
		border-block: 1px solid color-mix(in srgb, currentColor 16%, transparent);
	}
	.share-row strong,
	.share-row a {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}
	.share-row strong {
		margin-right: auto;
	}
	.share-row a {
		padding: 0.45rem 0.65rem;
		color: inherit;
		text-decoration: none;
		border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
		border-radius: 999px;
	}
	.post-navigation {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		max-width: 54rem;
		margin: 2rem auto;
	}
	.post-navigation > button {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 1rem;
		color: inherit;
		text-align: left;
		background: transparent;
		border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
		border-radius: 0.8rem;
		cursor: pointer;
	}
	.post-navigation .next {
		justify-content: flex-end;
		text-align: right;
	}
	.post-navigation span {
		display: grid;
		gap: 0.2rem;
	}
	.post-navigation small {
		color: color-mix(in srgb, currentColor 62%, transparent);
	}
	.related {
		max-width: 54rem;
		margin: 3rem auto 0;
	}
	.related h2 {
		margin: 0.25rem 0 1rem;
		font-family: Georgia, serif;
		font-size: 2rem;
	}
	.related-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.7rem;
	}
	.related-grid button {
		display: grid;
		gap: 0.45rem;
		padding: 1rem;
		color: inherit;
		text-align: left;
		background: color-mix(in srgb, var(--accent) 8%, transparent);
		border: 1px solid color-mix(in srgb, currentColor 15%, transparent);
		border-radius: 0.8rem;
		cursor: pointer;
	}
	.related-grid small {
		color: var(--accent);
	}
	.related-grid span {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		color: var(--accent);
		font-size: 0.78rem;
		font-weight: 800;
	}
	.journal-state {
		display: grid;
		place-items: center;
		min-height: 26rem;
		text-align: center;
	}
	.journal-state h1,
	.journal-state h2 {
		max-width: 46rem;
		margin: 0.6rem 0;
		font-family: Georgia, serif;
		font-size: clamp(2rem, 5vw, 4rem);
	}
	.journal-state p {
		margin: 0;
	}
	@media (max-width: 720px) {
		.journal-index > header,
		.journal-grid,
		.related-grid {
			grid-template-columns: 1fr;
		}
		.post-navigation {
			grid-template-columns: 1fr;
		}
		.post-navigation > span {
			display: none;
		}
		.article-meta {
			flex-direction: column;
			gap: 0.35rem;
		}
	}
</style>
