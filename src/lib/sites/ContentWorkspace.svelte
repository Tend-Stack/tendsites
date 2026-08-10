<script lang="ts">
	import {
		BookOpen,
		Check,
		CirclePlus,
		Clock3,
		FileText,
		Search,
		Star,
		Trash2
	} from '@lucide/svelte';

	import { createDemoPost, uniquePostSlug, type DemoPost, type DemoSite } from './demo-site';
	import { renderRichMarkdown } from './rich-text';

	let {
		site,
		onchange
	}: {
		site: DemoSite;
		onchange: (mutator: (next: DemoSite) => void) => void;
	} = $props();

	let selectedPostId = $state('');
	let query = $state('');
	let statusFilter = $state<'all' | 'draft' | 'published'>('all');
	let deleteConfirmation = $state('');
	let showDelete = $state(false);

	const collection = $derived(site.collections[0]);
	const selectedPost = $derived(
		collection?.items.find((post) => post.id === selectedPostId) ?? collection?.items[0]
	);
	const filteredPosts = $derived(
		(collection?.items ?? []).filter((post) => {
			const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
			const needle = query.trim().toLowerCase();
			return (
				matchesStatus &&
				(!needle ||
					post.title.toLowerCase().includes(needle) ||
					post.summary.toLowerCase().includes(needle) ||
					post.tags.some((tag) => tag.toLowerCase().includes(needle)))
			);
		})
	);
	const publishedCount = $derived(
		(collection?.items ?? []).filter((post) => post.status === 'published').length
	);
	const draftCount = $derived((collection?.items ?? []).length - publishedCount);

	$effect(() => {
		if (!selectedPostId && collection?.items[0]) selectedPostId = collection.items[0].id;
	});

	function richPreview(node: HTMLElement, markdown: string) {
		const update = (next: string) => {
			// renderRichMarkdown escapes raw HTML and validates every link before
			// this bounded reader preview reaches the DOM.
			node.innerHTML = renderRichMarkdown(next);
		};
		update(markdown);
		return { update };
	}

	function updatePost(mutator: (post: DemoPost) => void) {
		if (!selectedPost) return;
		onchange((next) => {
			const posts = next.collections.find((item) => item.id === collection?.id)?.items;
			const post = posts?.find((item) => item.id === selectedPost.id);
			if (post) mutator(post);
		});
	}

	function updateText(field: 'title' | 'summary' | 'body' | 'author', value: string) {
		updatePost((post) => {
			const next = value
				.trim()
				.slice(0, field === 'body' ? 50_000 : field === 'summary' ? 500 : 120);
			if (next) post[field] = next;
		});
	}

	function updateSlug(value: string) {
		updatePost((post) => {
			const posts = collection?.items ?? [];
			post.slug = uniquePostSlug(value, posts, post.id);
		});
	}

	function updateTags(value: string) {
		const tags = [
			...new Set(
				value
					.split(',')
					.map((tag) => tag.trim())
					.filter(Boolean)
			)
		]
			.slice(0, 20)
			.map((tag) => tag.slice(0, 40));
		updatePost((post) => (post.tags = tags));
	}

	function addPost() {
		const sequence = Date.now();
		const post = createDemoPost(sequence, collection?.items ?? []);
		onchange((next) => {
			const target = next.collections.find((item) => item.id === collection?.id);
			if (target) target.items.unshift(post);
		});
		selectedPostId = post.id;
	}

	function confirmDelete() {
		if (!selectedPost || deleteConfirmation.trim() !== selectedPost.title) return;
		const targetId = selectedPost.id;
		const fallback = collection?.items.find((post) => post.id !== targetId)?.id ?? '';
		onchange((next) => {
			const target = next.collections.find((item) => item.id === collection?.id);
			if (target) target.items = target.items.filter((post) => post.id !== targetId);
		});
		selectedPostId = fallback;
		showDelete = false;
		deleteConfirmation = '';
	}
</script>

