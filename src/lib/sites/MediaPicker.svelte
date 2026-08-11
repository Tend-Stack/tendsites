<script lang="ts">
	import { onMount } from 'svelte';
	import { Image as ImageIcon, LoaderCircle, Search, X } from '@lucide/svelte';

	import type { HostImageItem, HostImageLibrary, HostMediaBridge } from './host-media';

	let {
		media,
		onselect,
		onclose
	}: {
		media: HostMediaBridge;
		onselect: (image: HostImageItem, alt: string) => void;
		onclose: () => void;
	} = $props();

	let libraries = $state<HostImageLibrary[]>([]);
	let libraryId = $state('');
	let images = $state<HostImageItem[]>([]);
	let query = $state('');
	let selected = $state<HostImageItem | null>(null);
	let altText = $state('');
	let nextCursor = $state<string | null>(null);
	let total = $state(0);
	let loading = $state(true);
	let loadingMore = $state(false);
	let error = $state('');

	onMount(() => {
		void loadLibraries();
	});

	async function loadLibraries() {
		loading = true;
		error = '';
		try {
			libraries = await media.listImageLibraries();
			libraryId = libraries[0]?.id ?? '';
			if (libraryId) await loadImages(true);
		} catch (reason) {
			error =
				reason instanceof Error ? reason.message : 'Your Files libraries could not be loaded.';
		} finally {
			loading = false;
		}
	}

	async function loadImages(reset: boolean) {
		if (!libraryId) return;
		if (reset) {
			loading = true;
			selected = null;
			altText = '';
		} else {
			loadingMore = true;
		}
		error = '';
		try {
			const page = await media.listImages(libraryId, {
				query: query.trim() || undefined,
				cursor: reset ? null : nextCursor
			});
			images = reset ? page.items : [...images, ...page.items];
			total = page.total;
			nextCursor = page.nextCursor;
		} catch (reason) {
			error = reason instanceof Error ? reason.message : 'Images could not be loaded.';
		} finally {
			loading = false;
			loadingMore = false;
		}
	}

	function choose(image: HostImageItem) {
		selected = image;
		altText = image.description.trim();
	}

	function confirmSelection() {
		if (!selected || !altText.trim()) return;
		onselect(selected, altText.trim());
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') onclose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="media-backdrop" role="presentation">
	<div class="media-dialog" role="dialog" aria-modal="true" aria-labelledby="media-title">
		<header>
			<div>
				<span>tend.host Files</span>
				<h2 id="media-title">Choose a cover image</h2>
				<p>Browse images you already indexed in Files. Source paths stay private.</p>
			</div>
			<button class="icon-button" type="button" aria-label="Close image picker" onclick={onclose}
				><X size={20} /></button
			>
		</header>

		<div class="media-controls">
			<label>
				<span>Library</span>
				<select
					bind:value={libraryId}
					disabled={libraries.length === 0}
					onchange={() => void loadImages(true)}
				>
					{#each libraries as library (library.id)}
						<option value={library.id}>{library.name} · {library.itemCount}</option>
					{/each}
				</select>
			</label>
			<form
				onsubmit={(event) => {
					event.preventDefault();
					void loadImages(true);
				}}
			>
				<label for="media-search">Search this library</label>
				<div>
					<Search size={17} /><input
						id="media-search"
						bind:value={query}
						placeholder="Search images"
					/><button type="submit">Search</button>
				</div>
			</form>
		</div>

		{#if loading}
			<div class="media-state">
				<LoaderCircle class="spin" size={28} />
				<p>Loading your images…</p>
			</div>
		{:else if error}
			<div class="media-state error">
				<p>{error}</p>
				<button type="button" onclick={loadLibraries}>Try again</button>
			</div>
		{:else if libraries.length === 0}
			<div class="media-state">
				<ImageIcon size={30} />
				<h3>No Files libraries yet</h3>
				<p>Create and scan a library in tend.host Files, then return here.</p>
			</div>
		{:else if images.length === 0}
			<div class="media-state">
				<ImageIcon size={30} />
				<h3>No images found</h3>
				<p>Try another library or search.</p>
			</div>
		{:else}
			<div class="media-body">
				<div class="image-results" aria-label="Image results">
					<div class="result-summary">
						<span>{total} image{total === 1 ? '' : 's'}</span><small>Newest first</small>
					</div>
					<div class="image-grid">
						{#each images as image (image.id)}
							<button
								type="button"
								class:selected={selected?.id === image.id}
								aria-pressed={selected?.id === image.id}
								onclick={() => choose(image)}
							>
								<img src={image.thumbnailUrl} alt="" />
								<span>{image.name}</span>
							</button>
						{/each}
					</div>
					{#if nextCursor}<button
							class="load-more"
							type="button"
							disabled={loadingMore}
							onclick={() => void loadImages(false)}
							>{loadingMore ? 'Loading…' : 'Load more'}</button
						>{/if}
				</div>
				<aside class="selection-panel">
					{#if selected}
						<img src={selected.contentUrl} alt="" />
						<strong>{selected.name}</strong>
						<label for="media-alt">Image description</label>
						<textarea
							id="media-alt"
							bind:value={altText}
							rows="4"
							placeholder="Describe what matters in the image"></textarea>
						<small>Required for visitors using screen readers.</small>
						<p>
							<b>Connected preview.</b> Copying this image into the site repository is still pending.
						</p>
						<button
							class="confirm"
							type="button"
							disabled={!altText.trim()}
							onclick={confirmSelection}>Use image</button
						>
					{:else}
						<div class="selection-empty">
							<ImageIcon size={28} />
							<p>Select an image to review it and write accessible alt text.</p>
						</div>
					{/if}
				</aside>
			</div>
		{/if}
	</div>
</div>

<style>
	.media-backdrop {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: grid;
		place-items: center;
		padding: 22px;
		background: rgb(1 8 6 / 0.82);
		backdrop-filter: blur(9px);
	}
	.media-dialog {
		width: min(1120px, 100%);
		max-height: min(860px, calc(100vh - 44px));
		overflow: auto;
		color: #edf7f3;
		border: 1px solid #245442;
		border-radius: 22px;
		background: #07110e;
		box-shadow: 0 28px 90px rgb(0 0 0 / 0.55);
	}
	header {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 20px;
		padding: 24px 26px 20px;
		border-bottom: 1px solid #17342a;
	}
	header span {
		color: #58e4ae;
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.15em;
		text-transform: uppercase;
	}
	h2 {
		margin: 5px 0;
		font-size: clamp(1.5rem, 3vw, 2.2rem);
	}
	header p {
		margin: 0;
		color: #91a49e;
	}
	button,
	input,
	select,
	textarea {
		font: inherit;
	}
	button {
		cursor: pointer;
	}
	.icon-button {
		display: grid;
		place-items: center;
		min-width: 40px;
		height: 40px;
		color: #b6c7c1;
		border: 1px solid #29443b;
		border-radius: 11px;
		background: transparent;
	}
	.media-controls {
		display: grid;
		grid-template-columns: minmax(190px, 0.5fr) minmax(260px, 1fr);
		gap: 14px;
		padding: 18px 26px;
		border-bottom: 1px solid #17342a;
	}
	.media-controls label,
	.selection-panel label {
		display: block;
		margin-bottom: 6px;
		color: #9fb0aa;
		font-size: 0.78rem;
		font-weight: 700;
	}
	.media-controls select,
	.media-controls form > div,
	textarea {
		width: 100%;
		color: #eef6f2;
		border: 1px solid #29463c;
		border-radius: 11px;
		background: #0b1814;
	}
	.media-controls select {
		height: 43px;
		padding: 0 11px;
	}
	.media-controls form > div {
		display: flex;
		align-items: center;
		padding-left: 11px;
	}
	.media-controls input {
		min-width: 0;
		flex: 1;
		padding: 10px;
		color: #eef6f2;
		border: 0;
		outline: 0;
		background: transparent;
	}
	.media-controls form button,
	.load-more,
	.media-state button {
		padding: 9px 14px;
		color: #07110e;
		border: 0;
		border-radius: 9px;
		background: #58e4ae;
		font-weight: 800;
	}
	.media-controls form button {
		margin-right: 4px;
	}
	.media-body {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 310px;
		min-height: 470px;
	}
	.image-results {
		min-width: 0;
		padding: 20px 24px 26px;
	}
	.result-summary {
		display: flex;
		justify-content: space-between;
		margin-bottom: 13px;
		color: #9db0aa;
	}
	.result-summary small {
		color: #667d75;
	}
	.image-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 12px;
	}
	.image-grid button {
		min-width: 0;
		padding: 6px;
		text-align: left;
		color: #cbd9d4;
		border: 1px solid #1d3930;
		border-radius: 13px;
		background: #0b1613;
	}
	.image-grid button:hover,
	.image-grid button.selected {
		border-color: #54dda9;
		box-shadow: 0 0 0 2px rgb(84 221 169 / 0.12);
	}
	.image-grid img {
		display: block;
		width: 100%;
		aspect-ratio: 4 / 3;
		object-fit: cover;
		border-radius: 9px;
		background: #14231f;
	}
	.image-grid span {
		display: block;
		padding: 8px 5px 4px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.79rem;
	}
	.load-more {
		display: block;
		margin: 18px auto 0;
	}
	.selection-panel {
		padding: 20px;
		border-left: 1px solid #17342a;
		background: #091512;
	}
	.selection-panel > img {
		width: 100%;
		max-height: 220px;
		object-fit: cover;
		border-radius: 13px;
		background: #14231f;
	}
	.selection-panel > strong {
		display: block;
		margin: 12px 0 18px;
		overflow-wrap: anywhere;
	}
	.selection-panel textarea {
		box-sizing: border-box;
		resize: vertical;
		padding: 11px;
		line-height: 1.45;
	}
	.selection-panel small {
		display: block;
		margin-top: 6px;
		color: #788e86;
	}
	.selection-panel p {
		margin: 18px 0;
		padding: 11px;
		color: #c9b98d;
		border: 1px solid #58481f;
		border-radius: 10px;
		background: #1c180d;
		font-size: 0.78rem;
		line-height: 1.45;
	}
	.confirm {
		width: 100%;
		padding: 12px;
		color: #06120e;
		border: 0;
		border-radius: 11px;
		background: #58e4ae;
		font-weight: 850;
	}
	.confirm:disabled,
	button:disabled {
		cursor: not-allowed;
		opacity: 0.45;
	}
	.selection-empty,
	.media-state {
		display: grid;
		place-items: center;
		align-content: center;
		min-height: 360px;
		padding: 30px;
		color: #81978f;
		text-align: center;
	}
	.media-state {
		min-height: 470px;
	}
	.media-state h3,
	.media-state p {
		margin: 7px 0;
	}
	.media-state.error {
		color: #f0a69f;
	}
	:global(.spin) {
		animation: spin 1s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (max-width: 820px) {
		.media-body {
			grid-template-columns: 1fr;
		}
		.selection-panel {
			border-top: 1px solid #17342a;
			border-left: 0;
		}
		.image-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 560px) {
		.media-backdrop {
			padding: 0;
		}
		.media-dialog {
			max-height: 100vh;
			min-height: 100vh;
			border-radius: 0;
		}
		.media-controls {
			grid-template-columns: 1fr;
			padding: 15px;
		}
		header {
			padding: 18px 15px;
		}
		.image-results {
			padding: 15px;
		}
	}
</style>
