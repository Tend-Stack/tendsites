<script lang="ts">
	import {
		ArrowDown,
		ArrowUp,
		Check,
		FileQuestion,
		Link2,
		Megaphone,
		Menu,
		PanelBottom,
		Plus,
		Share2,
		Trash2,
		TriangleAlert
	} from '@lucide/svelte';

	import { cloneDemoSite, type DemoSite } from './demo-site';
	import {
		analyzeSiteStructure,
		normalizeExternalHref,
		resolveAnnouncementHref,
		type DemoNavigationItem
	} from './site-structure';

	export type StructureArea = 'overview' | 'header' | 'footer' | 'announcement' | 'not-found';

	let {
		site,
		onchange,
		area = $bindable('overview')
	}: {
		site: DemoSite;
		onchange: (site: DemoSite) => void;
		area?: StructureArea;
	} = $props();

	let externalLabel = $state('');
	let externalHref = $state('https://');
	let externalArea = $state<'header' | 'footer'>('header');
	let externalError = $state('');
	let socialLabel = $state('');
	let socialHref = $state('https://');
	let socialError = $state('');
	let announcementHref = $state<string | null>(null);
	let announcementError = $state('');

	const issues = $derived(analyzeSiteStructure(site.structure, site.pages));
	const tabs = [
		{ id: 'overview', label: 'Overview', icon: Check },
		{ id: 'header', label: 'Header', icon: Menu },
		{ id: 'footer', label: 'Footer', icon: PanelBottom },
		{ id: 'announcement', label: 'Announcement', icon: Megaphone },
		{ id: 'not-found', label: 'Not found', icon: FileQuestion }
	] as const;

	function update(mutator: (draft: DemoSite) => void) {
		const draft = cloneDemoSite(site);
		mutator(draft);
		onchange(draft);
	}

	function togglePage(areaName: 'header' | 'footer', pageId: string) {
		update((draft) => {
			const items = draft.structure[areaName];
			const existing = items.findIndex((item) => item.type === 'page' && item.pageId === pageId);
			if (existing >= 0) items.splice(existing, 1);
			else if (items.length < (areaName === 'header' ? 12 : 16)) {
				const page = draft.pages.find((candidate) => candidate.id === pageId);
				if (page)
					items.push({
						id: `${areaName}-${page.id}-${Date.now()}`,
						label: page.name,
						type: 'page',
						pageId: page.id
					});
			}
		});
	}

	function moveItem(areaName: 'header' | 'footer', id: string, direction: -1 | 1) {
		update((draft) => {
			const items = draft.structure[areaName];
			const index = items.findIndex((item) => item.id === id);
			const destination = index + direction;
			if (index < 0 || destination < 0 || destination >= items.length) return;
			[items[index], items[destination]] = [items[destination], items[index]];
		});
	}

	function removeItem(areaName: 'header' | 'footer', id: string) {
		update((draft) => {
			draft.structure[areaName] = draft.structure[areaName].filter((item) => item.id !== id);
		});
	}

	function renameItem(areaName: 'header' | 'footer', id: string, label: string) {
		const normalized = label.trim().slice(0, 60);
		if (!normalized) return;
		update((draft) => {
			const item = draft.structure[areaName].find((candidate) => candidate.id === id);
			if (item) item.label = normalized;
		});
	}

	function addExternal() {
		const label = externalLabel.trim().slice(0, 60);
		const href = normalizeExternalHref(externalHref);
		if (!label || !href) {
			externalError = 'Add a label and a secure HTTPS or email destination.';
			return;
		}
		update((draft) => {
			const items = draft.structure[externalArea];
			const maximum = externalArea === 'header' ? 12 : 16;
			if (items.length >= maximum) return;
			items.push({ id: `${externalArea}-external-${Date.now()}`, label, type: 'external', href });
		});
		externalLabel = '';
		externalHref = 'https://';
		externalError = '';
	}

	function addSocial() {
		const label = socialLabel.trim().slice(0, 40);
		const href = normalizeExternalHref(socialHref);
		if (!label || !href) {
			socialError = 'Add a label and a secure HTTPS or email destination.';
			return;
		}
		update((draft) => {
			if (draft.structure.social.length >= 8) return;
			draft.structure.social.push({ id: `social-${Date.now()}`, label, href });
		});
		socialLabel = '';
		socialHref = 'https://';
		socialError = '';
	}

	function saveAnnouncementHref() {
		const href = resolveAnnouncementHref(
			announcementHref ?? site.structure.announcement.href,
			site.pages
		);
		if (href === null) {
			announcementError = 'Choose an existing page address or use a secure HTTPS link.';
			return;
		}
		update((draft) => (draft.structure.announcement.href = href));
		announcementHref = href;
		announcementError = '';
	}

	function destination(item: DemoNavigationItem): string {
		return item.type === 'page'
			? (site.pages.find((page) => page.id === item.pageId)?.slug ?? 'Missing page')
			: (item.href ?? 'Missing link');
	}
