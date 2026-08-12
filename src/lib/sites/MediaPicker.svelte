<script lang="ts">
	import { onMount } from 'svelte';
	import {
		ArrowLeft,
		Check,
		Crop,
		FolderOpen,
		Gauge,
		Image as ImageIcon,
		LoaderCircle,
		Move,
		RotateCcw,
		Search,
		ShieldCheck,
		Upload,
		X
	} from '@lucide/svelte';

	import type { DemoImagePresentation } from './demo-site';
	import type { HostImageItem, HostImageLibrary, HostMediaBridge } from './host-media';

	let {
		media,
		onselect,
		onclose
	}: {
		media: HostMediaBridge;
		onselect: (image: HostImageItem, alt: string, presentation: DemoImagePresentation) => void;
		onclose: () => void;
	} = $props();

	type SourceMode = 'files' | 'upload';
	type AspectPreset = 'wide' | 'square' | 'portrait';
	const aspectPresets = {
		wide: { label: 'Cover · 16:9', width: 1600, height: 900, hint: 'Recommended' },
		square: { label: 'Square · 1:1', width: 1200, height: 1200, hint: 'Social cards' },
		portrait: { label: 'Portrait · 4:5', width: 1200, height: 1500, hint: 'Editorial' }
	} as const;

	let sourceMode = $state<SourceMode>('files');
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
	let uploadFile = $state<File | null>(null);
	let uploadUrl = $state('');
	let aspectPreset = $state<AspectPreset>('wide');
	let fit = $state<'cover' | 'contain'>('cover');
	let focalX = $state(50);
	let focalY = $state(50);
	let zoom = $state(1);
	let quality = $state(0.84);
	let showGuides = $state(false);
	let editingFrame = $state(false);
	let dragStart = $state<{ x: number; y: number; focalX: number; focalY: number; pointerId: number } | null>(null);
	let preparing = $state(false);
	let uploadError = $state('');
	const activePreset = $derived(aspectPresets[aspectPreset]);

	onMount(() => {
		void loadLibraries();
		return () => {
			if (uploadUrl) URL.revokeObjectURL(uploadUrl);
		};
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
		} else loadingMore = true;
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
		aspectPreset = 'wide';
		fit = 'cover';
		focalX = 50;
		focalY = 50;
		zoom = 1;
		showGuides = false;
		editingFrame = true;
	}

	function chooseUpload(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0] ?? null;
		(event.currentTarget as HTMLInputElement).value = '';
		if (!file) return;
		uploadError = '';
		if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
			uploadError = 'Choose a PNG, JPEG, or WebP image.';
			return;
		}
		if (!file.size || file.size > 20 * 1024 * 1024) {
			uploadError = 'Choose a non-empty image smaller than 20 MB.';
			return;
		}
		if (uploadUrl) URL.revokeObjectURL(uploadUrl);
		uploadFile = file;
		uploadUrl = URL.createObjectURL(file);
		altText = '';
		focalX = 50;
		focalY = 50;
		zoom = 1;
		showGuides = false;
		editingFrame = true;
	}

	function openFrameEditor() {
		if (!(sourceMode === 'files' ? selected : uploadUrl)) return;
		editingFrame = true;
		showGuides = fit === 'cover';
	}

	function resetFrame() {
		fit = 'cover';
		focalX = 50;
		focalY = 50;
		zoom = 1;
	}

	function startDragging(event: PointerEvent) {
		if (fit !== 'cover') return;
		const target = event.currentTarget as HTMLElement;
		target.setPointerCapture(event.pointerId);
		dragStart = { x: event.clientX, y: event.clientY, focalX, focalY, pointerId: event.pointerId };
	}

	function dragFrame(event: PointerEvent) {
		if (!dragStart || dragStart.pointerId !== event.pointerId) return;
		const target = event.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		if (zoom === 1) zoom = 1.1;
		focalX = Math.max(0, Math.min(100, dragStart.focalX - ((event.clientX - dragStart.x) / rect.width) * 100));
		focalY = Math.max(0, Math.min(100, dragStart.focalY - ((event.clientY - dragStart.y) / rect.height) * 100));
	}

	function stopDragging(event: PointerEvent) {
		if (dragStart?.pointerId === event.pointerId) dragStart = null;
	}

	function nudgeFrame(event: KeyboardEvent) {
		if (fit !== 'cover' || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
		event.preventDefault();
		if (zoom === 1) zoom = 1.1;
		const step = event.shiftKey ? 5 : 1;
		if (event.key === 'ArrowLeft') focalX = Math.max(0, focalX - step);
		if (event.key === 'ArrowRight') focalX = Math.min(100, focalX + step);
		if (event.key === 'ArrowUp') focalY = Math.max(0, focalY - step);
		if (event.key === 'ArrowDown') focalY = Math.min(100, focalY + step);
	}

	async function confirmSelection() {
		if (!altText.trim()) return;
		if (sourceMode === 'files') {
			if (selected)
				onselect(selected, altText.trim(), { aspect: aspectPreset, fit, focalX, focalY, zoom });
			return;
		}
		if (!uploadFile || !media.prepareImage || preparing) return;
		preparing = true;
		uploadError = '';
		try {
			const prepared = await media.prepareImage(uploadFile, {
				width: activePreset.width,
				height: activePreset.height,
				fit,
				focalX,
				focalY,
				zoom,
				quality,
				maxBytes: 200 * 1024,
				background: '#071713'
			});
			onselect(
				{
					id: `device-${Date.now()}`,
					libraryId: 'device-upload',
					name: prepared.originalName.replace(/\.[^.]+$/, '') + '.webp',
					mimeType: prepared.mimeType,
					size: prepared.size,
					modifiedAt: Date.now() / 1000,
					description: '',
					thumbnailUrl: prepared.dataUrl,
					contentUrl: prepared.dataUrl
				},
				altText.trim(),
				{ aspect: aspectPreset, fit: 'cover', focalX: 50, focalY: 50, zoom: 1 }
			);
		} catch (reason) {
			uploadError = reason instanceof Error ? reason.message : 'The image could not be optimized.';
		} finally {
			preparing = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && !preparing) {
			if (editingFrame) editingFrame = false;
			else onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="media-backdrop" role="presentation">
	<div class="media-dialog" class:editing-frame={editingFrame} role="dialog" aria-modal="true" aria-labelledby="media-title">
		<header class="dialog-head">
			<div>
				<span class="eyebrow">Site media</span>
				<h2 id="media-title">Prepare a cover image</h2>
				<p>Choose an existing image or upload one, then frame it for this exact placement.</p>
			</div>
			<button
				class="icon-button"
				type="button"
				aria-label="Close image picker"
				onclick={onclose}
				disabled={preparing}><X size={20} /></button
			>
		</header>

		{#if !editingFrame}<nav class="source-tabs" aria-label="Image source">
			<button
				type="button"
				class:active={sourceMode === 'files'}
				aria-pressed={sourceMode === 'files'}
				onclick={() => (sourceMode = 'files')}
				><FolderOpen size={17} /><span><b>From Files</b><small>Indexed library</small></span
				></button
			>
			<button
				type="button"
				class:active={sourceMode === 'upload'}
				aria-pressed={sourceMode === 'upload'}
				onclick={() => (sourceMode = 'upload')}
				><Upload size={17} /><span
					><b>Upload new</b><small
						>{media.prepareImage ? 'Optimized locally' : 'Update tend.host to enable'}</small
					></span
				></button
			>
			<div class="privacy"><ShieldCheck size={16} /><span>Originals stay untouched</span></div>
		</nav>{/if}

		{#if editingFrame}
			<section class="frame-editor" aria-labelledby="frame-editor-title">
				<div class="frame-editor-head">
					<button type="button" onclick={() => (editingFrame = false)}><ArrowLeft size={17} /> Back to images</button>
					<div><span class="eyebrow">Image editor</span><h3 id="frame-editor-title">Frame the cover</h3><p>Drag the image, use arrow keys, or fine-tune the controls. Changes appear immediately.</p></div>
				</div>
				<div class="frame-editor-workspace">
					<div class="frame-stage">
						<button
							type="button"
							class="large-canvas"
							class:dragging={dragStart !== null}
							style:aspect-ratio={`${activePreset.width} / ${activePreset.height}`}
							aria-label="Image crop canvas. Drag to reposition or use the arrow keys."
							onpointerdown={startDragging}
							onpointermove={dragFrame}
							onpointerup={stopDragging}
							onpointercancel={stopDragging}
							onkeydown={nudgeFrame}
						>
							<img
								src={sourceMode === 'files' ? selected?.contentUrl : uploadUrl}
								alt=""
								draggable="false"
								style:object-fit={fit}
								style:object-position={`${focalX}% ${focalY}%`}
								style:transform={`scale(${fit === 'cover' ? zoom : 1})`}
								style:transform-origin={`${focalX}% ${focalY}%`}
							/>
							{#if showGuides && fit === 'cover'}<div class="thirds"><i></i><i></i><i></i><i></i></div>{/if}
							{#if fit === 'cover'}<div class="drag-cue"><Move size={16} /> Drag to reposition</div>{/if}
						</button>
						<p class="stage-help">Previewing {activePreset.label.toLowerCase()} · {Math.round(zoom * 100)}% zoom</p>
					</div>
					<aside class="frame-sidebar">
						<fieldset><legend>Canvas</legend><div class="preset-grid">
							{#each Object.entries(aspectPresets) as [id, preset] (id)}<button type="button" class:active={aspectPreset === id} onclick={() => (aspectPreset = id as AspectPreset)}><b>{preset.label}</b><small>{preset.hint}</small></button>{/each}
						</div></fieldset>
						<fieldset><legend>Fit</legend><div class="fit-grid">
							<button type="button" class:active={fit === 'cover'} onclick={() => (fit = 'cover')}><Crop size={16} /><span><b>Fill</b><small>Crop edges</small></span></button>
							<button type="button" class:active={fit === 'contain'} onclick={() => (fit = 'contain')}><ImageIcon size={16} /><span><b>Fit</b><small>Keep all</small></span></button>
						</div></fieldset>
						{#if fit === 'cover'}<fieldset class="precision-controls"><legend>Position and scale</legend>
							<label class="range-row"><span>Zoom <b>{Math.round(zoom * 100)}%</b></span><input aria-label="Zoom" type="range" min="1" max="3" step="0.05" bind:value={zoom} /></label>
							<label class="range-row"><span>Horizontal <b>{Math.round(focalX)}%</b></span><input aria-label="Horizontal focal point" type="range" min="0" max="100" bind:value={focalX} /></label>
							<label class="range-row"><span>Vertical <b>{Math.round(focalY)}%</b></span><input aria-label="Vertical focal point" type="range" min="0" max="100" bind:value={focalY} /></label>
							<button class="guide-toggle" type="button" aria-pressed={showGuides} onclick={() => (showGuides = !showGuides)}>{showGuides ? 'Hide crop guide' : 'Show crop guide'}</button>
						</fieldset>{/if}
						{#if sourceMode === 'upload'}<fieldset><legend>Optimization</legend><label class="quality"><Gauge size={17} /><span><b>{quality >= 0.9 ? 'High detail' : quality >= 0.78 ? 'Balanced' : 'Smaller file'}</b><small>WebP · target under 200 KB</small></span><input aria-label="Image quality" type="range" min=".68" max=".92" step=".04" bind:value={quality} /></label></fieldset>{/if}
						<label class="editor-alt" for="editor-alt">Image description</label><textarea id="editor-alt" bind:value={altText} rows="3" placeholder="Describe what matters in the image"></textarea><small class="alt-help">Required for visitors using screen readers.</small>
						<div class="editor-actions"><button type="button" onclick={resetFrame}><RotateCcw size={16} /> Reset</button><button type="button" class="done" onclick={() => (editingFrame = false)}><Check size={16} /> Done framing</button></div>
					</aside>
				</div>
			</section>
		{:else if sourceMode === 'files'}
			<div class="library-controls">
				<div class="library-field">
					<label for="media-library">Library</label><select
						id="media-library"
						bind:value={libraryId}
						disabled={libraries.length === 0}
						onchange={() => void loadImages(true)}
						>{#each libraries as library (library.id)}<option value={library.id}
								>{library.name} · {library.itemCount}</option
							>{/each}</select
					>
				</div>
				<form
					onsubmit={(event) => {
						event.preventDefault();
						void loadImages(true);
					}}
				>
					<label for="media-search">Search</label>
					<div class="search-row">
						<div class="search-input">
							<Search size={17} /><input
								id="media-search"
								bind:value={query}
								placeholder="Search images"
							/>
						</div>
						<button type="submit">Search</button>
					</div>
				</form>
			</div>
			<div class="workspace">
				<section class="asset-browser">
					{#if loading}<div class="media-state">
							<LoaderCircle class="spin" size={28} />
							<p>Loading your images…</p>
						</div>
					{:else if error}<div class="media-state error">
							<p>{error}</p>
							<button type="button" onclick={loadLibraries}>Try again</button>
						</div>
					{:else if libraries.length === 0}<div class="media-state">
							<ImageIcon size={30} />
							<h3>No Files libraries yet</h3>
							<p>Create and scan a library in tend.host Files, or use Upload new.</p>
						</div>
					{:else if images.length === 0}<div class="media-state">
							<ImageIcon size={30} />
							<h3>No images found</h3>
							<p>Try another library or search.</p>
						</div>
					{:else}
						<div class="result-summary">
							<span>{total} image{total === 1 ? '' : 's'}</span><small>Newest first</small>
						</div>
						<div class="image-grid">
							{#each images as image (image.id)}<button
									type="button"
									class:selected={selected?.id === image.id}
									aria-pressed={selected?.id === image.id}
									aria-label={image.name}
									onclick={() => choose(image)}
									><img src={image.thumbnailUrl} alt="" /><span>{image.name}</span
									>{#if selected?.id === image.id}<i><Check size={14} /></i>{/if}</button
								>{/each}
						</div>
						{#if nextCursor}<button
								class="load-more"
								type="button"
								disabled={loadingMore}
								onclick={() => void loadImages(false)}
								>{loadingMore ? 'Loading…' : 'Load more'}</button
							>{/if}
					{/if}
				</section>
				<aside class="inspector">
					{#if selected}<div
							class="mini-preview"
							style:aspect-ratio={`${activePreset.width} / ${activePreset.height}`}
						>
							<img
								src={selected.contentUrl}
								alt=""
								style:object-fit={fit}
								style:object-position={`${focalX}% ${focalY}%`}
							/>
							{#if showGuides && fit === 'cover'}<div class="thirds">
									<i></i><i></i><i></i><i></i>
								</div>{/if}
						</div>
						<strong>{selected.name}</strong>
						<button class="open-editor" type="button" onclick={openFrameEditor}><Crop size={17} /><span><b>Edit framing</b><small>{activePreset.label} · {Math.round(zoom * 100)}% zoom</small></span></button>
						<label for="media-alt">Image description</label><textarea
							id="media-alt"
							bind:value={altText}
							rows="4"
							placeholder="Describe what matters in the image"></textarea><small
							>Required for visitors using screen readers.</small
						>
						<div class="guide">
							<ShieldCheck size={17} />
							<p>
								<b>Connected preview</b><span
									>The repository copy is created by the publish workflow.</span
								>
							</p>
						</div>
					{:else}<div class="selection-empty">
							<ImageIcon size={28} />
							<p>Select an image to review it and write accessible alt text.</p>
						</div>{/if}
				</aside>
			</div>
		{:else if !media.prepareImage}
			<section class="capability-state">
				<div>
					<Upload size={28} /><span
						><b>Upload needs the current tend.host media service</b><small
							>Your existing Files library still works. Update the host, then reopen TEND Sites to
							optimize new images locally.</small
						></span
					>
				</div>
				<button type="button" onclick={() => (sourceMode = 'files')}
					><FolderOpen size={16} /> Browse Files instead</button
				>
			</section>
		{:else}
			<div class="upload-workspace">
				<section class="canvas-panel">
					<div class="canvas-head">
						<div>
							<span class="step">1</span>
							<p>
								<b>Choose and frame</b><small
									>{activePreset.label} · {fit === 'cover'
										? 'fills the canvas'
										: 'shows the whole image'}</small
								>
							</p>
						</div>
						<label class="upload-button"
							><Upload size={16} />{uploadFile ? 'Choose another' : 'Choose image'}<input
								type="file"
								accept="image/png,image/jpeg,image/webp"
								onchange={chooseUpload}
							/></label
						>
					</div>
					{#if uploadUrl}<div
							class="image-canvas"
							style:aspect-ratio={`${activePreset.width} / ${activePreset.height}`}
						>
							<img
								src={uploadUrl}
								alt=""
								style:object-fit={fit}
								style:object-position={`${focalX}% ${focalY}%`}
								style:transform={`scale(${fit === 'cover' ? zoom : 1})`}
								style:transform-origin={`${focalX}% ${focalY}%`}
							/>
							{#if showGuides && fit === 'cover'}<div class="thirds">
									<i></i><i></i><i></i><i></i>
								</div>{/if}
						</div>
						<div class="canvas-note">
							<span>Open the full editor to drag, zoom, and position the image.</span>
							<button type="button" class="edit-framing-link" onclick={openFrameEditor}><Crop size={15} /> Edit framing</button>
							{#if fit === 'cover'}<button
									type="button"
									aria-pressed={showGuides}
									onclick={() => (showGuides = !showGuides)}
									>{showGuides ? 'Hide guide' : 'Show crop guide'}</button
								>{/if}
						</div>
					{:else}<label class="drop-zone"
							><Upload size={32} /><b>Upload a new image</b><span
								>PNG, JPEG, or WebP · up to 20 MB</span
							><input
								type="file"
								accept="image/png,image/jpeg,image/webp"
								onchange={chooseUpload}
							/></label
						>{/if}
					{#if uploadError}<p class="upload-error" aria-live="polite">{uploadError}</p>{/if}
				</section>
				<aside class="edit-panel">
					<div class="panel-title">
						<span class="step">2</span>
						<p><b>Fit and optimize</b><small>A reusable tend.host image pipeline</small></p>
					</div>
					<fieldset>
						<legend>Canvas</legend>
						<div class="preset-grid">
							{#each Object.entries(aspectPresets) as [id, preset] (id)}<button
									type="button"
									class:active={aspectPreset === id}
									onclick={() => (aspectPreset = id as AspectPreset)}
									><b>{preset.label}</b><small>{preset.hint}</small></button
								>{/each}
						</div>
					</fieldset>
					<fieldset>
						<legend>Fit</legend>
						<div class="fit-grid">
							<button type="button" class:active={fit === 'cover'} onclick={() => (fit = 'cover')}
								><Crop size={16} /><span><b>Fill</b><small>Crop edges</small></span></button
							><button
								type="button"
								class:active={fit === 'contain'}
								onclick={() => (fit = 'contain')}
								><ImageIcon size={16} /><span><b>Fit</b><small>Keep all</small></span></button
							>
						</div>
					</fieldset>
					{#if fit === 'cover'}<fieldset>
							<legend>Focal point</legend><label class="range-row"
								><span>Horizontal</span><input
									type="range"
									min="0"
									max="100"
									bind:value={focalX}
								/></label
							><label class="range-row"
								><span>Vertical</span><input
									type="range"
									min="0"
									max="100"
									bind:value={focalY}
								/></label
							>
						</fieldset>{/if}
					<fieldset>
						<legend>Optimization</legend><label class="quality"
							><Gauge size={17} /><span
								><b
									>{quality >= 0.9
										? 'High detail'
										: quality >= 0.78
											? 'Balanced'
											: 'Smaller file'}</b
								><small>WebP · target under 200 KB</small></span
							><input type="range" min=".68" max=".92" step=".04" bind:value={quality} /></label
						>
					</fieldset>
					<label for="upload-alt">Image description</label><textarea
						id="upload-alt"
						bind:value={altText}
						rows="3"
						placeholder="Describe what matters in the image"></textarea><small class="alt-help"
						>Required for visitors using screen readers.</small
					>
				</aside>
			</div>
		{/if}

		<footer class="action-bar">
			<div>
				<ShieldCheck size={16} /><span
					><b>Safe preparation</b><small
						>Metadata is removed and the original remains unchanged.</small
					></span
				>
			</div>
			<button type="button" class="secondary" onclick={onclose} disabled={preparing}>Cancel</button
			><button
				type="button"
				class="confirm"
				disabled={!altText.trim() ||
					(sourceMode === 'files' ? !selected : !uploadFile || !media.prepareImage) ||
					preparing}
				onclick={() => void confirmSelection()}
				>{#if preparing}<LoaderCircle class="spin" size={17} />Optimizing…{:else}<Check
						size={17}
					/>Use image{/if}</button
			>
		</footer>
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
		background: rgb(1 8 6/0.84);
		backdrop-filter: blur(14px);
	}
	.media-dialog {
		width: min(1180px, 100%);
		max-height: min(900px, calc(100dvh - 44px));
		display: flex;
		flex-direction: column;
		overflow: hidden;
		color: #edf7f3;
		border: 1px solid #245442;
		border-radius: 24px;
		background: #07110e;
		box-shadow: 0 32px 110px #000b;
	}
	.media-dialog.editing-frame {
		width: min(1500px, calc(100vw - 32px));
		max-height: calc(100dvh - 32px);
		height: min(960px, calc(100dvh - 32px));
	}
	.frame-editor {
		min-height: 0;
		display: flex;
		flex: 1;
		flex-direction: column;
		overflow: hidden;
	}
	.frame-editor-head {
		display: flex;
		align-items: center;
		gap: 18px;
		padding: 12px 20px;
		border-bottom: 1px solid #17342a;
		background: #081410;
	}
	.frame-editor-head > button {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 8px 11px;
		color: #b9d5cb;
		border: 1px solid #2b5546;
		border-radius: 10px;
		background: #0d211a;
		font-size: .72rem;
		font-weight: 800;
	}
	.frame-editor-head h3,
	.frame-editor-head p {
		margin: 0;
	}
	.frame-editor-head h3 { font-size: 1rem; }
	.frame-editor-head p { color: #789087; font-size: .68rem; }
	.frame-editor-workspace {
		min-height: 0;
		display: grid;
		grid-template-columns: minmax(0, 1fr) 360px;
		flex: 1;
		overflow: hidden;
	}
	.frame-stage {
		min-width: 0;
		display: grid;
		place-items: center;
		align-content: center;
		padding: 28px;
		overflow: auto;
		background: radial-gradient(circle at 50% 45%, #16362c, #06100d 68%);
	}
	.large-canvas {
		position: relative;
		width: min(100%, 1040px);
		max-height: calc(100dvh - 330px);
		padding: 0;
		overflow: hidden;
		border: 1px solid #4a806c;
		border-radius: 18px;
		background: #071713;
		box-shadow: 0 24px 70px #000a;
		cursor: grab;
		touch-action: none;
		user-select: none;
	}
	.large-canvas:focus-visible { outline: 3px solid #58e4ae; outline-offset: 4px; }
	.large-canvas.dragging { cursor: grabbing; }
	.large-canvas img {
		display: block;
		width: 100%;
		height: 100%;
		pointer-events: none;
		transition: transform .08s ease-out, object-position .08s ease-out;
	}
	.large-canvas.dragging img { transition: none; }
	.drag-cue {
		position: absolute;
		left: 50%;
		bottom: 14px;
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 7px 10px;
		color: #e9fff7;
		border: 1px solid #ffffff26;
		border-radius: 99px;
		background: #04100ccd;
		font-size: .68rem;
		font-weight: 800;
		transform: translateX(-50%);
		pointer-events: none;
	}
	.stage-help { margin: 12px 0 0; color: #789087; font-size: .7rem; }
	.frame-sidebar {
		padding: 18px;
		border-left: 1px solid #17342a;
		background: #091512;
		overflow: auto;
	}
	.frame-sidebar fieldset { padding: 0; margin: 0 0 17px; border: 0; }
	.frame-sidebar legend { margin-bottom: 7px; color: #91a69e; font-size: .65rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
	.frame-sidebar textarea { width: 100%; box-sizing: border-box; padding: 10px; resize: vertical; line-height: 1.4; color: #eef6f2; border: 1px solid #29463c; border-radius: 11px; background: #0b1814; }
	.editor-alt { display: block; margin-bottom: 6px; color: #9fb0aa; font-size: .72rem; font-weight: 750; }
	.precision-controls .range-row { grid-template-columns: 110px minmax(0, 1fr); }
	.precision-controls .range-row span { display: flex; justify-content: space-between; gap: 6px; }
	.precision-controls .range-row b { color: #69e4b5; font-size: .65rem; }
	.guide-toggle { width: 100%; margin-top: 8px; padding: 8px; color: #9fdac6; border: 1px solid #2b5949; border-radius: 9px; background: #0d241c; font-size: .68rem; font-weight: 800; }
	.editor-actions { display: grid; grid-template-columns: auto 1fr; gap: 9px; margin-top: 18px; }
	.editor-actions button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 10px 12px; color: #b9d5cb; border: 1px solid #2a5143; border-radius: 10px; background: #0b1b16; font-weight: 800; }
	.editor-actions button.done { color: #06140f; border-color: #58e4ae; background: #58e4ae; }
	.dialog-head {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 20px;
		padding: 15px 20px 13px;
		border-bottom: 1px solid #17342a;
	}
	.eyebrow {
		color: #58e4ae;
		font-size: 0.68rem;
		font-weight: 850;
		letter-spacing: 0.15em;
		text-transform: uppercase;
	}
	h2 {
		margin: 2px 0;
		font-size: clamp(1.3rem, 2.5vw, 1.72rem);
	}
	.dialog-head p {
		margin: 0;
		color: #91a49e;
		font-size: 0.78rem;
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
		width: 38px;
		height: 38px;
		display: grid;
		place-items: center;
		flex: none;
		color: #b6c7c1;
		border: 1px solid #29443b;
		border-radius: 13px;
		background: #0b1814;
	}
	.source-tabs {
		display: flex;
		align-items: stretch;
		gap: 8px;
		padding: 8px 20px;
		border-bottom: 1px solid #17342a;
		background: #081410;
	}
	.source-tabs > button {
		min-width: 158px;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 7px 10px;
		color: #a7b9b3;
		border: 1px solid transparent;
		border-radius: 12px;
		background: transparent;
		text-align: left;
	}
	.source-tabs > button.active {
		color: #70e9ba;
		border-color: #2b5e4a;
		background: #10251e;
	}
	.source-tabs > button > span,
	.privacy span {
		display: flex;
		flex-direction: column;
	}
	.source-tabs b,
	.privacy span {
		font-size: 0.76rem;
	}
	.source-tabs small {
		margin-top: 2px;
		color: #6f857d;
		font-size: 0.62rem;
	}
	.privacy {
		display: flex;
		align-items: center;
		gap: 7px;
		margin-left: auto;
		color: #789087;
		font-size: 0.7rem;
	}
	.library-controls {
		display: grid;
		grid-template-columns: minmax(190px, 280px) minmax(280px, 520px);
		align-items: end;
		gap: 12px;
		padding: 10px 20px;
		border-bottom: 1px solid #17342a;
	}
	.library-controls label,
	.inspector label,
	.edit-panel > label {
		display: block;
		margin-bottom: 6px;
		color: #9fb0aa;
		font-size: 0.72rem;
		font-weight: 750;
	}
	.library-field,
	.library-controls form {
		display: grid;
		grid-template-rows: auto 42px;
		gap: 6px;
	}
	.library-controls .library-field > label,
	.library-controls form > label {
		margin: 0;
	}
	.library-controls select,
	.search-input,
	textarea {
		width: 100%;
		box-sizing: border-box;
		color: #eef6f2;
		border: 1px solid #29463c;
		border-radius: 11px;
		background: #0b1814;
	}
	.library-controls select {
		height: 42px;
		padding: 0 11px;
	}
	.search-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		height: 42px;
		gap: 8px;
	}
	.search-input {
		display: flex;
		align-items: center;
		padding-left: 11px;
	}
	.library-controls input {
		min-width: 0;
		flex: 1;
		padding: 10px;
		color: inherit;
		border: 0;
		outline: 0;
		background: transparent;
	}
	.library-controls form button,
	.load-more {
		padding: 8px 13px;
		color: #07110e;
		border: 0;
		border-radius: 9px;
		background: #58e4ae;
		font-weight: 800;
	}
	.library-controls form button {
		min-width: 84px;
	}
	.workspace {
		min-height: 0;
		display: grid;
		grid-template-columns: minmax(0, 1fr) 370px;
		flex: 1;
		overflow: hidden;
	}
	.asset-browser {
		min-width: 0;
		overflow: auto;
		padding: 18px 20px;
	}
	.result-summary {
		display: flex;
		justify-content: space-between;
		margin-bottom: 12px;
		color: #9db0aa;
		font-size: 0.78rem;
	}
	.result-summary small {
		color: #667d75;
	}
	.image-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 10px;
	}
	.image-grid button {
		position: relative;
		min-width: 0;
		padding: 5px;
		color: #cbd9d4;
		border: 1px solid #1d3930;
		border-radius: 13px;
		background: #0b1613;
		text-align: left;
	}
	.image-grid button:hover,
	.image-grid button.selected {
		border-color: #54dda9;
		box-shadow: 0 0 0 2px rgb(84 221 169/0.12);
	}
	.image-grid img {
		display: block;
		width: 100%;
		aspect-ratio: 4/3;
		object-fit: cover;
		border-radius: 9px;
		background: #14231f;
	}
	.image-grid span {
		display: block;
		padding: 7px 4px 3px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.73rem;
	}
	.image-grid i {
		position: absolute;
		top: 10px;
		right: 10px;
		width: 25px;
		height: 25px;
		display: grid;
		place-items: center;
		color: #042016;
		border-radius: 99px;
		background: #58e4ae;
	}
	.load-more {
		display: block;
		margin: 16px auto 0;
	}
	.inspector {
		padding: 18px;
		border-left: 1px solid #17342a;
		background: #091512;
		overflow: auto;
	}
	.mini-preview {
		position: relative;
		display: grid;
		place-items: center;
		overflow: hidden;
		max-height: 230px;
		border-radius: 13px;
		background: #10211b;
	}
	.mini-preview img {
		width: 100%;
		height: 100%;
	}
	.inspector > strong {
		display: block;
		margin: 10px 0 12px;
		overflow-wrap: anywhere;
	}
	.inspector textarea,
	.edit-panel textarea {
		padding: 10px;
		resize: vertical;
		line-height: 1.45;
	}
	.inspector > small,
	.alt-help {
		display: block;
		margin-top: 5px;
		color: #788e86;
		font-size: 0.68rem;
	}
	.canvas-note button {
		margin-left: auto;
		padding: 6px 8px;
		color: #9fdac6;
		border: 1px solid #2b5949;
		border-radius: 8px;
		background: #0d241c;
		font-size: 0.62rem;
		font-weight: 800;
		white-space: nowrap;
	}
	.open-editor {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 12px 0 16px;
		padding: 11px 12px;
		color: #68e5b5;
		border: 1px solid #2d654f;
		border-radius: 11px;
		background: #10271f;
		text-align: left;
	}
	.open-editor span { display: flex; flex-direction: column; }
	.open-editor small { margin-top: 2px; color: #7c978d; font-size: .64rem; }
	.canvas-note .edit-framing-link { display: inline-flex; align-items: center; gap: 6px; }
	.guide {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		margin-top: 16px;
		padding: 10px;
		color: #a9c7bc;
		border: 1px solid #24483b;
		border-radius: 11px;
		background: #0d201a;
	}
	.guide p {
		display: flex;
		flex-direction: column;
		margin: 0;
		font-size: 0.7rem;
	}
	.guide span {
		margin-top: 2px;
		color: #71877f;
		line-height: 1.4;
	}
	.selection-empty,
	.media-state {
		min-height: 330px;
		display: grid;
		place-items: center;
		align-content: center;
		padding: 24px;
		color: #81978f;
		text-align: center;
	}
	.capability-state {
		min-height: 360px;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 20px;
		padding: 32px;
		text-align: center;
	}
	.capability-state > div {
		max-width: 520px;
		display: grid;
		justify-items: center;
		gap: 12px;
		color: #62e4b2;
	}
	.capability-state span {
		display: grid;
		gap: 6px;
	}
	.capability-state small {
		color: #81968e;
		line-height: 1.5;
	}
	.capability-state button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		color: #bdeedf;
		border: 1px solid #2e6653;
		border-radius: 10px;
		background: #10281f;
		font-weight: 800;
	}
	.media-state button {
		padding: 8px 12px;
		border: 0;
		border-radius: 9px;
		background: #58e4ae;
	}
	.media-state.error {
		color: #f0a69f;
	}
	.upload-workspace {
		min-height: 0;
		display: grid;
		grid-template-columns: minmax(0, 1fr) 370px;
		flex: 1;
		overflow: hidden;
	}
	.canvas-panel {
		min-width: 0;
		padding: 20px;
		overflow: auto;
		background: radial-gradient(circle at 50% 35%, #123027, #07110e 65%);
	}
	.canvas-head,
	.panel-title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 16px;
	}
	.canvas-head > div,
	.panel-title {
		display: flex;
		align-items: center;
	}
	.step {
		width: 29px;
		height: 29px;
		display: grid;
		place-items: center;
		flex: none;
		margin-right: 9px;
		color: #052017;
		border-radius: 9px;
		background: #58e4ae;
		font-size: 0.72rem;
		font-weight: 900;
	}
	.canvas-head p,
	.panel-title p {
		display: flex;
		flex-direction: column;
		margin: 0;
	}
	.canvas-head b,
	.panel-title b {
		font-size: 0.8rem;
	}
	.canvas-head small,
	.panel-title small {
		margin-top: 2px;
		color: #71877f;
		font-size: 0.66rem;
	}
	.upload-button {
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 9px 11px;
		color: #68e5b5;
		border: 1px solid #2d654f;
		border-radius: 10px;
		background: #10271f;
		font-size: 0.72rem;
		font-weight: 800;
		cursor: pointer;
	}
	.upload-button input,
	.drop-zone input {
		display: none;
	}
	.image-canvas {
		position: relative;
		width: min(100%, 760px);
		max-height: 500px;
		margin: auto;
		overflow: hidden;
		border: 1px solid #3a6d5a;
		border-radius: 16px;
		background: #071713;
		box-shadow: 0 20px 55px #0008;
	}
	.image-canvas img {
		width: 100%;
		height: 100%;
		display: block;
	}
	.thirds {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.thirds i {
		position: absolute;
		background: #fff4;
	}
	.thirds i:nth-child(1),
	.thirds i:nth-child(2) {
		top: 0;
		bottom: 0;
		width: 1px;
	}
	.thirds i:nth-child(1) {
		left: 33.333%;
	}
	.thirds i:nth-child(2) {
		left: 66.666%;
	}
	.thirds i:nth-child(3),
	.thirds i:nth-child(4) {
		right: 0;
		left: 0;
		height: 1px;
	}
	.thirds i:nth-child(3) {
		top: 33.333%;
	}
	.thirds i:nth-child(4) {
		top: 66.666%;
	}
	.canvas-note {
		display: flex;
		align-items: center;
		gap: 10px;
		width: min(100%, 760px);
		margin: 10px auto 0;
		color: #7f958d;
		font-size: 0.68rem;
	}
	.drop-zone {
		min-height: 360px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		gap: 8px;
		color: #789087;
		border: 1px dashed #32644f;
		border-radius: 18px;
		background: #0a1a15;
		cursor: pointer;
	}
	.drop-zone b {
		color: #cfe1da;
	}
	.drop-zone span {
		font-size: 0.7rem;
	}
	.upload-error {
		padding: 9px;
		color: #fda4af;
		border-radius: 9px;
		background: #3a1518;
		font-size: 0.72rem;
	}
	.edit-panel {
		padding: 18px;
		border-left: 1px solid #17342a;
		background: #091512;
		overflow: auto;
	}
	.edit-panel fieldset {
		padding: 0;
		margin: 0 0 16px;
		border: 0;
	}
	.edit-panel legend {
		margin-bottom: 7px;
		color: #91a69e;
		font-size: 0.65rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.preset-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 6px;
	}
	.preset-grid button,
	.fit-grid button {
		padding: 9px;
		color: #9cb0a8;
		border: 1px solid #213d34;
		border-radius: 10px;
		background: #0b1814;
		text-align: left;
	}
	.preset-grid button {
		display: flex;
		flex-direction: column;
	}
	.preset-grid button.active,
	.fit-grid button.active {
		color: #67e4b4;
		border-color: #3b8266;
		background: #10271f;
	}
	.preset-grid b {
		font-size: 0.62rem;
	}
	.preset-grid small {
		margin-top: 2px;
		color: #71877f;
		font-size: 0.54rem;
	}
	.fit-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 7px;
	}
	.fit-grid button {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.fit-grid span {
		display: flex;
		flex-direction: column;
	}
	.fit-grid b {
		font-size: 0.7rem;
	}
	.fit-grid small {
		font-size: 0.58rem;
	}
	.range-row {
		display: grid;
		grid-template-columns: 70px 1fr;
		align-items: center;
		gap: 8px;
		margin: 7px 0;
		color: #879b94;
		font-size: 0.65rem;
	}
	.range-row input,
	.quality input {
		width: 100%;
		accent-color: #58e4ae;
	}
	.quality {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 8px;
		padding: 10px;
		border: 1px solid #213d34;
		border-radius: 11px;
		background: #0b1814;
	}
	.quality > span {
		display: flex;
		flex-direction: column;
	}
	.quality b {
		font-size: 0.68rem;
	}
	.quality small {
		font-size: 0.57rem;
		color: #71877f;
	}
	.quality input {
		grid-column: 1/-1;
	}
	.edit-panel textarea {
		width: 100%;
	}
	.action-bar {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 12px 18px;
		border-top: 1px solid #17342a;
		background: #08130f;
	}
	.action-bar > div {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-right: auto;
		color: #6fe7b8;
	}
	.action-bar > div span {
		display: flex;
		flex-direction: column;
	}
	.action-bar > div b {
		font-size: 0.68rem;
	}
	.action-bar > div small {
		margin-top: 1px;
		color: #6f857d;
		font-size: 0.58rem;
	}
	.action-bar button {
		min-height: 40px;
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 0 14px;
		border-radius: 11px;
		font-weight: 800;
	}
	.secondary {
		color: #b5c6c0;
		border: 1px solid #29443b;
		background: #0b1814;
	}
	.confirm {
		color: #06120e;
		border: 0;
		background: #58e4ae;
	}
	.confirm:disabled,
	button:disabled {
		cursor: not-allowed;
		opacity: 0.42;
	}
	:global(.spin) {
		animation: spin 1s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (max-width: 860px) {
		.workspace,
		.upload-workspace {
			grid-template-columns: 1fr;
			overflow: auto;
		}
		.inspector,
		.edit-panel {
			border-top: 1px solid #17342a;
			border-left: 0;
		}
		.image-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.privacy {
			display: none;
		}
		.action-bar > div {
			display: none;
		}
	}
	@media (max-width: 600px) {
		.media-backdrop {
			padding: 0;
		}
		.media-dialog {
			width: 100%;
			height: 100dvh;
			max-height: none;
			border: 0;
			border-radius: 0;
		}
		.dialog-head {
			padding: 16px;
		}
		.dialog-head p {
			font-size: 0.74rem;
		}
		.source-tabs {
			padding: 9px;
		}
		.source-tabs > button {
			min-width: 0;
			flex: 1;
		}
		.library-controls {
			grid-template-columns: 1fr;
			padding: 12px;
		}
		.canvas-panel,
		.edit-panel,
		.asset-browser {
			padding: 13px;
		}
		.preset-grid {
			grid-template-columns: 1fr;
		}
		.action-bar {
			padding: max(10px, env(safe-area-inset-bottom)) 12px;
		}
		.action-bar button {
			flex: 1;
		}
		.secondary {
			max-width: 110px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		:global(.spin) {
			animation: none;
		}
	}
</style>
