<script lang="ts">
	import {
		Check,
		Code2,
		Eye,
		FileText,
		Globe2,
		Search,
		Share2,
		TriangleAlert
	} from '@lucide/svelte';

	import { cloneDemoSite, type DemoSite } from './demo-site';
	import { generateSeoArtifacts, normalizeCanonicalUrl, projectPageSeo } from './seo';

	export type SeoArea = 'overview' | 'site' | 'pages' | 'sharing' | 'files';

	let {
		site,
		onchange,
		area = $bindable('overview'),
		selectedPageId = $bindable('home')
	}: {
		site: DemoSite;
		onchange: (site: DemoSite) => void;
		area?: SeoArea;
		selectedPageId?: string;
	} = $props();

	const selectedPage = $derived(
		site.pages.find((page) => page.id === selectedPageId) ?? site.pages[0]
	);
	const projection = $derived(projectPageSeo(site, selectedPage));
	const artifacts = $derived(generateSeoArtifacts(site));
	const canonicalValid = $derived(Boolean(normalizeCanonicalUrl(site.seo.canonicalUrl)));
	const visiblePages = $derived(site.pages.filter((page) => page.seo.index).length);
	const seoTabs = [
		{ id: 'overview', label: 'Overview', icon: Search },
		{ id: 'site', label: 'Site identity', icon: Globe2 },
		{ id: 'pages', label: 'Pages', icon: FileText },
		{ id: 'sharing', label: 'Sharing preview', icon: Share2 },
		{ id: 'files', label: 'Generated files', icon: Code2 }
	] as const;

	function update(mutator: (draft: DemoSite) => void) {
		const draft = cloneDemoSite(site);
		mutator(draft);
		onchange(draft);
	}

	function updatePage(field: keyof typeof selectedPage.seo, value: string | boolean) {
		update((draft) => {
			const page = draft.pages.find((candidate) => candidate.id === selectedPage.id);
			if (page) Object.assign(page.seo, { [field]: value });
		});
	}
</script>