</script>

<main class="structure-workspace">
	<header>
		<div>
			<span>Site structure</span>
			<h1>Give every visitor a clear way around.</h1>
			<p>Shape the header, footer, announcement, and recovery page without editing code.</p>
		</div>
		<div class:attention={issues.length > 0} class="score">
			{#if issues.length}<TriangleAlert size={19} />{:else}<Check size={19} />{/if}
			<strong>{issues.length ? `${issues.length} items to review` : 'Navigation ready'}</strong>
		</div>
	</header>

	<nav aria-label="Site structure settings">
		{#each tabs as tab (tab.id)}
			{@const Icon = tab.icon}
			<button class:active={area === tab.id} onclick={() => (area = tab.id)}>
				<Icon size={17} /><span>{tab.label}</span>
			</button>
		{/each}
	</nav>

	{#if area === 'overview'}
		<section class="overview-grid">
			<button onclick={() => (area = 'header')}>
				<Menu size={22} /><span
					><strong>Header navigation</strong><small
						>{site.structure.header.length} visible links</small
					></span
				><em>Manage</em>
			</button>
			<button onclick={() => (area = 'footer')}>
				<PanelBottom size={22} /><span
					><strong>Footer</strong><small
						>{site.structure.footer.length} links · {site.structure.social.length} social</small
					></span
				><em>Manage</em>
			</button>
			<button onclick={() => (area = 'announcement')}>
				<Megaphone size={22} /><span
					><strong>Announcement</strong><small
						>{site.structure.announcement.enabled
							? site.structure.announcement.text
							: 'Currently hidden'}</small
					></span
				><em>{site.structure.announcement.enabled ? 'Visible' : 'Optional'}</em>
			</button>
			<button onclick={() => (area = 'not-found')}>
				<FileQuestion size={22} /><span
					><strong>Not-found page</strong><small>{site.structure.notFound.title}</small></span
				><em>Preview</em>
			</button>
		</section>
		{#if issues.length}
			<section class="issue-card" aria-label="Structure issues">
				<h2>Review before publishing</h2>
				{#each issues as issue (`${issue.area}:${issue.message}`)}<button
						onclick={() => (area = issue.area === 'social' ? 'footer' : issue.area)}
						><TriangleAlert size={16} />{issue.message}</button
					>{/each}
			</section>
		{/if}
	{:else if area === 'header' || area === 'footer'}
		{@const areaName = area}
		<section class="settings-card">
			<div class="section-heading">
				<div>
					<span>{areaName === 'header' ? 'Primary navigation' : 'Footer navigation'}</span>
					<h2>Choose pages and put them in a useful order.</h2>
				</div>
			</div>
			<div class="page-toggles" aria-label="Available pages">
				{#each site.pages as page (page.id)}
					{@const selected = site.structure[areaName].some(
						(item) => item.type === 'page' && item.pageId === page.id
					)}
					<button class:selected onclick={() => togglePage(areaName, page.id)}
						>{#if selected}<Check size={15} />{:else}<Plus size={15} />{/if}{page.name}</button
					>
				{/each}
			</div>
			<div class="link-list">
				{#each site.structure[areaName] as item, index (item.id)}
					<article>
						<span class="drag-number">{index + 1}</span>
						<label
							>Visitor label<input
								maxlength="60"
								value={item.label}
								onchange={(event) => renameItem(areaName, item.id, event.currentTarget.value)}
							/></label
						>
						<span class="destination">{destination(item)}</span>
						<div>
							<button
								aria-label="Move {item.label} up"
								disabled={index === 0}
								onclick={() => moveItem(areaName, item.id, -1)}><ArrowUp size={15} /></button
							>
							<button
								aria-label="Move {item.label} down"
								disabled={index === site.structure[areaName].length - 1}
								onclick={() => moveItem(areaName, item.id, 1)}><ArrowDown size={15} /></button
							>
							<button aria-label="Remove {item.label}" onclick={() => removeItem(areaName, item.id)}
								><Trash2 size={15} /></button
							>
						</div>
					</article>
				{/each}
			</div>
			<div class="add-link-card">
				<Link2 size={19} />
				<div>
					<strong>Add a secure external link</strong><small
						>Only HTTPS websites and email links are accepted.</small
					>
				</div>
				<label>Label<input maxlength="60" bind:value={externalLabel} /></label>
				<label>Destination<input bind:value={externalHref} /></label>
				<button
					onclick={() => {
						externalArea = areaName;
						addExternal();
					}}><Plus size={15} /> Add link</button
				>
				{#if externalError}<small class="error" role="alert">{externalError}</small>{/if}
			</div>
		</section>

		{#if areaName === 'footer'}
			<section class="settings-card">
				<div class="section-heading">
					<div>
						<span>Social links</span>
						<h2>Keep optional profiles clearly labelled.</h2>
					</div>
				</div>
				<div class="social-list">
					{#each site.structure.social as item (item.id)}
						<span
							><Share2 size={15} /><strong>{item.label}</strong><small>{item.href}</small><button
								aria-label="Remove {item.label}"
								onclick={() =>
									update(
										(draft) =>
											(draft.structure.social = draft.structure.social.filter(
												(candidate) => candidate.id !== item.id
											))
									)}><Trash2 size={15} /></button
							></span
						>
					{/each}
				</div>
				<div class="add-link-card">
					<Share2 size={19} />
					<div>
						<strong>Add social profile</strong><small
							>Profiles open as external HTTPS destinations.</small
						>
					</div>
					<label>Label<input maxlength="40" bind:value={socialLabel} /></label><label
						>Destination<input bind:value={socialHref} /></label
					>
					<button onclick={addSocial}><Plus size={15} /> Add profile</button>
					{#if socialError}<small class="error" role="alert">{socialError}</small>{/if}
				</div>
			</section>
		{/if}
	{:else if area === 'announcement'}
		<section class="settings-card narrow">
			<div class="section-heading">
				<div>
					<span>Site-wide announcement</span>
					<h2>Share one timely message without distracting from the site.</h2>
				</div>
			</div>
			<label class="switch-row"
				><input
					type="checkbox"
					checked={site.structure.announcement.enabled}
					onchange={(event) =>
						update((draft) => (draft.structure.announcement.enabled = event.currentTarget.checked))}
				/><span
					><strong>Show announcement</strong><small>Appears above the visitor header.</small></span
				></label
			>
			<label
				>Message<textarea
					maxlength="160"
					rows="3"
					value={site.structure.announcement.text}
					oninput={(event) =>
						update(
							(draft) =>
								(draft.structure.announcement.text = event.currentTarget.value.slice(0, 160))
						)}></textarea></label
			>
			<label
				>Optional destination<input
					value={announcementHref ?? site.structure.announcement.href}
					oninput={(event) => (announcementHref = event.currentTarget.value)}
					onchange={saveAnnouncementHref}
				/><small>Use an existing page address such as /journal, or a secure HTTPS link.</small
				></label
			>
			{#if announcementError}<small class="error" role="alert">{announcementError}</small>{/if}
			<div class="announcement-preview" class:hidden={!site.structure.announcement.enabled}>
				<Megaphone size={16} /><span>{site.structure.announcement.text}</span>
			</div>
		</section>
	{:else}
		<section class="not-found-layout">
			<div class="settings-card">
				<div class="section-heading">
					<div>
						<span>Missing-page recovery</span>
						<h2>Turn a dead end into a clear next step.</h2>
					</div>
				</div>
				<label
					>Heading<input
						maxlength="120"
						value={site.structure.notFound.title}
						oninput={(event) =>
							update(
								(draft) =>
									(draft.structure.notFound.title = event.currentTarget.value.slice(0, 120))
							)}
					/></label
				>
				<label
					>Explanation<textarea
						maxlength="320"
						rows="4"
						value={site.structure.notFound.body}
						oninput={(event) =>
							update(
								(draft) => (draft.structure.notFound.body = event.currentTarget.value.slice(0, 320))
							)}></textarea></label
				>
				<label
					>Button label<input
						maxlength="60"
						value={site.structure.notFound.actionLabel}
						oninput={(event) =>
							update(
								(draft) =>
									(draft.structure.notFound.actionLabel = event.currentTarget.value.slice(0, 60))
							)}
					/></label
				>
				<label
					>Recovery page<select
						value={site.structure.notFound.pageId}
						onchange={(event) =>
							update((draft) => (draft.structure.notFound.pageId = event.currentTarget.value))}
						>{#each site.pages as page (page.id)}<option value={page.id}>{page.name}</option
							>{/each}</select
					></label
				>
			</div>
			<div class="not-found-preview">
				<small>404 · PAGE NOT FOUND</small>
				<h2>{site.structure.notFound.title}</h2>
				<p>{site.structure.notFound.body}</p>
				<span>{site.structure.notFound.actionLabel}</span>
			</div>
		</section>
	{/if}
</main>

<style>
	.structure-workspace {
		min-height: calc(100vh - 76px);
		padding: 38px clamp(18px, 4vw, 54px) 72px;
		color: #edf5f1;
		background: #081012;
	}
	.structure-workspace > header {
		display: flex;
		justify-content: space-between;
		gap: 24px;
		align-items: end;
	}
	header span,
	.section-heading span {
		color: #56e6ad;
		font-size: 12px;
		font-weight: 900;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	h1 {
		max-width: 760px;
		margin: 10px 0;
		font-size: clamp(32px, 5vw, 60px);
		line-height: 1.03;
		font-weight: 500;
	}
	header p {
		max-width: 680px;
		margin: 0;
		color: #8ba098;
		font-size: 17px;
	}
	.score {
		display: flex;
		gap: 9px;
		align-items: center;
		padding: 12px 15px;
		color: #56e6ad;
		border: 1px solid #1f4a3b;
		border-radius: 12px;
		background: #0e201a;
		white-space: nowrap;
	}
	.score.attention {
		color: #f2ba4d;
		border-color: #58431e;
		background: #20190d;
	}
	.structure-workspace > nav {
		display: flex;
		gap: 6px;
		margin: 34px 0;
		padding-bottom: 8px;
		overflow-x: auto;
	}
	nav button {
		display: flex;
		gap: 8px;
		align-items: center;
		padding: 10px 14px;
		color: #8ba098;
		border: 0;
		border-radius: 10px;
		background: transparent;
		white-space: nowrap;
	}
	nav button.active {
		color: #fff;
		background: #172320;
	}
	.overview-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 14px;
	}
	.overview-grid button {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 14px;
		align-items: center;
		min-height: 105px;
		padding: 20px;
		color: #edf5f1;
		text-align: left;
		border: 1px solid #20302d;
		border-radius: 16px;
		background: #0e1719;
	}
	.overview-grid span {
		display: grid;
		gap: 6px;
		min-width: 0;
	}
	.overview-grid small {
		color: #8ba098;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.overview-grid em {
		color: #56e6ad;
		font-size: 12px;
		font-style: normal;
		font-weight: 800;
	}
	.settings-card,
	.issue-card {
		display: grid;
		gap: 18px;
		padding: clamp(18px, 3vw, 28px);
		border: 1px solid #20302d;
		border-radius: 18px;
		background: #0e1719;
	}
	.settings-card + .settings-card,
	.issue-card {
		margin-top: 16px;
	}
	.settings-card.narrow {
		max-width: 760px;
	}
	.section-heading h2,
	.issue-card h2 {
		margin: 6px 0 0;
		font-size: 23px;
	}
	.page-toggles {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.page-toggles button {
		display: flex;
		gap: 7px;
		align-items: center;
		padding: 9px 12px;
		color: #9aaca5;
		border: 1px solid #293b36;
		border-radius: 999px;
		background: #101b1d;
	}
	.page-toggles button.selected {
		color: #092219;
		border-color: #56e6ad;
		background: #56e6ad;
	}
	.link-list {
		display: grid;
		gap: 9px;
	}
	.link-list article {
		display: grid;
		grid-template-columns: auto minmax(180px, 1fr) minmax(160px, 1fr) auto;
		gap: 12px;
		align-items: center;
		padding: 12px;
		border: 1px solid #253732;
		border-radius: 13px;
		background: #0a1214;
	}
	.drag-number {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		color: #789087;
		border-radius: 8px;
		background: #172321;
	}
	label {
		display: grid;
		gap: 6px;
		color: #b8c7c1;
		font-size: 13px;
		font-weight: 700;
	}
	input,
	textarea,
	select {
		width: 100%;
		box-sizing: border-box;
		padding: 10px 11px;
		color: #eef7f2;
		font: inherit;
		border: 1px solid #2a4039;
		border-radius: 9px;
		background: #0a1214;
	}
	.destination {
		color: #7f958c;
		font-size: 13px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.link-list article > div {
		display: flex;
		gap: 4px;
	}
	.link-list article button,
	.social-list button {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		color: #9db0a8;
		border: 1px solid #2a4039;
		border-radius: 8px;
		background: #101b1d;
	}
	.add-link-card {
		display: grid;
		grid-template-columns: auto minmax(180px, 1.4fr) minmax(130px, 1fr) minmax(190px, 1.4fr) auto;
		gap: 12px;
		align-items: end;
		padding: 15px;
		border: 1px dashed #365448;
		border-radius: 14px;
	}
	.add-link-card > div {
		display: grid;
		gap: 4px;
		align-self: center;
	}
	.add-link-card small {
		color: #82978e;
	}
	.add-link-card > button {
		display: flex;
		gap: 6px;
		align-items: center;
		min-height: 40px;
		padding: 0 13px;
		color: #092219;
		font-weight: 800;
		border: 0;
		border-radius: 9px;
		background: #56e6ad;
	}
	.error {
		grid-column: 1 / -1;
		color: #ff9f91 !important;
		font-weight: 700;
	}
	.social-list {
		display: grid;
		gap: 8px;
	}
	.social-list > span {
		display: grid;
		grid-template-columns: auto auto 1fr auto;
		gap: 9px;
		align-items: center;
		padding: 10px 12px;
		border-radius: 10px;
		background: #0a1214;
	}
	.social-list small {
		min-width: 0;
		color: #81958d;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.switch-row {
		display: flex;
		gap: 12px;
		align-items: start;
		padding: 14px;
		border-radius: 12px;
		background: #111e1d;
	}
	.switch-row input {
		width: 18px;
		margin-top: 3px;
		accent-color: #56e6ad;
	}
	.switch-row span {
		display: grid;
		gap: 4px;
	}
	.switch-row small {
		color: #82978e;
	}
	.announcement-preview {
		display: flex;
		gap: 9px;
		justify-content: center;
		align-items: center;
		padding: 12px;
		color: #112019;
		border-radius: 10px;
		background: #56e6ad;
	}
	.announcement-preview.hidden {
		opacity: 0.35;
	}
	.not-found-layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(320px, 0.8fr);
		gap: 16px;
	}
	.not-found-preview {
		display: grid;
		align-content: center;
		justify-items: start;
		min-height: 430px;
		padding: clamp(28px, 5vw, 60px);
		color: #1c2b25;
		border-radius: 18px;
		background: #eef4ef;
	}
	.not-found-preview small {
		color: #23835f;
		font-weight: 900;
		letter-spacing: 0.12em;
	}
	.not-found-preview h2 {
		margin: 16px 0 10px;
		font:
			500 clamp(34px, 5vw, 58px)/1.02 Georgia,
			serif;
	}
	.not-found-preview p {
		color: #52635b;
		line-height: 1.6;
	}
	.not-found-preview span {
		margin-top: 12px;
		padding: 11px 16px;
		color: #092219;
		font-weight: 800;
		border-radius: 999px;
		background: #56e6ad;
	}
	.issue-card button {
		display: flex;
		gap: 9px;
		align-items: center;
		padding: 10px;
		color: #f3c66e;
		text-align: left;
		border: 0;
		border-radius: 9px;
		background: #20190d;
	}
	button {
		cursor: pointer;
	}
	button:disabled {
		cursor: not-allowed;
		opacity: 0.35;
	}
	button:focus-visible,
	input:focus-visible,
	textarea:focus-visible,
	select:focus-visible {
		outline: 3px solid #56e6ad80;
		outline-offset: 2px;
	}
	@media (max-width: 900px) {
		.structure-workspace > header {
			align-items: start;
			flex-direction: column;
		}
		.overview-grid,
		.not-found-layout {
			grid-template-columns: 1fr;
		}
		.link-list article {
			grid-template-columns: auto 1fr auto;
		}
		.destination {
			grid-column: 2 / -1;
		}
		.add-link-card {
			grid-template-columns: auto 1fr;
			align-items: center;
		}
		.add-link-card label,
		.add-link-card > button {
			grid-column: 1 / -1;
		}
	}
	@media (max-width: 560px) {
		.overview-grid {
			grid-template-columns: 1fr;
		}
		.overview-grid button {
			grid-template-columns: auto 1fr;
		}
		.overview-grid em {
			grid-column: 2;
		}
		.link-list article {
			grid-template-columns: auto 1fr;
		}
		.link-list article > div,
		.destination {
			grid-column: 2;
		}
	}
</style>
