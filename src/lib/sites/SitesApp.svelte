<script lang="ts">
	import {
		ArrowLeft,
		ArrowRight,
		BookOpen,
		Check,
		CirclePlus,
		Cloud,
		FileSearch,
		FileText,
		GitBranch,
		Image,
		LayoutGrid,
		Library,
		Menu,
		PanelLeft,
		Rocket,
		Settings2,
		ShieldCheck,
		Sparkles,
		X
	} from '@lucide/svelte';

	import type { SiteGoal, SiteModule } from '../contracts/catalog';
	import { planSiteCreation } from '../planning/site-creation';

	import {
		demoAdoptionReport,
		demoChangePreview,
		demoContentIndex,
		starterCatalog
	} from './foundation-data';
	import { goals, modules, projects, themes } from './fixtures';

	type View = 'home' | 'create' | 'adopt' | 'studio' | 'library' | 'publish';

	let { embedded = false }: { embedded?: boolean } = $props();
	let view = $state<View>('home');
	let wizardStep = $state(1);
	let selectedGoal = $state<SiteGoal>('blog');
	let selectedTheme = $state('editorial');
	let selectedModules = $state<string[]>(['Home', 'About', 'Blog', 'Gallery', 'Contact']);
	let siteName = $state('Weekend Notes');
	let accent = $state('#56e6ad');
	let mobileMenu = $state(false);

	const stepLabels = ['Goal', 'Look', 'Structure', 'Identity', 'Review'];
	const selectedGoalName = $derived(
		goals.find((goal) => goal.id === selectedGoal)?.title ?? 'Site'
	);
	const selectedThemeName = $derived(
		themes.find((theme) => theme.id === selectedTheme)?.name ?? 'Tend Editorial'
	);
	const moduleIds: Readonly<Record<string, SiteModule>> = {
		Home: 'home',
		About: 'about',
		Blog: 'blog',
		Documentation: 'documentation',
		Gallery: 'gallery',
		Projects: 'projects',
		Contact: 'contact'
	};
	const selectedTemplate = $derived(
		starterCatalog.find((template) => template.id === selectedTheme) ?? starterCatalog[1]
	);
	const reviewPlan = $derived.by(() =>
		planSiteCreation(
			{
				contract: 'tend.host/sites-creation-selection/v1',
				planId: '55555555-5555-4555-8555-555555555555',
				projectId: 'planned-site',
				name: siteName.trim() || 'Untitled site',
				goal: selectedGoal,
				templateId: selectedTemplate.id,
				templateRevisionSha256: selectedTemplate.revisionSha256,
				modules: selectedModules.map((module) => moduleIds[module]),
				accent,
				defaultLocale: 'en',
				requestedAt: '2026-08-09T20:00:00Z'
			},
			selectedTemplate
		)
	);
	const contentIndex = demoContentIndex;

	function toggleModule(module: string) {
		selectedModules = selectedModules.includes(module)
			? selectedModules.filter((item) => item !== module)
			: [...selectedModules, module];
	}

	function open(next: View) {
		view = next;
		mobileMenu = false;
	}
</script>

<svelte:head>
	<title>TEND Sites — Your website, not ours</title>
	<meta
		name="description"
		content="A Git-native publishing studio for tend.host. This foundation preview does not modify repositories."
	/>
</svelte:head>