<main class="seo-workspace">
	<header>
		<div>
			<span>Search & sharing</span>
			<h1>Help people find and trust your site.</h1>
			<p>Friendly defaults are ready. You can review every detail before anything is published.</p>
		</div>
		<div class:attention={!canonicalValid} class="score">
			{#if canonicalValid}<Check size={19} />{:else}<TriangleAlert size={19} />{/if}
			<strong>{canonicalValid ? 'Search basics ready' : 'Website address needed'}</strong>
		</div>
	</header>

	<nav aria-label="Search and sharing settings">
		{#each seoTabs as tab (tab.id)}
			{@const Icon = tab.icon}
			<button class:active={area === tab.id} onclick={() => (area = tab.id)}>
				<Icon size={17} /><span>{tab.label}</span>
			</button>
		{/each}
	</nav>

	{#if area === 'overview'}
		<section class="overview-grid">
			<button onclick={() => (area = 'site')}>
				<Globe2 size={22} /><span
					><strong>Site identity</strong><small>{site.seo.identityName}</small></span
				><em>{canonicalValid ? 'Ready' : 'Review'}</em>
			</button>
			<button onclick={() => (area = 'pages')}>
				<FileText size={22} /><span
					><strong>Search pages</strong><small
						>{visiblePages} of {site.pages.length} can appear</small
					></span
				><em>Review</em>
			</button>
			<button onclick={() => (area = 'sharing')}>
				<Share2 size={22} /><span
					><strong>Sharing cards</strong><small>Preview titles, copy and imagery</small></span
				><em>Preview</em>
			</button>
			<button onclick={() => (area = 'files')}>
				<Code2 size={22} /><span
					><strong>Technical files</strong><small>Sitemap, robots and feed</small></span
				><em>Generated</em>
			</button>
		</section>
	{:else if area === 'site'}
		<section class="settings-card">
			<div class="section-heading">
				<div>
					<span>Website identity</span>
					<h2>The information search engines use everywhere.</h2>
				</div>
			</div>
			<div class="form-grid">
				<label class="wide"
					>Site description<textarea
						maxlength="320"
						value={site.seo.description}
						oninput={(event) =>
							update((draft) => (draft.seo.description = event.currentTarget.value))}
					></textarea><small>{site.seo.description.length}/320</small></label
				>
				<label
					>Website address<input
						value={site.seo.canonicalUrl}
						aria-invalid={!canonicalValid}
						oninput={(event) =>
							update((draft) => (draft.seo.canonicalUrl = event.currentTarget.value))}
					/><small
						>{canonicalValid
							? 'Secure address recognized'
							: 'Use a complete https:// address'}</small
					></label
				>
				<label
					>Page-title style<input
						value={site.seo.titlePattern}
						oninput={(event) =>
							update(
								(draft) =>
									(draft.seo.titlePattern = event.currentTarget.value.includes('%s')
										? event.currentTarget.value
										: `%s · ${event.currentTarget.value}`)
							)}
					/><small>%s becomes the page name</small></label
				>
				<label
					>Public name<input
						maxlength="120"
						value={site.seo.identityName}
						oninput={(event) =>
							update((draft) => (draft.seo.identityName = event.currentTarget.value))}
					/></label
				>
				<label
					>Identity<select
						value={site.seo.identityType}
						onchange={(event) =>
							update(
								(draft) =>
									(draft.seo.identityType = event.currentTarget.value as 'person' | 'organization')
							)}
						><option value="organization">Organization or publication</option><option value="person"
							>Person</option
						></select
					></label
				>
				<label
					>Primary language<input
						maxlength="20"
						value={site.seo.language}
						oninput={(event) => update((draft) => (draft.seo.language = event.currentTarget.value))}
					/></label
				>
				<label
					>Search visibility<select
						value={site.seo.visibility}
						onchange={(event) =>
							update(
								(draft) => (draft.seo.visibility = event.currentTarget.value as 'public' | 'hidden')
							)}
						><option value="public">Visible when published</option><option value="hidden"
							>Ask search engines to hide it</option
						></select
					></label
				>
			</div>
		</section>
	{:else if area === 'pages'}
		<div class="two-pane">
			<aside aria-label="Pages">
				{#each site.pages as page (page.id)}<button
						class:active={page.id === selectedPage.id}
						onclick={() => (selectedPageId = page.id)}
						><span><strong>{page.name}</strong><small>{page.slug}</small></span><em
							>{page.seo.index ? 'Visible' : 'Hidden'}</em
						></button
					>{/each}
			</aside>
			<section class="settings-card">
				<div class="section-heading">
					<div>
						<span>Search appearance</span>
						<h2>{selectedPage.name}</h2>
					</div>
				</div>
				<div class="form-grid">
					<label
						>Search title<input
							maxlength="120"
							value={selectedPage.seo.title}
							oninput={(event) => updatePage('title', event.currentTarget.value)}
						/><small>{projection.title.length} characters with site name</small></label
					>
					<label class="wide"
						>Search description<textarea
							maxlength="320"
							value={selectedPage.seo.description}
							oninput={(event) => updatePage('description', event.currentTarget.value)}
						></textarea><small>{selectedPage.seo.description.length}/320</small></label
					>
					<label class="check"
						><input
							type="checkbox"
							checked={selectedPage.seo.index}
							onchange={(event) => updatePage('index', event.currentTarget.checked)}
						/><span
							><strong>Show in search</strong><small>Include this page in the sitemap.</small></span
						></label
					>
					<label class="check"
						><input
							type="checkbox"
							checked={selectedPage.seo.follow}
							onchange={(event) => updatePage('follow', event.currentTarget.checked)}
						/><span
							><strong>Follow links</strong><small>Let search engines discover linked pages.</small
							></span
						></label
					>
				</div>
				<div class="search-preview">
					<small>{projection.canonicalUrl ?? 'Website address not set'}</small><strong
						>{projection.title}</strong
					>
					<p>{projection.description}</p>
				</div>
			</section>
		</div>
	{:else if area === 'sharing'}
		<section class="settings-card">
			<div class="section-heading">
				<div>
					<span>Sharing preview</span>
					<h2>Make every shared link feel intentional.</h2>
				</div>
				<select
					aria-label="Preview page"
					value={selectedPage.id}
					onchange={(event) => (selectedPageId = event.currentTarget.value)}
					>{#each site.pages as page (page.id)}<option value={page.id}>{page.name}</option
						>{/each}</select
				>
			</div>
			<div class="share-layout">
				<div class="form-grid">
					<label
						>Sharing title<input
							maxlength="120"
							value={selectedPage.seo.socialTitle}
							oninput={(event) => updatePage('socialTitle', event.currentTarget.value)}
						/></label
					>
					<label
						>Sharing description<textarea
							maxlength="320"
							value={selectedPage.seo.socialDescription}
							oninput={(event) => updatePage('socialDescription', event.currentTarget.value)}
						></textarea></label
					>
					<label
						>Sharing image<input
							value={selectedPage.seo.socialImage ?? ''}
							oninput={(event) => updatePage('socialImage', event.currentTarget.value)}
						/><small>Choose from Media or paste a reviewed image URL.</small></label
					>
				</div>
				<article class="share-card">
					{#if projection.socialImage}<img src={projection.socialImage} alt="" />{:else}<div
							class="share-placeholder"
						>
							<Eye size={26} />
						</div>{/if}
					<div>
						<small>{normalizeCanonicalUrl(site.seo.canonicalUrl) ?? 'YOUR WEBSITE'}</small><strong
							>{projection.socialTitle}</strong
						>
						<p>{projection.socialDescription}</p>
					</div>
				</article>
			</div>
		</section>
	{:else}
		<section class="settings-card files-card">
			<div class="section-heading">
				<div>
					<span>Generated previews</span>
					<h2>Technical files, handled automatically.</h2>
					<p>
						These are deterministic local previews. TEND Sites has not written or published them.
					</p>
				</div>
			</div>
			<details open>
				<summary>robots.txt</summary>
				<pre>{artifacts.robots}</pre>
			</details>
			<details>
				<summary>sitemap.xml</summary>
				<pre>{artifacts.sitemap}</pre>
			</details>
			<details>
				<summary>feed.xml</summary>
				<pre>{artifacts.feed}</pre>
			</details>
		</section>
	{/if}
</main>

<style>
	.seo-workspace {
		width: min(1420px, calc(100% - 32px));
		margin: 0 auto;
		padding: 42px 0 72px;
		color: #edf5f1;
	}
	.seo-workspace > header {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 24px;
	}
	.seo-workspace header > div:first-child {
		min-width: 0;
	}
	.seo-workspace header span,
	.section-heading span {
		color: #56e6ad;
		font-size: 11px;
		font-weight: 850;
		letter-spacing: 0.13em;
		text-transform: uppercase;
	}
	.seo-workspace h1 {
		margin: 8px 0 10px;
		font-size: clamp(32px, 4vw, 52px);
		line-height: 1.02;
		letter-spacing: -0.04em;
	}
	.seo-workspace h2 {
		margin: 6px 0;
		font-size: 24px;
	}
	.seo-workspace p,
	.seo-workspace small {
		color: #91a29c;
		line-height: 1.55;
	}
	.score {
		display: flex;
		align-items: center;
		gap: 9px;
		flex: 0 0 auto;
		padding: 12px 15px;
		color: #56e6ad;
		background: #0e2d24;
		border: 1px solid #265544;
		border-radius: 13px;
	}
	.score.attention {
		color: #f2c664;
		background: #2b2412;
		border-color: #5b4920;
	}
	.seo-workspace > nav {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin: 28px 0;
	}
	.seo-workspace > nav button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		color: #91a29c;
		background: transparent;
		border: 1px solid #233036;
		border-radius: 999px;
		cursor: pointer;
	}
	.seo-workspace > nav button.active {
		color: #56e6ad;
		background: #10251f;
		border-color: #36785e;
	}
	.overview-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 14px;
	}
	.overview-grid button {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 14px;
		min-height: 118px;
		padding: 20px;
		color: #edf5f1;
		text-align: left;
		background: #0e1417;
		border: 1px solid #233036;
		border-radius: 18px;
		cursor: pointer;
	}
	.overview-grid button > :global(svg) {
		color: #56e6ad;
	}
	.overview-grid button span {
		display: grid;
		gap: 5px;
	}
	.overview-grid em {
		color: #56e6ad;
		font-size: 12px;
		font-style: normal;
		font-weight: 800;
	}
	.settings-card {
		padding: 26px;
		background: #0e1417;
		border: 1px solid #233036;
		border-radius: 20px;
	}
	.section-heading {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 18px;
		margin-bottom: 22px;
	}
	.section-heading p {
		margin: 8px 0 0;
	}
	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 16px;
	}
	.form-grid label {
		display: grid;
		align-content: start;
		gap: 8px;
		color: #dce9e4;
		font-size: 13px;
		font-weight: 750;
	}
	.form-grid .wide {
		grid-column: 1/-1;
	}
	.form-grid input,
	.form-grid textarea,
	.form-grid select,
	.section-heading select {
		width: 100%;
		padding: 12px 13px;
		color: #edf5f1;
		background: #090f11;
		border: 1px solid #2a393e;
		border-radius: 11px;
	}
	.form-grid textarea {
		min-height: 96px;
		resize: vertical;
	}
	.form-grid input[aria-invalid='true'] {
		border-color: #a37b2d;
	}
	.form-grid .check {
		display: flex;
		align-items: start;
		padding: 15px;
		background: #0a1113;
		border: 1px solid #233036;
		border-radius: 12px;
	}
	.form-grid .check input {
		width: 18px;
		margin: 3px 10px 0 0;
	}
	.form-grid .check span {
		display: grid;
		gap: 3px;
	}
	.two-pane {
		display: grid;
		grid-template-columns: minmax(210px, 0.34fr) minmax(0, 1fr);
		gap: 16px;
	}
	.two-pane aside {
		display: grid;
		align-content: start;
		gap: 8px;
	}
	.two-pane aside button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 14px;
		color: #dce9e4;
		text-align: left;
		background: #0e1417;
		border: 1px solid #233036;
		border-radius: 12px;
		cursor: pointer;
	}
	.two-pane aside button.active {
		border-color: #36785e;
		background: #10251f;
	}
	.two-pane aside span {
		display: grid;
		gap: 3px;
	}
	.two-pane aside em {
		color: #56e6ad;
		font-size: 11px;
		font-style: normal;
	}
	.search-preview {
		margin-top: 20px;
		padding: 20px;
		background: #fff;
		border-radius: 13px;
	}
	.search-preview small {
		display: block;
		color: #25703c;
	}
	.search-preview strong {
		display: block;
		margin: 5px 0;
		color: #1a0dab;
		font:
			20px Arial,
			sans-serif;
	}
	.search-preview p {
		margin: 0;
		color: #4d5156;
		font:
			14px/1.5 Arial,
			sans-serif;
	}
	.share-layout {
		display: grid;
		grid-template-columns: minmax(0, 0.8fr) minmax(320px, 1fr);
		gap: 24px;
	}
	.share-layout .form-grid {
		grid-template-columns: 1fr;
	}
	.share-card {
		align-self: start;
		overflow: hidden;
		background: #10181b;
		border: 1px solid #2a393e;
		border-radius: 16px;
	}
	.share-card > img,
	.share-placeholder {
		width: 100%;
		aspect-ratio: 1.91/1;
		object-fit: cover;
	}
	.share-placeholder {
		display: grid;
		place-items: center;
		color: #56e6ad;
		background: linear-gradient(135deg, #133a30, #101d25);
	}
	.share-card > div:last-child {
		display: grid;
		gap: 5px;
		padding: 18px;
	}
	.share-card strong {
		font-size: 20px;
	}
	.share-card p {
		margin: 0;
	}
	.files-card details {
		margin-top: 10px;
		border: 1px solid #233036;
		border-radius: 12px;
		overflow: hidden;
	}
	.files-card summary {
		padding: 14px;
		cursor: pointer;
		font-weight: 750;
	}
	.files-card pre {
		max-height: 290px;
		margin: 0;
		padding: 16px;
		overflow: auto;
		color: #bdebd8;
		background: #080d0f;
		font:
			12px/1.6 ui-monospace,
			monospace;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	@media (max-width: 760px) {
		.seo-workspace > header {
			align-items: start;
			flex-direction: column;
		}
		.score {
			width: 100%;
		}
		.overview-grid,
		.two-pane,
		.form-grid,
		.share-layout {
			grid-template-columns: 1fr;
		}
		.form-grid .wide {
			grid-column: auto;
		}
		.two-pane aside {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			overflow-x: auto;
		}
		.two-pane aside button {
			min-width: 150px;
		}
		.seo-workspace > nav button span {
			display: none;
		}
		.seo-workspace > nav button {
			padding: 10px;
		}
		.section-heading {
			flex-direction: column;
		}
	}
</style>