<main class="content-page">
	<header class="content-heading">
		<div>
			<span class="eyebrow">Content</span>
			<h1>Stories, organized and ready to reuse.</h1>
			<p>Write once, then place posts on your home page, journal, or future collections.</p>
		</div>
		<button class="primary" onclick={addPost}><CirclePlus size={18} /> New post</button>
	</header>

	<section class="content-stats" aria-label="Content overview">
		<div>
			<BookOpen size={20} /><span><strong>{collection?.items.length ?? 0}</strong> posts</span>
		</div>
		<div><Check size={20} /><span><strong>{publishedCount}</strong> published</span></div>
		<div><Clock3 size={20} /><span><strong>{draftCount}</strong> drafts</span></div>
	</section>

	<div class="content-workspace">
		<aside class="post-browser" aria-label="Posts">
			<div class="search-box">
				<Search size={17} />
				<input bind:value={query} aria-label="Search posts" placeholder="Search posts" />
			</div>
			<div class="filters" aria-label="Filter posts">
				{#each [['all', 'All'], ['published', 'Published'], ['draft', 'Drafts']] as option (option[0])}
					<button
						class:active={statusFilter === option[0]}
						onclick={() => (statusFilter = option[0] as typeof statusFilter)}>{option[1]}</button
					>
				{/each}
			</div>
			<div class="post-list">
				{#each filteredPosts as post (post.id)}
					<button
						class:active={selectedPost?.id === post.id}
						onclick={() => (selectedPostId = post.id)}
					>
						<span class="post-icon"><FileText size={17} /></span>
						<span><strong>{post.title}</strong><small>/{post.slug}</small></span>
						<em class:published={post.status === 'published'}>{post.status}</em>
					</button>
				{:else}
					<p class="empty">No posts match this view.</p>
				{/each}
			</div>
		</aside>

		{#if selectedPost}
			<section class="post-editor" aria-label="Edit post">
				<header>
					<div>
						<span class="eyebrow">Post editor</span>
						<h2>{selectedPost.title}</h2>
					</div>
					<div class="editor-status">
						<label>
							<span>Status</span>
							<select
								value={selectedPost.status}
								onchange={(event) => {
									const status = event.currentTarget.value as DemoPost['status'];
									updatePost((post) => {
										post.status = status;
										post.publishedAt =
											status === 'published'
												? (post.publishedAt ?? new Date().toISOString())
												: null;
									});
								}}
							>
								<option value="draft">Draft</option>
								<option value="published">Published</option>
							</select>
						</label>
						<button
							class:active={selectedPost.featured}
							class="feature-button"
							aria-pressed={selectedPost.featured}
							onclick={() => updatePost((post) => (post.featured = !post.featured))}
							><Star size={16} /> Featured</button
						>
					</div>
				</header>

				<div class="editor-grid">
					<div class="editor-fields">
						<label
							>Title<input
								value={selectedPost.title}
								onchange={(event) => updateText('title', event.currentTarget.value)}
							/></label
						>
						<label
							>Address
							<div class="slug-field">
								<span>/journal/</span><input
									value={selectedPost.slug}
									onchange={(event) => updateSlug(event.currentTarget.value)}
								/>
							</div></label
						>
						<label
							>Short description<textarea
								rows="3"
								onchange={(event) => updateText('summary', event.currentTarget.value)}
								>{selectedPost.summary}</textarea
							></label
						>
						<label
							>Story<textarea
								class="story-body"
								rows="13"
								onchange={(event) => updateText('body', event.currentTarget.value)}
								>{selectedPost.body}</textarea
							><small
								>Use simple Markdown for headings, emphasis, links, and lists. Visual block editing
								is next.</small
							></label
						>
						<div class="split-fields">
							<label
								>Author<input
									value={selectedPost.author}
									onchange={(event) => updateText('author', event.currentTarget.value)}
								/></label
							>
							<label
								>Tags<input
									value={selectedPost.tags.join(', ')}
									onchange={(event) => updateTags(event.currentTarget.value)}
									placeholder="Travel, Field notes"
								/></label
							>
						</div>
					</div>
					<aside class="post-preview">
						<span class="eyebrow">Reader preview</span>
						{#if selectedPost.coverImage}<img
								src={selectedPost.coverImage}
								alt={selectedPost.coverImageAlt ?? ''}
							/>{/if}
						<h2>{selectedPost.title}</h2>
						<p>{selectedPost.summary}</p>
						<div class="preview-body" use:richPreview={selectedPost.body}></div>
					</aside>
				</div>

				<footer>
					<p>
						Changes are saved with this local site draft. Publishing is still intentionally
						disconnected.
					</p>
					<button class="danger" onclick={() => (showDelete = true)}
						><Trash2 size={16} /> Delete post</button
					>
				</footer>
			</section>
		{:else}
			<section class="post-editor empty-editor">
				<FileText size={28} />
				<h2>Create your first post</h2>
				<button class="primary" onclick={addPost}>New post</button>
			</section>
		{/if}
	</div>
</main>

{#if showDelete && selectedPost}
	<div class="dialog-backdrop" role="presentation">
		<div class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-post-title">
			<h2 id="delete-post-title">Delete “{selectedPost.title}”?</h2>
			<p>This removes the post from this draft. Type its full title to confirm.</p>
			<input bind:value={deleteConfirmation} aria-label="Post title confirmation" />
			<div>
				<button onclick={() => (showDelete = false)}>Cancel</button><button
					class="danger"
					disabled={deleteConfirmation.trim() !== selectedPost.title}
					onclick={confirmDelete}>Delete post</button
				>
			</div>
		</div>
	</div>
{/if}

<style>
	.content-page {
		padding: clamp(24px, 4vw, 58px);
		max-width: 1600px;
		margin: 0 auto;
	}
	.content-heading {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 24px;
		margin-bottom: 24px;
	}
	.eyebrow {
		color: #4de2aa;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}
	h1 {
		margin: 8px 0;
		font-size: clamp(2rem, 4vw, 3.6rem);
		line-height: 1.02;
		font-weight: 450;
	}
	.content-heading p,
	.post-editor footer p {
		color: #99aaa5;
		margin: 0;
	}
	button,
	input,
	textarea,
	select {
		font: inherit;
	}
	button {
		cursor: pointer;
	}
	.primary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 9px;
		border: 0;
		border-radius: 14px;
		padding: 13px 18px;
		background: #57e3ad;
		color: #05130e;
		font-weight: 800;
	}
	.content-stats {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 12px;
		margin-bottom: 18px;
	}
	.content-stats div {
		display: flex;
		gap: 12px;
		align-items: center;
		border: 1px solid #18332b;
		background: #0b1412;
		border-radius: 16px;
		padding: 16px 18px;
		color: #4de2aa;
	}
	.content-stats span {
		color: #8fa39d;
	}
	.content-stats strong {
		color: #eef6f2;
		font-size: 1.15rem;
	}
	.content-workspace {
		display: grid;
		grid-template-columns: minmax(260px, 340px) minmax(0, 1fr);
		min-height: 670px;
		border: 1px solid #173c30;
		border-radius: 22px;
		overflow: hidden;
		background: #07100e;
	}
	.post-browser {
		border-right: 1px solid #17302a;
		padding: 18px;
		background: #07110f;
	}
	.search-box {
		display: flex;
		gap: 9px;
		align-items: center;
		border: 1px solid #203833;
		border-radius: 12px;
		padding: 0 12px;
	}
	.search-box input {
		width: 100%;
		border: 0;
		outline: 0;
		background: transparent;
		color: #eef6f2;
		padding: 12px 0;
	}
	.filters {
		display: flex;
		gap: 7px;
		margin: 14px 0;
	}
	.filters button {
		border: 1px solid #203833;
		color: #91a29d;
		background: transparent;
		border-radius: 999px;
		padding: 7px 11px;
	}
	.filters button.active {
		color: #56e3ad;
		border-color: #26775d;
		background: #0f2921;
	}
	.post-list {
		display: grid;
		gap: 8px;
	}
	.post-list > button {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 10px;
		width: 100%;
		text-align: left;
		color: #dce8e4;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 13px;
		padding: 12px;
	}
	.post-list > button:hover,
	.post-list > button.active {
		border-color: #245c49;
		background: #0d241d;
	}
	.post-list strong,
	.post-list small {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.post-list small {
		color: #72847f;
		margin-top: 3px;
	}
	.post-list em {
		font-style: normal;
		font-size: 0.68rem;
		text-transform: uppercase;
		color: #d6a83d;
	}
	.post-list em.published {
		color: #55dda9;
	}
	.post-icon {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		color: #4de2aa;
		background: #113028;
		border-radius: 10px;
	}
	.empty {
		color: #7e918b;
		text-align: center;
		padding: 28px 10px;
	}
	.post-editor {
		min-width: 0;
		padding: clamp(20px, 3vw, 34px);
	}
	.post-editor > header {
		display: flex;
		justify-content: space-between;
		gap: 20px;
		align-items: start;
		margin-bottom: 22px;
	}
	.post-editor h2 {
		margin: 6px 0 0;
	}
	.editor-status {
		display: flex;
		gap: 10px;
		align-items: end;
	}
	.editor-status label {
		min-width: 130px;
	}
	.feature-button {
		height: 43px;
		display: inline-flex;
		gap: 7px;
		align-items: center;
		color: #96a7a1;
		background: transparent;
		border: 1px solid #29423a;
		border-radius: 11px;
		padding: 0 13px;
	}
	.feature-button.active {
		color: #f6c94c;
		background: #2a230c;
		border-color: #68561d;
	}
	.editor-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.25fr) minmax(260px, 0.75fr);
		gap: 22px;
	}
	.editor-fields {
		display: grid;
		gap: 15px;
	}
	label {
		display: grid;
		gap: 7px;
		color: #9aaca6;
		font-size: 0.82rem;
		font-weight: 700;
	}
	input,
	textarea,
	select {
		width: 100%;
		box-sizing: border-box;
		border: 1px solid #263f38;
		border-radius: 11px;
		background: #091411;
		color: #eef6f2;
		padding: 11px 12px;
		outline: 0;
	}
	input:focus,
	textarea:focus,
	select:focus {
		border-color: #44c995;
		box-shadow: 0 0 0 3px #183f323d;
	}
	textarea {
		resize: vertical;
		line-height: 1.55;
	}
	label small {
		color: #6f847d;
		font-weight: 400;
	}
	.slug-field {
		display: flex;
		align-items: center;
		border: 1px solid #263f38;
		border-radius: 11px;
		background: #091411;
		overflow: hidden;
	}
	.slug-field span {
		padding-left: 12px;
		color: #6f837d;
	}
	.slug-field input {
		border: 0;
		border-radius: 0;
		padding-left: 2px;
		box-shadow: none;
	}
	.split-fields {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}
	.post-preview {
		align-self: start;
		position: sticky;
		top: 16px;
		border: 1px solid #203a32;
		background: #0d1715;
		border-radius: 17px;
		padding: 18px;
		overflow: hidden;
	}
	.post-preview img {
		display: block;
		width: 100%;
		aspect-ratio: 16 / 9;
		object-fit: cover;
		border-radius: 11px;
		margin: 12px 0 18px;
	}
	.post-preview h2 {
		font-family: Georgia, serif;
		font-size: 1.7rem;
	}
	.post-preview > p {
		color: #9cada7;
		line-height: 1.5;
	}
	.preview-body {
		color: #d4dfdb;
		line-height: 1.65;
	}
	.post-editor > footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 20px;
		border-top: 1px solid #1c312b;
		margin-top: 25px;
		padding-top: 18px;
	}
	.danger {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		color: #ff9a9a;
		background: #261011;
		border: 1px solid #5a2628;
		border-radius: 11px;
		padding: 10px 13px;
		font-weight: 700;
	}
	.empty-editor {
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 14px;
		color: #84958f;
	}
	.dialog-backdrop {
		position: fixed;
		inset: 0;
		z-index: 20;
		display: grid;
		place-items: center;
		padding: 20px;
		background: #000b;
	}
	.confirm-dialog {
		width: min(460px, 100%);
		border: 1px solid #345047;
		border-radius: 18px;
		padding: 24px;
		background: #091310;
		box-shadow: 0 24px 90px #000a;
	}
	.confirm-dialog p {
		color: #9caea8;
	}
	.confirm-dialog > div {
		display: flex;
		justify-content: end;
		gap: 10px;
		margin-top: 16px;
	}
	.confirm-dialog > div button:first-child {
		color: #dce7e3;
		background: transparent;
		border: 1px solid #31473f;
		border-radius: 11px;
		padding: 10px 14px;
	}
	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	@media (max-width: 1000px) {
		.content-workspace {
			grid-template-columns: 1fr;
		}
		.post-browser {
			border-right: 0;
			border-bottom: 1px solid #17302a;
		}
		.post-list {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.editor-grid {
			grid-template-columns: 1fr;
		}
		.post-preview {
			position: static;
		}
	}
	@media (max-width: 640px) {
		.content-page {
			padding: 18px 14px;
		}
		.content-heading,
		.post-editor > header,
		.post-editor > footer {
			align-items: stretch;
			flex-direction: column;
		}
		.content-stats,
		.post-list,
		.split-fields {
			grid-template-columns: 1fr;
		}
		.editor-status {
			align-items: stretch;
			flex-direction: column;
		}
	}
</style>
