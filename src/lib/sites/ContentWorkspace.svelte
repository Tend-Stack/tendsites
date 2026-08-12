<script lang="ts">
	import {
		Bold,
		BookOpen,
		Check,
		CirclePlus,
		Clock3,
		Code2,
		FileText,
		Heading2,
		Heading3,
		Italic,
		Image,
		Link2,
		List,
		ListFilter,
		ListOrdered,
		LoaderCircle,
		Minus,
		MessageSquareText,
		Quote,
		Redo2,
		Search,
		Save,
		Star,
		Strikethrough,
		Superscript,
		Table2,
		Trash2,
		TriangleAlert,
		Undo2
	} from '@lucide/svelte';

	import {
		createDemoPost,
		uniquePostSlug,
		type DemoImagePresentation,
		type DemoPost,
		type DemoSite
	} from './demo-site';
	import MediaPicker from './MediaPicker.svelte';
	import type { HostImageItem, HostMediaBridge } from './host-media';
	import { applyMarkdownEdit, type MarkdownEditAction } from './markdown-edit';
	import { renderRichMarkdown } from './rich-text';

	let {
		site,
		onchange,
		onsave,
		saveStatus,
		saveError,
		media,
		canUndo = false,
		canRedo = false,
		onundo,
		onredo
	}: {
		site: DemoSite;
		onchange: (mutator: (next: DemoSite) => void, historyKey?: string) => void;
		onsave: () => Promise<void>;
		saveStatus: 'loading' | 'saved' | 'local' | 'error';
		saveError?: string;
		media?: HostMediaBridge;
		canUndo?: boolean;
		canRedo?: boolean;
		onundo?: () => void;
		onredo?: () => void;
	} = $props();

	let selectedPostId = $state('');
	let query = $state('');
	let statusFilter = $state<'all' | DemoPost['status']>('all');
	let deleteConfirmation = $state('');
	let showDelete = $state(false);
	let showMediaPicker = $state(false);
	let storyEditor = $state<HTMLTextAreaElement>();
	let editorAnnouncement = $state('');
	const storyTools = [
		['heading', 'Heading', Heading2],
		['subheading', 'Subheading', Heading3],
		['bold', 'Bold', Bold],
		['italic', 'Italic', Italic],
		['strike', 'Strikethrough', Strikethrough],
		['code', 'Inline code', Code2],
		['bullet-list', 'Bulleted list', List],
		['ordered-list', 'Numbered list', ListOrdered],
		['quote', 'Quote', Quote],
		['code-block', 'Code block', Code2],
		['divider', 'Divider', Minus],
		['table', 'Table', Table2],
		['callout', 'Callout', MessageSquareText],
		['footnote', 'Footnote', Superscript],
		['link', 'Link', Link2]
	] as const;

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
	const draftCount = $derived(
		(collection?.items ?? []).filter((post) => post.status === 'draft').length
	);
	const scheduledCount = $derived(
		(collection?.items ?? []).filter((post) => post.status === 'scheduled').length
	);
	const archivedCount = $derived(
		(collection?.items ?? []).filter((post) => post.status === 'archived').length
	);
	const statusOptions = $derived([
		{ id: 'all' as const, label: 'All', count: collection?.items.length ?? 0 },
		{ id: 'published' as const, label: 'Published', count: publishedCount },
		{ id: 'scheduled' as const, label: 'Scheduled', count: scheduledCount },
		{ id: 'draft' as const, label: 'Drafts', count: draftCount },
		{ id: 'archived' as const, label: 'Archived', count: archivedCount }
	]);

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

	function updatePost(mutator: (post: DemoPost) => void, historyKey = 'content-action') {
		if (!selectedPost) return;
		onchange((next) => {
			const posts = next.collections.find((item) => item.id === collection?.id)?.items;
			const post = posts?.find((item) => item.id === selectedPost.id);
			if (post) mutator(post);
		}, historyKey);
	}

	function updateText(field: 'title' | 'summary' | 'body' | 'author', value: string) {
		updatePost(
			(post) => {
				const next = value
					.trim()
					.slice(0, field === 'body' ? 50_000 : field === 'summary' ? 500 : 120);
				if (next) post[field] = next;
			},
			`typing:post:${selectedPost?.id ?? 'none'}:${field}`
		);
	}

	function editStory(action: MarkdownEditAction, label: string) {
		if (!selectedPost || !storyEditor) return;
		const editor = storyEditor;
		const result = applyMarkdownEdit(
			editor.value,
			editor.selectionStart,
			editor.selectionEnd,
			action
		);
		const leadingWhitespace = result.value.length - result.value.trimStart().length;
		const value = result.value.trim().slice(0, 50_000);
		updatePost((post) => (post.body = value || 'Start writing here.'), `format:${action}`);
		editorAnnouncement = `${label} added`;
		requestAnimationFrame(() => {
			editor.focus();
			editor.setSelectionRange(
				Math.max(0, result.selectionStart - leadingWhitespace),
				Math.max(0, result.selectionEnd - leadingWhitespace)
			);
		});
	}

	function updateStory(value: string) {
		updatePost(
			(post) => (post.body = value.slice(0, 50_000)),
			`typing:post:${selectedPost?.id ?? 'none'}:body`
		);
	}

	function handleHistoryShortcut(event: KeyboardEvent) {
		if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
		const key = event.key.toLowerCase();
		if (key === 'z' && event.shiftKey && canRedo) {
			event.preventDefault();
			onredo?.();
		} else if (key === 'z' && canUndo) {
			event.preventDefault();
			onundo?.();
		} else if (key === 'y' && canRedo) {
			event.preventDefault();
			onredo?.();
		}
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

	function updateStatus(status: DemoPost['status']) {
		updatePost((post) => {
			post.status = status;
			if (status === 'published') {
				post.publishedAt ??= new Date().toISOString();
				post.scheduledAt = null;
			} else if (status === 'scheduled') {
				post.publishedAt = null;
				post.scheduledAt ??= new Date(Date.now() + 86_400_000).toISOString();
			} else {
				post.scheduledAt = null;
				if (status === 'draft') post.publishedAt = null;
			}
		});
	}

	function updateSchedule(value: string) {
		const timestamp = Date.parse(value);
		if (!Number.isFinite(timestamp)) return;
		updatePost((post) => {
			post.status = 'scheduled';
			post.publishedAt = null;
			post.scheduledAt = new Date(timestamp).toISOString();
		});
	}

	function selectCoverImage(
		image: HostImageItem,
		alt: string,
		presentation: DemoImagePresentation
	) {
		updatePost((post) => {
			const previous = post.coverImage;
			post.coverImage = image.contentUrl;
			post.coverImageAlt = alt;
			post.coverImagePresentation = presentation;
			post.coverImageSource =
				image.libraryId === 'device-upload'
					? {
							kind: 'device_upload',
							name: image.name,
							mimeType: 'image/webp',
							size: image.size ?? 0
						}
					: {
							kind: 'host_files',
							itemId: image.id,
							libraryId: image.libraryId,
							name: image.name,
							mimeType: image.mimeType,
							size: image.size,
							modifiedAt: image.modifiedAt
						};
			if (
				image.libraryId !== 'device-upload' &&
				(!post.seo.socialImage || post.seo.socialImage === previous)
			) {
				post.seo.socialImage = image.contentUrl;
			}
		});
		showMediaPicker = false;
	}

	function removeCoverImage() {
		updatePost((post) => {
			const previous = post.coverImage;
			delete post.coverImage;
			delete post.coverImageAlt;
			delete post.coverImageSource;
			delete post.coverImagePresentation;
			if (post.seo.socialImage === previous) delete post.seo.socialImage;
		});
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

<svelte:window onkeydown={handleHistoryShortcut} />

<main class="content-page">
	<header class="content-heading">
		<div>
			<span class="eyebrow">Content</span>
			<h1>Stories, organized and ready to reuse.</h1>
			<p>Write once, then place posts on your home page, journal, or future collections.</p>
		</div>
		<div class="content-heading-actions">
			<div class="history-actions" aria-label="Editing history">
				<button type="button" disabled={!canUndo} onclick={onundo} aria-label="Undo last edit"
					><Undo2 size={17} /> Undo</button
				><button type="button" disabled={!canRedo} onclick={onredo} aria-label="Redo last edit"
					><Redo2 size={17} /> Redo</button
				>
			</div>
			<button class="primary" onclick={addPost}><CirclePlus size={18} /> New post</button>
		</div>
	</header>

	<section class="content-stats" aria-label="Content overview">
		<div>
			<BookOpen size={20} /><span><strong>{collection?.items.length ?? 0}</strong> posts</span>
		</div>
		<div><Check size={20} /><span><strong>{publishedCount}</strong> published</span></div>
		<div><Clock3 size={20} /><span><strong>{draftCount}</strong> drafts</span></div>
		<div><Clock3 size={20} /><span><strong>{scheduledCount}</strong> scheduled</span></div>
		<div><FileText size={20} /><span><strong>{archivedCount}</strong> archived</span></div>
	</section>

	<div class="content-workspace">
		<aside class="post-browser" aria-label="Posts">
			<div class="search-box">
				<Search size={17} />
				<input bind:value={query} aria-label="Search posts" placeholder="Search posts" />
			</div>
			<div class="filter-panel">
				<div class="filter-heading">
					<span><ListFilter size={15} /> View posts</span>
					<small>{filteredPosts.length} shown</small>
				</div>
				<div class="filters" role="group" aria-label="Filter posts">
					{#each statusOptions as option (option.id)}
						<button
							type="button"
							class:active={statusFilter === option.id}
							aria-pressed={statusFilter === option.id}
							onclick={() => (statusFilter = option.id)}
							><span>{option.label}</span><strong>{option.count}</strong></button
						>
					{/each}
				</div>
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
								onchange={(event) => updateStatus(event.currentTarget.value as DemoPost['status'])}
							>
								<option value="draft">Draft</option>
								<option value="scheduled">Scheduled</option>
								<option value="published">Published</option>
								<option value="archived">Archived</option>
							</select>
						</label>
						<button
							class:active={selectedPost.featured}
							class="feature-button"
							aria-pressed={selectedPost.featured}
							onclick={() => updatePost((post) => (post.featured = !post.featured))}
							><Star size={16} /> Featured</button
						>
						<div class="save-control">
							<small class:error={saveStatus === 'error'} aria-live="polite">
								{saveStatus === 'loading'
									? 'Saving changes'
									: saveStatus === 'saved'
										? 'Autosaved'
										: saveStatus === 'error'
											? saveError || 'Save failed'
											: 'Session only'}
							</small>
							<button
								type="button"
								class="save-button"
								class:error={saveStatus === 'error'}
								disabled={saveStatus === 'loading' || saveStatus === 'local'}
								onclick={() => void onsave()}
							>
								{#if saveStatus === 'loading'}<LoaderCircle class="spin" size={16} /> Saving…
								{:else if saveStatus === 'error'}<TriangleAlert size={16} /> Retry save
								{:else}<Save size={16} /> Save changes{/if}
							</button>
						</div>
					</div>
				</header>
				{#if selectedPost.status === 'scheduled'}
					<div class="schedule-card">
						<Clock3 size={18} />
						<label>
							<span>Planned publication time</span>
							<input
								type="datetime-local"
								value={selectedPost.scheduledAt?.slice(0, 16) ?? ''}
								onchange={(event) => updateSchedule(event.currentTarget.value)}
							/>
						</label>
						<p>
							Saved as a local editorial plan. It stays out of visitor pages and will not publish
							automatically until a host scheduler is authorized.
						</p>
					</div>
				{:else if selectedPost.status === 'archived'}
					<div class="schedule-card archived-note">
						<FileText size={18} />
						<p>
							Archived posts stay editable but are removed from every visitor collection and article
							route.
						</p>
					</div>
				{/if}

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
						<section class="cover-field" aria-labelledby="cover-field-title">
							<div class="cover-field-heading">
								<div>
									<span id="cover-field-title">Cover image</span><small
										>Used in this article and its social preview.</small
									>
								</div>
								<div class="cover-actions">
									<button type="button" disabled={!media} onclick={() => (showMediaPicker = true)}
										><Image size={16} />
										{selectedPost.coverImage ? 'Replace image' : 'Choose image'}</button
									>
									{#if selectedPost.coverImage}<button
											class="remove-cover"
											type="button"
											onclick={removeCoverImage}>Remove</button
										>{/if}
								</div>
							</div>
							{#if selectedPost.coverImage}
								<div class="cover-summary">
									<img
										src={selectedPost.coverImage}
										alt=""
										style:object-fit={selectedPost.coverImagePresentation?.fit ?? 'cover'}
										style:object-position={`${selectedPost.coverImagePresentation?.focalX ?? 50}% ${selectedPost.coverImagePresentation?.focalY ?? 50}%`}
										style:transform={`scale(${selectedPost.coverImagePresentation?.zoom ?? 1})`}
										style:transform-origin={`${selectedPost.coverImagePresentation?.focalX ?? 50}% ${selectedPost.coverImagePresentation?.focalY ?? 50}%`}
									/>
									<div>
										<strong>{selectedPost.coverImageSource?.name ?? 'Starter image'}</strong><span
											>{selectedPost.coverImageAlt || 'Missing image description'}</span
										><em class:connected={Boolean(selectedPost.coverImageSource)}
											>{selectedPost.coverImageSource?.kind === 'device_upload'
												? 'Optimized upload · saved with this draft'
												: selectedPost.coverImageSource
													? 'Connected preview · repository copy pending'
													: 'Starter image'}</em
										>
									</div>
								</div>
							{:else}
								<p class="cover-empty">
									{media
										? 'Choose from Files or upload a new image, then add accessible alt text.'
										: 'Files selection is available when TEND Sites is installed in tend.host.'}
								</p>
							{/if}
						</section>
						<div class="story-field">
							<label for="story-body">Story</label>
							<div class="story-toolbar" role="toolbar" aria-label="Story formatting tools">
								{#each storyTools as tool (tool[0])}
									{@const ToolIcon = tool[2]}
									<button
										type="button"
										aria-label={tool[1] as string}
										title={tool[1] as string}
										onpointerdown={(event) => event.preventDefault()}
										onclick={() => editStory(tool[0], tool[1])}
									>
										<ToolIcon size={16} />
									</button>
								{/each}
							</div>
							<textarea
								bind:this={storyEditor}
								id="story-body"
								class="story-body"
								rows="13"
								oninput={(event) => updateStory(event.currentTarget.value)}
								>{selectedPost.body}</textarea
							>
							<small>Portable Markdown stays readable in any ordinary source editor.</small>
							<span class="sr-only" aria-live="polite">{editorAnnouncement}</span>
						</div>
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
								style:aspect-ratio={selectedPost.coverImagePresentation?.aspect === 'square'
									? '1 / 1'
									: selectedPost.coverImagePresentation?.aspect === 'portrait'
										? '4 / 5'
										: '16 / 9'}
								style:object-fit={selectedPost.coverImagePresentation?.fit ?? 'cover'}
								style:object-position={`${selectedPost.coverImagePresentation?.focalX ?? 50}% ${selectedPost.coverImagePresentation?.focalY ?? 50}%`}
								style:transform={`scale(${selectedPost.coverImagePresentation?.zoom ?? 1})`}
								style:transform-origin={`${selectedPost.coverImagePresentation?.focalX ?? 50}% ${selectedPost.coverImagePresentation?.focalY ?? 50}%`}
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

{#if showMediaPicker && media}
	<MediaPicker {media} onselect={selectCoverImage} onclose={() => (showMediaPicker = false)} />
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
	.content-heading-actions,
	.history-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.history-actions {
		padding: 4px;
		border: 1px solid #1d3730;
		border-radius: 12px;
		background: #091512;
	}
	.history-actions button {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 10px;
		color: #c7d7d1;
		border: 0;
		border-radius: 8px;
		background: transparent;
		cursor: pointer;
	}
	.history-actions button:hover:not(:disabled),
	.history-actions button:focus-visible {
		color: #56e6ad;
		background: #10251e;
	}
	.history-actions button:disabled {
		opacity: 0.38;
		cursor: not-allowed;
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
		grid-template-columns: repeat(5, minmax(0, 1fr));
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
	.filter-panel {
		margin: 14px 0 16px;
		border: 1px solid #1d3730;
		border-radius: 13px;
		background: #091512;
		overflow: hidden;
	}
	.filter-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 9px 11px 7px;
		color: #82978f;
		font-size: 0.68rem;
		font-weight: 750;
		letter-spacing: 0.03em;
	}
	.filter-heading span {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: #a8bab4;
	}
	.filter-heading small {
		font-size: 0.65rem;
		font-weight: 650;
	}
	.filters {
		display: flex;
		overflow-x: auto;
		scrollbar-width: none;
		border-top: 1px solid #17302a;
	}
	.filters::-webkit-scrollbar {
		display: none;
	}
	.filters button {
		position: relative;
		display: inline-flex;
		flex: 1 0 auto;
		align-items: center;
		justify-content: center;
		gap: 6px;
		min-height: 39px;
		border: 0;
		border-right: 1px solid #17302a;
		color: #91a29d;
		background: transparent;
		padding: 8px 9px;
		font-size: 0.72rem;
		font-weight: 700;
	}
	.filters button:last-child {
		border-right: 0;
	}
	.filters button strong {
		display: grid;
		place-items: center;
		min-width: 19px;
		height: 19px;
		padding: 0 5px;
		border-radius: 6px;
		color: #71857e;
		background: #10201c;
		font-size: 0.64rem;
	}
	.filters button.active {
		color: #62e8b5;
		background: #10251e;
		box-shadow: inset 0 -2px #4fe0aa;
	}
	.filters button.active strong {
		color: #05130e;
		background: #57e3ad;
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
	.save-control {
		display: grid;
		justify-items: center;
		gap: 4px;
	}
	.save-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		height: 43px;
		padding: 0 14px;
		color: #07130f;
		border: 0;
		border-radius: 11px;
		background: #57e3ad;
		font-weight: 850;
		white-space: nowrap;
	}
	.save-button.error {
		color: #ffd0cb;
		border: 1px solid #70403c;
		background: #2a1716;
	}
	.save-control small {
		min-height: 1em;
		max-width: 180px;
		overflow: hidden;
		color: #6f887f;
		font-size: 0.62rem;
		line-height: 1;
		text-align: center;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.save-control small.error {
		color: #e49c94;
	}
	.save-button :global(.spin) {
		animation: spin 1s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.editor-status label {
		min-width: 130px;
	}
	.schedule-card {
		display: grid;
		grid-template-columns: auto minmax(220px, 320px) 1fr;
		gap: 14px;
		align-items: center;
		margin: -4px 0 22px;
		padding: 14px 16px;
		color: #f1c460;
		border: 1px solid #5b451c;
		border-radius: 13px;
		background: #20190d;
	}
	.schedule-card p {
		margin: 0;
		color: #c9b88f;
		font-size: 13px;
		line-height: 1.5;
	}
	.schedule-card.archived-note {
		grid-template-columns: auto 1fr;
		color: #9eb0a9;
		border-color: #31443e;
		background: #111a18;
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
	.story-field {
		display: grid;
		gap: 7px;
	}
	.cover-field {
		padding: 14px;
		border: 1px solid #263f38;
		border-radius: 13px;
		background: #0a1613;
	}
	.cover-field-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
	}
	.cover-field-heading span,
	.cover-field-heading small {
		display: block;
	}
	.cover-field-heading span {
		color: #dfeae6;
		font-size: 0.83rem;
		font-weight: 750;
	}
	.cover-field-heading small {
		margin-top: 3px;
		color: #71867f;
		font-size: 0.72rem;
	}
	.cover-actions {
		display: flex;
		gap: 7px;
	}
	.cover-actions button {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 9px 11px;
		color: #bdeedf;
		border: 1px solid #2e6653;
		border-radius: 9px;
		background: #10281f;
		font-size: 0.78rem;
		font-weight: 750;
	}
	.cover-actions .remove-cover {
		color: #e7a5a5;
		border-color: #573032;
		background: #241315;
	}
	.cover-summary {
		display: grid;
		grid-template-columns: 92px minmax(0, 1fr);
		gap: 12px;
		align-items: center;
		margin-top: 13px;
	}
	.cover-summary img {
		width: 92px;
		height: 64px;
		object-fit: cover;
		border-radius: 9px;
		background: #14231f;
	}
	.cover-summary strong,
	.cover-summary span,
	.cover-summary em {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.cover-summary strong {
		color: #d9e7e2;
		font-size: 0.8rem;
	}
	.cover-summary span {
		margin: 3px 0;
		color: #91a59e;
		font-size: 0.74rem;
	}
	.cover-summary em {
		color: #a9945f;
		font-size: 0.68rem;
		font-style: normal;
	}
	.cover-summary em.connected {
		color: #e0b75d;
	}
	.cover-empty {
		margin: 12px 0 0;
		color: #748980;
		font-size: 0.76rem;
	}
	.story-field > small {
		color: #6f847d;
		font-size: 0.75rem;
	}
	.story-toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		padding: 7px;
		border: 1px solid #263f38;
		border-bottom: 0;
		border-radius: 11px 11px 0 0;
		background: #0c1916;
	}
	.story-toolbar button {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		padding: 0;
		color: #9fb2ac;
		border: 1px solid transparent;
		border-radius: 8px;
		background: transparent;
	}
	.story-toolbar button:hover,
	.story-toolbar button:focus-visible {
		color: #61e6b3;
		border-color: #2b5c4b;
		background: #112a22;
		outline: 0;
	}
	.story-field .story-body {
		border-radius: 0 0 11px 11px;
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
	.preview-body :global(ol),
	.preview-body :global(ul) {
		padding-left: 1.4rem;
	}
	.preview-body :global(blockquote) {
		margin: 1rem 0;
		padding: 0.2rem 0 0.2rem 1rem;
		border-left: 3px solid #42c994;
		color: #a9bbb5;
	}
	.preview-body :global(pre) {
		overflow-x: auto;
		padding: 12px;
		border: 1px solid #29423a;
		border-radius: 10px;
		background: #07100e;
		font-size: 0.8rem;
	}
	.preview-body :global(hr) {
		border: 0;
		border-top: 1px solid #2b443c;
		margin: 1.4rem 0;
	}
	.preview-body :global(.table-scroll) {
		overflow-x: auto;
		margin: 1rem 0;
	}
	.preview-body :global(table) {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}
	.preview-body :global(th),
	.preview-body :global(td) {
		padding: 0.6rem 0.7rem;
		text-align: left;
		border: 1px solid #29423a;
	}
	.preview-body :global(th) {
		background: #10201b;
	}
	.preview-body :global(.markdown-callout) {
		margin: 1rem 0;
		padding: 0.8rem 0.9rem;
		border: 1px solid #2e5d4d;
		border-radius: 10px;
		background: #0b1b16;
	}
	.preview-body :global(.markdown-callout strong) {
		display: block;
		margin-bottom: 0.25rem;
		color: #56e6ad;
	}
	.preview-body :global(.footnotes) {
		margin-top: 1.5rem;
		padding-top: 0.8rem;
		border-top: 1px solid #29423a;
		font-size: 0.86rem;
	}
	.preview-body :global(.footnote-ref a) {
		color: #56e6ad;
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
		.content-stats {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.schedule-card {
			grid-template-columns: auto 1fr;
		}
		.schedule-card p {
			grid-column: 1 / -1;
		}
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