<div class:embedded class="sites-shell">
	<header class="topbar">
		<button class="brand" aria-label="Open Sites home" onclick={() => open('home')}>
			<span class="brand-mark"><Sparkles size={17} strokeWidth={2.4} /></span>
			<span><strong>TEND</strong> Sites</span>
		</button>
		<nav class:open={mobileMenu} aria-label="Sites navigation">
			<button class:active={view === 'home'} onclick={() => open('home')}>Your sites</button>
			<button class:active={view === 'studio'} onclick={() => open('studio')}>Studio</button>
			<button class:active={view === 'library'} onclick={() => open('library')}>Library</button>
		</nav>
		<div class="top-actions">
			<span class="connection"><span></span> Foundation preview</span>
			<button
				class="mobile-menu"
				aria-label={mobileMenu ? 'Close navigation' : 'Open navigation'}
				onclick={() => (mobileMenu = !mobileMenu)}
			>
				{#if mobileMenu}<X size={20} />{:else}<Menu size={20} />{/if}
			</button>
		</div>
	</header>

	{#if view === 'home'}
		<main class="page home-page">
			<section class="hero-row">
				<div>
					<span class="eyebrow">Your websites</span>
					<h1>Sites you own, source and all.</h1>
					<p>Create, update and publish without turning your work into a proprietary format.</p>
				</div>
				<button class="primary" onclick={() => open('create')}
					><CirclePlus size={18} /> New site</button
				>
			</section>

			<section class="project-grid" aria-label="Your sites">
				{#each projects as project (project.id)}
					<article class="project-card">
						<div class="site-preview" aria-hidden="true">
							<div class="preview-lines"><span></span><span></span><span></span></div>
							<div class="preview-image"></div>
						</div>
						<div class="project-heading">
							<div>
								<h2>{project.name}</h2>
								<p>{project.url}</p>
							</div>
							<span class:live={project.status === 'published'} class="status"
								>{project.status}</span
							>
						</div>
						<div class="project-meta">
							<span>{project.updated}</span><span
								>{project.locales.locales.length} language{project.locales.locales.length === 1
									? ''
									: 's'}</span
							>
						</div>
						<button class="card-action" onclick={() => open('studio')}
							>Open Studio <ArrowRight size={16} /></button
						>
					</article>
				{/each}
			</section>

			<section class="continue-grid">
				<article class="resume-card">
					<div class="icon-box"><FileText size={22} /></div>
					<div>
						<span class="eyebrow">Continue where you left off</span>
						<h2>Field Notes</h2>
						<p>Spanish translation still needs review.</p>
					</div>
					<button class="secondary" onclick={() => open('studio')}>Continue editing</button>
				</article>
				<article class="quick-card">
					<div class="icon-box"><Cloud size={22} /></div>
					<div>
						<span class="eyebrow">Bring your own source</span>
						<h2>Connect an existing site</h2>
						<p>Safe adoption will analyze first and propose changes second.</p>
					</div>
					<button class="secondary" onclick={() => open('adopt')}>View safe analysis</button>
				</article>
			</section>
		</main>
	{:else if view === 'create'}
		<main class="page wizard-page">
			<button class="back-link" onclick={() => open('home')}
				><ArrowLeft size={17} /> Your sites</button
			>
			<div class="wizard-heading">
				<span class="eyebrow">Create something beautiful</span>
				<h1>{stepLabels[wizardStep - 1]}</h1>
				<p>Five friendly steps. No Git, command line or infrastructure decisions required.</p>
			</div>
			<ol class="stepper" aria-label="Site creation progress">
				{#each stepLabels as label, index (label)}
					<li class:current={wizardStep === index + 1} class:complete={wizardStep > index + 1}>
						<span>{wizardStep > index + 1 ? '✓' : index + 1}</span>{label}
					</li>
				{/each}
			</ol>

			<section class="wizard-card">
				{#if wizardStep === 1}
					<h2>What are you making?</h2>
					<div class="choice-grid">
						{#each goals as goal (goal.id)}
							<button
								class:selected={selectedGoal === goal.id}
								onclick={() => (selectedGoal = goal.id)}
							>
								<span class="choice-icon"><LayoutGrid size={18} /></span><strong
									>{goal.title}</strong
								><small>{goal.copy}</small><em>Choose →</em>
							</button>
						{/each}
					</div>
				{:else if wizardStep === 2}
					<h2>Pick a look</h2>
					<p class="section-copy">Every look is responsive, accessible and changeable later.</p>
					<div class="theme-grid">
						{#each themes as theme (theme.id)}
							<button
								class:selected={selectedTheme === theme.id}
								onclick={() => (selectedTheme = theme.id)}
							>
								<div class="theme-preview"><span></span><span></span><i></i></div>
								<strong>{theme.name}</strong><small>{theme.copy}</small>
							</button>
						{/each}
					</div>
				{:else if wizardStep === 3}
					<h2>Choose what your site needs</h2>
					<p class="section-copy">You can add or remove any of these later.</p>
					<div class="toggle-grid">
						{#each modules as module (module)}
							<button
								class:selected={selectedModules.includes(module)}
								onclick={() => toggleModule(module)}
							>
								<span
									>{#if selectedModules.includes(module)}<Check size={17} />{:else}<CirclePlus
											size={17}
										/>{/if}</span
								>{module}
							</button>
						{/each}
					</div>
				{:else if wizardStep === 4}
					<h2>Make it yours</h2>
					<div class="identity-grid">
						<label><span>Site name</span><input bind:value={siteName} maxlength="120" /></label>
						<label
							><span>Accent color</span>
							<div class="color-input">
								<input type="color" bind:value={accent} /><code>{accent}</code>
							</div></label
						>
						<label
							><span>Primary language</span><select
								><option>English</option><option>Español</option><option>Français</option></select
							></label
						>
						<label><span>Domain</span><input placeholder="Optional — connect later" /></label>
					</div>
				{:else}
					<h2>Your starter plan</h2>
					<p class="section-copy">
						Reviewing is safe. No source or repository will be created in this foundation preview.
					</p>
					<div class="review-grid">
						<div><span>Site</span><strong>{siteName || 'Untitled site'}</strong></div>
						<div><span>Goal</span><strong>{selectedGoalName}</strong></div>
						<div><span>Look</span><strong>{selectedThemeName}</strong></div>
						<div>
							<span>Sections</span><strong>{selectedModules.join(', ') || 'Start blank'}</strong>
						</div>
						<div>
							<span>Starter revision</span><strong
								>{reviewPlan.templateRevisionSha256.slice(0, 10)}…</strong
							>
						</div>
						<div>
							<span>Planned source files</span><strong
								>{reviewPlan.files.length} reviewed files</strong
							>
						</div>
					</div>
					<div class="honesty-note">
						<Cloud size={20} />
						<div>
							<strong>Source creation is intentionally disabled.</strong>
							<p>
								The next host-capability slice will turn this reviewed plan into ordinary SvelteKit
								source through a durable job.
							</p>
						</div>
					</div>
				{/if}
			</section>
			<div class="wizard-actions">
				<button class="secondary" disabled={wizardStep === 1} onclick={() => (wizardStep -= 1)}
					><ArrowLeft size={17} /> Back</button
				>
				{#if wizardStep < 5}
					<button class="primary" onclick={() => (wizardStep += 1)}
						>Next: {stepLabels[wizardStep]} <ArrowRight size={17} /></button
					>
				{:else}
					<button class="primary" onclick={() => open('studio')}
						>Open Studio preview <ArrowRight size={17} /></button
					>
				{/if}
			</div>
		</main>
	{:else if view === 'adopt'}
		<main class="page adoption-page">
			<button class="back-link" onclick={() => open('home')}
				><ArrowLeft size={17} /> Your sites</button
			>
			<div class="wizard-heading">
				<span class="eyebrow">Safe repository adoption</span>
				<h1>Understand first. Change nothing.</h1>
				<p>
					This sample report shows what TEND Sites will verify before proposing any source changes.
				</p>
			</div>
			<div class="adoption-grid">
				<section class="report-card">
					<div class="report-heading">
						<span class="icon-box"><FileSearch size={22} /></span>
						<div>
							<span class="eyebrow">Compatibility report</span>
							<h2>Ready to review</h2>
						</div>
						<span class="status live">{demoAdoptionReport.status}</span>
					</div>
					<div class="check-list">
						{#each demoAdoptionReport.checks as check (check.id)}
							<div>
								<span><Check size={15} /></span>
								<div>
									<strong>{check.summary}</strong><small>{check.id.replaceAll('_', ' ')}</small>
								</div>
							</div>
						{/each}
					</div>
				</section>
				<aside class="evidence-card">
					<span class="evidence-icon"><ShieldCheck size={24} /></span>
					<h2>Protected by default</h2>
					<p>Analysis receives no deployment destination and no protected secrets.</p>
					<dl>
						<div>
							<dt>Snapshot</dt>
							<dd>{demoAdoptionReport.snapshotId.slice(0, 8)}…</dd>
						</div>
						<div>
							<dt>Commit</dt>
							<dd>{demoAdoptionReport.commit.slice(0, 10)}…</dd>
						</div>
						<div>
							<dt>Secrets</dt>
							<dd>Not available</dd>
						</div>
						<div>
							<dt>Production</dt>
							<dd>Not available</dd>
						</div>
					</dl>
					<button class="primary" disabled title="Authenticated host checkout is not connected yet"
						><GitBranch size={17} /> Connect through tend.host</button
					>
				</aside>
			</div>
		</main>
	{:else if view === 'studio'}
		<main class="studio-page">
			<aside class="studio-sidebar" aria-label="Site outline">
				<div>
					<span class="eyebrow">Weekend Notes</span>
					<h2>Home</h2>
				</div>
				<nav>
					<span>Content</span>
					<button class="active"><PanelLeft size={17} /> Home</button><button
						><FileText size={17} /> About</button
					><button><BookOpen size={17} /> Blog</button><button><Image size={17} /> Media</button>
					<span>Design</span>
					<button onclick={() => open('library')}><Settings2 size={17} /> Theme</button><button
						onclick={() => open('library')}><Library size={17} /> Components</button
					>
				</nav>
				<div class="content-summary" aria-label="Content overview">
					<span><strong>{contentIndex.total}</strong> entries</span>
					<span><strong>{contentIndex.drafts}</strong> drafts</span>
					<span><strong>{Object.keys(contentIndex.byLocale).length}</strong> languages</span>
				</div>
				<button class="ai-card"
					><Sparkles size={18} /><span
						><strong>Ask Sites AI</strong><small>Capability not connected yet</small></span
					></button
				>
			</aside>
			<section class="canvas-area">
				<div class="studio-toolbar">
					<div>
						<strong>Home</strong><span>English</span><span class="saved">Saved fixture</span>
					</div>
					<div>
						<button class="secondary">Preview</button><button
							class="primary"
							onclick={() => open('publish')}>Publish</button
						>
					</div>
				</div>
				<div class="browser-frame">
					<div class="browser-top"><i></i><i></i><i></i><span>weekend-notes.example</span></div>
					<div class="site-canvas" style:--accent={accent}>
						<nav>
							<strong>{siteName || 'Weekend Notes'}</strong><span
								>About&nbsp;&nbsp; Blog&nbsp;&nbsp; Gallery</span
							>
						</nav>
						<section class="selected-block">
							<span class="block-label">Split Hero</span><small>PERSONAL JOURNAL</small>
							<h1>Stories, sound & places worth remembering.</h1>
							<p>A personal corner for essays, podcast episodes and the occasional experiment.</p>
							<button>Read the latest story</button>
						</section>
						<section class="story-block">
							<div></div>
							<article>
								<small>LATEST STORY</small>
								<h2>Field Notes</h2>
								<p>
									A weekend route, a camera, and a few places that deserved more than a drive-by.
								</p>
							</article>
						</section>
						<button class="add-section"><CirclePlus size={15} /> Add section</button>
					</div>
				</div>
			</section>
			<aside class="inspector" aria-label="Selected block settings">
				<div>
					<span class="eyebrow">Selected block</span>
					<h2>Split Hero</h2>
					<span class="official">Official</span>
				</div>
				<label><span>Eyebrow</span><input value="PERSONAL JOURNAL" readonly /></label>
				<label
					><span>Title</span><textarea rows="3" readonly
						>Stories, sound & places worth remembering.</textarea
					></label
				>
				<label><span>Layout</span><select><option>Text left / media right</option></select></label>
				<label><span>Theme</span><select><option>{selectedThemeName}</option></select></label>
				<div class="media-drop">
					<Image size={24} /><span>Drag image here<br />or choose Media</span>
				</div>
				<button class="secondary">Replace block</button>
			</aside>
		</main>
	{:else if view === 'library'}
		<main class="page library-page">
			<div class="hero-row">
				<div>
					<span class="eyebrow">Design library</span>
					<h1>Make the site yours.</h1>
					<p>Add a theme or one building block at a time. Everything stays optional.</p>
				</div>
				<button class="secondary" onclick={() => open('studio')}
					><ArrowLeft size={17} /> Studio</button
				>
			</div>
			<div class="filter-row">
				<button class="active">Official</button><button disabled>Community</button><button disabled
					>Installed</button
				><span></span><button class="active">Components</button><button>Themes</button>
			</div>
			<section class="component-grid">
				{#each ['Split Hero', 'Timeline', 'Podcast Player', 'API Reference', 'Map', 'Testimonials'] as component, index (component)}
					<article>
						<div class="component-preview">
							<span></span><span></span><i class:round={index === 2}></i>
						</div>
						<div>
							<span class="status live">Official</span><small
								>{['Hero', 'Content', 'Media', 'Docs', 'Data', 'Business'][index]}</small
							>
						</div>
						<h2>{component}</h2>
						<p>
							{[
								'Clean image + message layout.',
								'Stories, milestones and history.',
								'Episodes with native-looking controls.',
								'Readable endpoints and examples.',
								'Locations, routes and places.',
								'Quotes with people or logos.'
							][index]}
						</p>
						<button class="card-action">Preview <ArrowRight size={15} /></button>
					</article>
				{/each}
			</section>
		</main>
	{:else}
		<main class="page publish-page">
			<button class="back-link" onclick={() => open('studio')}
				><ArrowLeft size={17} /> Studio</button
			>
			<div class="wizard-heading">
				<span class="eyebrow">Durable publishing</span>
				<h1>Publishing “Field Notes”</h1>
				<p>This truthful preview shows the workflow shape. No deployment has been requested.</p>
			</div>
			<div class="publish-grid">
				<section class="progress-card">
					{#each [['Saved content', 'Your draft is safely stored.'], ['Repository update', 'A proposed changeset will be created.'], ['Build preview', 'The standard project build must pass.'], ['Deploy', 'Requires durable host job authority.'], ['Verify', 'Health and route checks must pass.']] as item, index (item[0])}
						<div class:done={index < 2} class:current={index === 2} class="progress-row">
							<span
								>{#if index < 2}<Check size={16} />{:else}{index + 1}{/if}</span
							>
							<div><strong>{item[0]}</strong><small>{item[1]}</small></div>
						</div>
					{/each}
				</section>
				<aside>
					<article class="honesty-note">
						<Rocket size={22} />
						<div>
							<strong>Not connected to deployment authority</strong>
							<p>
								The extension cannot publish until tend.host grants a typed, assigned-project
								durable job capability.
							</p>
						</div>
					</article>
					<article class="details">
						<span>Proposed files</span><strong>{demoChangePreview.files.length}</strong><span
							>Creates</span
						><strong>{demoChangePreview.counts.create}</strong><span>Updates</span><strong
							>{demoChangePreview.counts.update}</strong
						><span>Deletes</span><strong>{demoChangePreview.counts.delete}</strong><span
							>Operation</span
						><strong>Not created</strong><span>Current site</span><strong
							>Online and unchanged</strong
						><span>Rollback</span><strong>Previous revision retained</strong>
					</article>
				</aside>
			</div>
		</main>
	{/if}
</div>

<style>
	:global(*) {
		box-sizing: border-box;
	}
	:global(body) {
		margin: 0;
		background: #070b0d;
		color: #edf5f1;
		font-family: Inter, ui-sans-serif, system-ui, sans-serif;
	}
	:global(button),
	:global(input),
	:global(textarea),
	:global(select) {
		font: inherit;
	}
	.sites-shell {
		--surface: #0e1417;
		--surface-2: #121a1e;
		--border: #233036;
		--muted: #91a29c;
		--green: #56e6ad;
		min-height: 100dvh;
		background: radial-gradient(circle at 50% -20%, #12322a 0, transparent 34%), #070b0d;
	}
	.sites-shell.embedded {
		min-height: 100%;
	}
	.topbar {
		height: 64px;
		display: flex;
		align-items: center;
		gap: 30px;
		padding: 0 clamp(18px, 4vw, 56px);
		border-bottom: 1px solid var(--border);
		background: rgba(7, 11, 13, 0.92);
		position: sticky;
		top: 0;
		z-index: 20;
		backdrop-filter: blur(18px);
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
		color: #f6fbf8;
		background: none;
		border: 0;
		font-size: 17px;
		cursor: pointer;
	}
	.brand-mark,
	.icon-box,
	.choice-icon {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border-radius: 10px;
		color: var(--green);
		background: #0e2d24;
	}
	.topbar nav {
		display: flex;
		gap: 6px;
	}
	.topbar nav button,
	.filter-row button {
		color: var(--muted);
		background: transparent;
		border: 0;
		border-radius: 9px;
		padding: 9px 12px;
		cursor: pointer;
	}
	.topbar nav button:hover,
	.topbar nav button.active,
	.filter-row button.active {
		color: #fff;
		background: #15201e;
	}
	.top-actions {
		margin-left: auto;
		display: flex;
		align-items: center;
	}
	.connection {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		color: #b9c8c2;
		font-size: 12px;
	}
	.connection span {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #f2b84b;
		box-shadow: 0 0 10px #f2b84b80;
	}
	.mobile-menu {
		display: none;
		color: white;
		background: transparent;
		border: 0;
	}
	.page {
		width: min(1180px, calc(100% - 36px));
		margin: 0 auto;
		padding: 56px 0 80px;
	}
	.hero-row {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 30px;
		margin-bottom: 30px;
	}
	.eyebrow {
		display: block;
		margin-bottom: 8px;
		color: var(--green);
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	h1,
	h2,
	p {
		margin-top: 0;
	}
	h1 {
		margin-bottom: 10px;
		font-size: clamp(30px, 4vw, 48px);
		line-height: 1.02;
		letter-spacing: -0.04em;
	}
	h2 {
		margin-bottom: 6px;
		font-size: 17px;
	}
	p {
		color: var(--muted);
		line-height: 1.6;
	}
	button {
		transition:
			transform 0.16s ease,
			border-color 0.16s ease,
			background 0.16s ease;
	}
	button:not(:disabled):active {
		transform: translateY(1px);
	}
	button:focus-visible,
	input:focus-visible,
	textarea:focus-visible,
	select:focus-visible {
		outline: 3px solid #56e6ad50;
		outline-offset: 2px;
	}
	button:disabled {
		opacity: 0.48;
		cursor: not-allowed;
	}
	.primary,
	.secondary,
	.card-action,
	.back-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		border-radius: 11px;
		min-height: 42px;
		padding: 0 17px;
		font-weight: 750;
		cursor: pointer;
	}
	.primary {
		color: #042017;
		background: var(--green);
		border: 1px solid var(--green);
	}
	.primary:hover {
		background: #78f2c3;
	}
	.secondary {
		color: #eaf4ef;
		background: var(--surface);
		border: 1px solid var(--border);
	}
	.secondary:hover {
		border-color: #3d544c;
		background: #14201e;
	}
	.project-grid,
	.component-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 16px;
	}
	.project-card,
	.component-grid article,
	.resume-card,
	.quick-card,
	.wizard-card,
	.progress-card,
	.publish-grid aside article {
		border: 1px solid var(--border);
		border-radius: 16px;
		background: linear-gradient(145deg, #11181b, #0d1315);
	}
	.project-card {
		padding: 12px;
	}
	.site-preview,
	.component-preview {
		display: flex;
		align-items: center;
		gap: 16px;
		height: 112px;
		padding: 20px;
		border-radius: 11px;
		background: #1b262c;
		overflow: hidden;
	}
	.preview-lines {
		flex: 1;
		display: grid;
		gap: 9px;
	}
	.preview-lines span,
	.component-preview span {
		height: 8px;
		border-radius: 3px;
		background: #53656b;
	}
	.preview-lines span:nth-child(2) {
		width: 72%;
	}
	.preview-lines span:nth-child(3) {
		width: 52%;
	}
	.preview-image,
	.component-preview i {
		width: 72px;
		height: 72px;
		border-radius: 10px;
		background: #174b38;
	}
	.project-heading {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		margin: 17px 4px 10px;
	}
	.project-heading p {
		margin: 0;
		color: var(--green);
		font-size: 12px;
	}
	.status {
		height: fit-content;
		color: #f2c664;
		background: #342b12;
		border-radius: 20px;
		padding: 4px 8px;
		font-size: 10px;
		text-transform: capitalize;
	}
	.status.live,
	.official {
		color: var(--green);
		background: #113427;
	}
	.project-meta {
		display: flex;
		justify-content: space-between;
		color: #71847d;
		font-size: 11px;
		margin: 0 4px 14px;
	}
	.card-action {
		width: 100%;
		color: #dbe8e3;
		background: #131d20;
		border: 1px solid var(--border);
	}
	.continue-grid {
		display: grid;
		grid-template-columns: 1.65fr 1fr;
		gap: 16px;
		margin-top: 34px;
	}
	.resume-card,
	.quick-card {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 18px;
		padding: 20px;
	}
	.quick-card {
		grid-template-columns: auto 1fr;
	}
	.quick-card .secondary {
		grid-column: 2;
		justify-self: start;
	}
	.adoption-page {
		max-width: 1040px;
	}
	.adoption-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.5fr) minmax(260px, 0.8fr);
		gap: 16px;
	}
	.report-card,
	.evidence-card {
		padding: 22px;
		border: 1px solid var(--border);
		border-radius: 16px;
		background: linear-gradient(145deg, #11181b, #0d1315);
	}
	.report-heading {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 14px;
		padding-bottom: 18px;
		border-bottom: 1px solid var(--border);
	}
	.report-heading h2,
	.evidence-card h2 {
		margin: 0;
	}
	.check-list {
		display: grid;
		gap: 5px;
		margin-top: 14px;
	}
	.check-list > div {
		display: grid;
		grid-template-columns: 28px 1fr;
		gap: 10px;
		align-items: center;
		padding: 10px;
		border-radius: 10px;
		background: #0a1113;
	}
	.check-list > div > span {
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		color: var(--green);
		border-radius: 50%;
		background: #103226;
	}
	.check-list small {
		display: block;
		margin-top: 2px;
		color: var(--muted);
		font-size: 10px;
		text-transform: capitalize;
	}
	.evidence-icon {
		display: inline-flex;
		color: var(--green);
	}
	.evidence-card p {
		color: var(--muted);
	}
	.evidence-card dl {
		display: grid;
		gap: 8px;
		margin: 20px 0;
	}
	.evidence-card dl div {
		display: flex;
		justify-content: space-between;
		gap: 14px;
		font-size: 12px;
	}
	.evidence-card dt {
		color: var(--muted);
	}
	.evidence-card dd {
		margin: 0;
		font-weight: 700;
	}
	.evidence-card .primary {
		width: 100%;
	}
	.resume-card p,
	.quick-card p {
		margin: 0;
		font-size: 13px;
	}
	.back-link {
		color: var(--muted);
		background: transparent;
		border: 0;
		padding-left: 0;
	}
	.wizard-page {
		max-width: 1040px;
	}
	.wizard-heading {
		margin: 26px 0 24px;
	}
	.wizard-heading p {
		max-width: 680px;
	}
	.stepper {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 8px;
		padding: 0;
		margin: 0 0 16px;
		list-style: none;
	}
	.stepper li {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #6f827b;
		font-size: 12px;
	}
	.stepper li span {
		display: grid;
		place-items: center;
		width: 25px;
		height: 25px;
		border-radius: 50%;
		background: #141d20;
		border: 1px solid var(--border);
	}
	.stepper li.current,
	.stepper li.complete {
		color: #e8f2ee;
	}
	.stepper li.current span,
	.stepper li.complete span {
		color: #08241a;
		background: var(--green);
		border-color: var(--green);
	}
	.wizard-card {
		min-height: 390px;
		padding: clamp(22px, 4vw, 38px);
	}
	.choice-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
	}
	.choice-grid button,
	.theme-grid button {
		display: grid;
		justify-items: start;
		gap: 8px;
		text-align: left;
		color: #edf5f1;
		padding: 16px;
		border-radius: 13px;
		border: 1px solid var(--border);
		background: #10171a;
		cursor: pointer;
	}
	.choice-grid button.selected,
	.theme-grid button.selected {
		border-color: var(--green);
		background: #10231c;
		box-shadow: 0 0 0 1px #56e6ad25;
	}
	.choice-grid small,
	.theme-grid small {
		color: var(--muted);
		line-height: 1.4;
	}
	.choice-grid em {
		color: var(--green);
		font-size: 11px;
		font-style: normal;
	}
	.theme-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 12px;
	}
	.theme-preview {
		width: 100%;
		height: 110px;
		padding: 16px;
		border-radius: 9px;
		background: #1c292d;
	}
	.theme-preview span {
		display: block;
		width: 75%;
		height: 7px;
		margin-bottom: 9px;
		background: #63756f;
	}
	.theme-preview span:nth-child(2) {
		width: 52%;
	}
	.theme-preview i {
		display: block;
		width: 35%;
		height: 45px;
		margin-top: 18px;
		border-radius: 7px;
		background: #1b513e;
	}
	.section-copy {
		margin-bottom: 24px;
	}
	.toggle-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
	}
	.toggle-grid button {
		display: flex;
		align-items: center;
		gap: 11px;
		color: #afc0ba;
		min-height: 54px;
		padding: 0 15px;
		background: #0e1518;
		border: 1px solid var(--border);
		border-radius: 11px;
		cursor: pointer;
	}
	.toggle-grid button.selected {
		color: #ecfaf4;
		border-color: #3c8065;
		background: #10251e;
	}
	.toggle-grid span {
		color: var(--green);
	}
	.identity-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 18px;
		max-width: 760px;
	}
	.identity-grid label,
	.inspector label {
		display: grid;
		gap: 8px;
		color: #a6b7b1;
		font-size: 12px;
	}
	.identity-grid input,
	.identity-grid select,
	.inspector input,
	.inspector textarea,
	.inspector select {
		width: 100%;
		color: #edf5f1;
		background: #0a1012;
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 12px;
	}
	.color-input {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 45px;
		padding: 6px 10px;
		border: 1px solid var(--border);
		border-radius: 10px;
		background: #0a1012;
	}
	.color-input input {
		width: 34px;
		height: 30px;
		border: 0;
		padding: 0;
	}
	.color-input code {
		color: #c6d5cf;
	}
	.review-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}
	.review-grid div,
	.details {
		display: grid;
		gap: 5px;
		padding: 16px;
		border-radius: 11px;
		background: #0c1315;
		border: 1px solid var(--border);
	}
	.review-grid span,
	.details span {
		color: var(--muted);
		font-size: 11px;
	}
	.honesty-note {
		display: flex;
		gap: 13px;
		margin-top: 18px;
		padding: 16px;
		color: #d8e8e1;
		border: 1px solid #245641;
		border-radius: 12px;
		background: #0d2019;
	}
	.honesty-note p {
		margin: 3px 0 0;
		font-size: 12px;
	}
	.wizard-actions {
		display: flex;
		justify-content: space-between;
		margin-top: 16px;
	}
	.studio-page {
		display: grid;
		grid-template-columns: 210px minmax(0, 1fr) 260px;
		min-height: calc(100dvh - 64px);
	}
	.studio-sidebar,
	.inspector {
		padding: 24px 16px;
		background: #090f11;
	}
	.studio-sidebar {
		border-right: 1px solid var(--border);
	}
	.studio-sidebar nav {
		display: grid;
		gap: 4px;
		margin-top: 22px;
	}
	.studio-sidebar nav span {
		margin: 15px 8px 4px;
		color: #64766f;
		font-size: 10px;
		font-weight: 800;
		text-transform: uppercase;
	}
	.studio-sidebar nav button {
		display: flex;
		align-items: center;
		gap: 10px;
		color: #9eafa8;
		padding: 10px 11px;
		border: 0;
		border-radius: 9px;
		background: transparent;
		cursor: pointer;
	}
	.studio-sidebar nav button.active {
		color: var(--green);
		background: #103226;
	}
	.ai-card {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		margin-top: 40px;
		padding: 13px;
		color: #dce9e3;
		text-align: left;
		border: 1px solid #245641;
		border-radius: 11px;
		background: #0d2019;
	}
	.content-summary {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 5px;
		margin-top: 18px;
	}
	.content-summary span {
		padding: 8px 4px;
		color: #748880;
		text-align: center;
		border: 1px solid var(--border);
		border-radius: 8px;
		font-size: 8px;
	}
	.content-summary strong {
		display: block;
		color: #dbe8e3;
		font-size: 13px;
	}
	.ai-card small {
		display: block;
		margin-top: 3px;
		color: #7f958c;
		font-size: 9px;
	}
	.canvas-area {
		min-width: 0;
		padding: 16px;
		background: #0b1113;
	}
	.studio-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		margin-bottom: 15px;
	}
	.studio-toolbar > div {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.studio-toolbar span {
		color: #81938c;
		background: #131d20;
		border-radius: 20px;
		padding: 5px 8px;
		font-size: 10px;
	}
	.studio-toolbar .saved {
		color: var(--green);
	}
	.browser-frame {
		width: min(820px, 100%);
		margin: 0 auto;
		border: 1px solid #35423f;
		border-radius: 13px;
		overflow: hidden;
		box-shadow: 0 30px 70px #0009;
	}
	.browser-top {
		display: flex;
		align-items: center;
		gap: 6px;
		height: 34px;
		padding: 0 11px;
		color: #60716b;
		background: #dde4df;
	}
	.browser-top i {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #df806f;
	}
	.browser-top i:nth-child(2) {
		background: #e5bd66;
	}
	.browser-top i:nth-child(3) {
		background: #69b886;
	}
	.browser-top span {
		margin-left: 10px;
		font-size: 9px;
	}
	.site-canvas {
		min-height: 620px;
		padding: clamp(24px, 5vw, 60px);
		color: #1c2420;
		background: #eef3ef;
	}
	.site-canvas nav {
		display: flex;
		justify-content: space-between;
		font-size: 11px;
	}
	.selected-block {
		position: relative;
		margin-top: 58px;
		padding: 28px;
		border: 2px solid var(--accent);
		border-radius: 12px;
		background: #f8fbf9;
	}
	.block-label {
		position: absolute;
		top: -12px;
		left: 16px;
		color: #06281c;
		background: var(--accent);
		border-radius: 20px;
		padding: 5px 9px;
		font-size: 9px;
		font-weight: 800;
	}
	.selected-block small,
	.story-block small {
		font-size: 9px;
		letter-spacing: 0.12em;
	}
	.selected-block h1 {
		max-width: 600px;
		margin: 10px 0;
		font-size: clamp(31px, 5vw, 58px);
	}
	.selected-block p {
		max-width: 570px;
		color: #51605a;
	}
	.selected-block button {
		color: #09251c;
		background: var(--accent);
		border: 0;
		border-radius: 8px;
		padding: 10px 13px;
		font-weight: 800;
	}
	.story-block {
		display: grid;
		grid-template-columns: 140px 1fr;
		gap: 24px;
		margin-top: 18px;
		padding: 18px;
		border-radius: 12px;
		background: #dce8df;
	}
	.story-block > div {
		min-height: 120px;
		border-radius: 9px;
		background: #71867d;
	}
	.story-block p {
		color: #4b5b54;
	}
	.add-section {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 20px auto 0;
		padding: 8px 12px;
		border: 1px solid #91a39b;
		border-radius: 20px;
		background: transparent;
	}
	.inspector {
		display: grid;
		align-content: start;
		gap: 16px;
		border-left: 1px solid var(--border);
	}
	.official {
		display: inline-block;
		border-radius: 20px;
		padding: 4px 8px;
		font-size: 9px;
	}
	.media-drop {
		display: grid;
		place-items: center;
		min-height: 110px;
		color: #7f948b;
		text-align: center;
		border: 1px dashed #355047;
		border-radius: 10px;
		background: #0d1815;
	}
	.filter-row {
		display: flex;
		gap: 6px;
		margin-bottom: 24px;
	}
	.filter-row span {
		flex: 1;
	}
	.component-grid article {
		padding: 12px;
	}
	.component-preview {
		height: 120px;
	}
	.component-preview span {
		flex: 1;
	}
	.component-preview i {
		width: 64px;
		height: 64px;
	}
	.component-preview i.round {
		border-radius: 50%;
	}
	.component-grid article > div:nth-child(2) {
		display: flex;
		gap: 8px;
		margin: 14px 0 10px;
	}
	.component-grid article h2,
	.component-grid article p {
		margin-left: 4px;
		margin-right: 4px;
	}
	.component-grid article p {
		min-height: 43px;
		font-size: 12px;
	}
	.publish-page {
		max-width: 1000px;
	}
	.publish-grid {
		display: grid;
		grid-template-columns: 1.6fr 1fr;
		gap: 16px;
	}
	.progress-card {
		padding: 28px;
	}
	.progress-row {
		display: grid;
		grid-template-columns: 28px 1fr;
		gap: 13px;
		min-height: 76px;
		position: relative;
	}
	.progress-row > span {
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		color: #73847e;
		border: 1px solid var(--border);
		border-radius: 50%;
		background: #101719;
		z-index: 1;
	}
	.progress-row:not(:last-child)::after {
		content: '';
		position: absolute;
		left: 12px;
		top: 27px;
		width: 1px;
		height: 49px;
		background: var(--border);
	}
	.progress-row.done > span {
		color: #08241a;
		background: var(--green);
	}
	.progress-row.current > span {
		color: #071216;
		background: #6db8ed;
	}
	.progress-row small {
		display: block;
		margin-top: 5px;
		color: var(--muted);
	}
	.publish-grid aside {
		display: grid;
		align-content: start;
		gap: 12px;
	}
	.publish-grid .honesty-note {
		margin: 0;
	}
	.details {
		grid-template-columns: 1fr 1fr;
	}

	@media (max-width: 900px) {
		.project-grid,
		.component-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		.choice-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		.theme-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		.studio-page {
			grid-template-columns: 180px minmax(0, 1fr);
		}
		.inspector {
			display: none;
		}
		.continue-grid,
		.publish-grid,
		.adoption-grid {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 640px) {
		.topbar {
			height: 58px;
			padding: 0 16px;
		}
		.topbar nav {
			display: none;
			position: absolute;
			inset: 58px 12px auto;
			padding: 10px;
			background: #0e1518;
			border: 1px solid var(--border);
			border-radius: 12px;
			box-shadow: 0 20px 50px #000a;
		}
		.topbar nav.open {
			display: grid;
		}
		.topbar nav button {
			text-align: left;
		}
		.mobile-menu {
			display: grid;
			place-items: center;
		}
		.connection {
			display: none;
		}
		.page {
			width: min(100% - 26px, 1180px);
			padding: 34px 0 60px;
		}
		.hero-row {
			align-items: start;
			flex-direction: column;
		}
		.hero-row .primary {
			width: 100%;
		}
		.project-grid,
		.component-grid,
		.choice-grid,
		.theme-grid,
		.toggle-grid,
		.identity-grid,
		.review-grid {
			grid-template-columns: 1fr;
		}
		.continue-grid {
			grid-template-columns: 1fr;
		}
		.resume-card,
		.quick-card {
			grid-template-columns: auto 1fr;
		}
		.resume-card .secondary {
			grid-column: 1 / -1;
		}
		.project-meta {
			align-items: start;
			flex-direction: column;
			gap: 5px;
		}
		.stepper {
			overflow-x: auto;
			padding-bottom: 6px;
		}
		.stepper li {
			min-width: 88px;
		}
		.stepper li:not(.current):not(.complete) {
			font-size: 0;
			min-width: 28px;
		}
		.wizard-actions {
			gap: 10px;
		}
		.wizard-actions .primary {
			flex: 1;
		}
		.studio-page {
			display: block;
		}
		.studio-sidebar,
		.inspector {
			display: none;
		}
		.canvas-area {
			padding: 10px;
		}
		.studio-toolbar {
			align-items: start;
			flex-direction: column;
		}
		.studio-toolbar > div:last-child {
			width: 100%;
		}
		.studio-toolbar button {
			flex: 1;
		}
		.site-canvas {
			min-height: 520px;
			padding: 25px 18px;
		}
		.site-canvas nav span {
			display: none;
		}
		.selected-block {
			margin-top: 30px;
			padding: 22px 18px;
		}
		.selected-block h1 {
			font-size: 34px;
		}
		.story-block {
			grid-template-columns: 90px 1fr;
			gap: 13px;
		}
		.story-block > div {
			min-height: 100px;
		}
		.filter-row {
			overflow-x: auto;
		}
		.filter-row span {
			display: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		button {
			transition: none;
		}
	}
</style>
