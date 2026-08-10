<script lang="ts">
	import {
		ArrowLeft,
		ArrowRight,
		ArrowUp,
		ArrowDown,
		Bold,
		Check,
		CirclePlus,
		Cloud,
		Code2,
		Copy,
		DatabaseZap,
		FileSearch,
		FileText,
		GitBranch,
		Image,
		Italic,
		LayoutGrid,
		Library,
		Languages,
		Link2,
		List,
		Menu,
		MonitorPlay,
		Paintbrush,
		PanelLeft,
		Rocket,
		RemoveFormatting,
		Settings2,
		ShieldCheck,
		TestTube2,
		Trash2,
		TriangleAlert,
		Sparkles,
		Strikethrough,
		Undo2,
		Video,
		X
	} from '@lucide/svelte';
	import { onMount } from 'svelte';

	import type { SiteGoal, SiteModule } from '../contracts/catalog';
	import { planSiteCreation } from '../planning/site-creation';

	import { demoAdoptionReport, demoChangePreview, starterCatalog } from './foundation-data';
	import ContentWorkspace from './ContentWorkspace.svelte';
	import { goals, modules, projects, themes } from './fixtures';
	import {
		assistanceEvidence,
		draftEvidence,
		libraryEvidence,
		localizationEvidence,
		mediaEvidence,
		previewEvidence
	} from './readiness-data';
	import {
		cloneDemoSite,
		createDemoSite,
		createSection,
		demoImages,
		duplicateDemoPage,
		sectionLabels,
		uniquePageSlug,
		type DemoSectionKind,
		type DemoSite
	} from './demo-site';
	import { DemoDraftStore, type DraftStorage } from './draft-storage';
	import { embedProviderLabel, getEmbedPreviewUrl, parseEmbedUrl } from './embed';
	import { assessDemoSiteHealth, type SiteHealthIssue } from './site-health';
	import {
		createLibrarySection,
		demoLibraryComponents,
		demoThemes,
		getDemoTheme,
		type DemoLibraryComponent,
		type DemoTheme
	} from './library-catalog';
	import { normalizeRichTextLink, renderRichMarkdown, richElementToMarkdown } from './rich-text';

	type View =
		'home' | 'content' | 'create' | 'adopt' | 'studio' | 'library' | 'readiness' | 'publish';
	type ReadinessArea =
		'overview' | 'health' | 'drafts' | 'media' | 'languages' | 'library' | 'preview' | 'guidance';

	let { embedded = false, storage }: { embedded?: boolean; storage?: DraftStorage } = $props();
	let view = $state<View>('home');
	let wizardStep = $state(1);
	let selectedGoal = $state<SiteGoal>('blog');
	let selectedTheme = $state('editorial');
	let selectedModules = $state<string[]>(['Home', 'About', 'Blog', 'Gallery', 'Contact']);
	let siteName = $state('Weekend Notes');
	let accent = $state('#56e6ad');
	let mobileMenu = $state(false);
	let readinessArea = $state<ReadinessArea>('overview');
	let siteDraft = $state<DemoSite>(createDemoSite());
	let selectedPageId = $state('home');
	let selectedSectionId = $state('hero-1');
	let history = $state<DemoSite[]>([]);
	let saveStatus = $state<'loading' | 'saved' | 'local' | 'error'>('loading');
	let showAddPage = $state(false);
	let showAddSection = $state(false);
	let showPreview = $state(false);
	let showDraftRecovery = $state(false);
	let recoveryBusy = $state(false);
	let newPageName = $state('');
	let deleteTarget = $state<
		| { kind: 'page'; id: string; name: string }
		| { kind: 'section'; id: string; name: string }
		| null
	>(null);
	let deleteConfirmation = $state('');
	let studioPanel = $state<'outline' | 'canvas' | 'inspector'>('canvas');
	let conflictChoice = $state<'keep_draft' | 'use_repository' | null>(null);
	let libraryView = $state<'components' | 'themes'>('components');
	let libraryPreview = $state<DemoLibraryComponent | null>(null);
	let libraryNotice = $state('');
	let writingToolsExpanded = $state(false);
	type RichField = 'title' | 'body';
	let activeRichEdit = $state<{
		sectionId: string;
		field: RichField;
		element: HTMLElement;
	} | null>(null);
	let richToolbar = $state<HTMLElement | null>(null);
	let linkEditorOpen = $state(false);
	let insertMenuOpen = $state(false);
	let showEmbedDialog = $state(false);
	let embedSource = $state('');
	let embedError = $state('');
	let loadedEmbeds = $state<string[]>([]);
	let linkUrl = $state('');
	let richLinkError = $state('');
	let richSelection: Range | null = null;
	let outlineWidth = $state(230);
	let inspectorWidth = $state(300);
	let panelResize = $state<{
		side: 'outline' | 'inspector';
		startX: number;
		startWidth: number;
	} | null>(null);
	const draftStorageKey = 'studio-draft-v1';
	let draftStore: DemoDraftStore | null = null;
	let latestSaveRequest = 0;
	const selectedPage = $derived(
		siteDraft.pages.find((page) => page.id === selectedPageId) ?? siteDraft.pages[0]
	);
	const selectedSection = $derived(
		selectedPage?.sections.find((section) => section.id === selectedSectionId) ??
			selectedPage?.sections[0]
	);
	const projectImages = [demoImages.lake, demoImages.notes, demoImages.cabin];
	const siteHealth = $derived(assessDemoSiteHealth(siteDraft));
	const activeTheme = $derived(getDemoTheme(siteDraft.themeId));
	const detectedEmbed = $derived(parseEmbedUrl(embedSource));

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
	const contentIndex = $derived.by(() => {
		const posts = siteDraft.collections.flatMap((collection) => collection.items);
		return {
			total: posts.length,
			drafts: posts.filter((post) => post.status === 'draft').length,
			byLocale: { en: posts.length }
		};
	});

	function richContent(node: HTMLElement, markdown: string) {
		const update = (next: string) => {
			// renderRichMarkdown escapes raw HTML and validates every link before
			// this bounded projection reaches the DOM. Never overwrite an active
			// editing host because doing so would destroy its live selection.
			if (document.activeElement !== node) node.innerHTML = renderRichMarkdown(next);
		};
		update(markdown);
		return { update };
	}

	onMount(() => {
		if (!storage) {
			saveStatus = 'local';
			return;
		}
		draftStore = new DemoDraftStore(storage, draftStorageKey);
		void draftStore
			?.load()
			.then((stored) => {
				if (stored && latestSaveRequest === 0) siteDraft = cloneDemoSite(stored.site);
				saveStatus = 'saved';
			})
			.catch(() => (saveStatus = 'error'));
	});

	function saveDraft(next: DemoSite) {
		if (!draftStore) {
			saveStatus = 'local';
			return;
		}
		const request = ++latestSaveRequest;
		saveStatus = 'loading';
		void draftStore
			.save(next)
			.then(() => {
				if (request === latestSaveRequest) saveStatus = 'saved';
			})
			.catch(() => {
				if (request === latestSaveRequest) saveStatus = 'error';
			});
	}

	async function retryDraftSave() {
		if (!draftStore || recoveryBusy) return;
		recoveryBusy = true;
		try {
			await draftStore.retryLoad();
			showDraftRecovery = false;
			saveDraft(siteDraft);
		} catch {
			saveStatus = 'error';
		} finally {
			recoveryBusy = false;
		}
	}

	async function replaceSavedDraft() {
		if (!draftStore || recoveryBusy) return;
		recoveryBusy = true;
		try {
			await draftStore.reset();
			showDraftRecovery = false;
			saveDraft(siteDraft);
		} catch {
			saveStatus = 'error';
		} finally {
			recoveryBusy = false;
		}
	}

	function changeDraft(mutator: (next: DemoSite) => void) {
		history = [...history.slice(-19), cloneDemoSite(siteDraft)];
		const next = cloneDemoSite(siteDraft);
		mutator(next);
		siteDraft = next;
		saveDraft(next);
	}

	function undoDraft() {
		const previous = history.at(-1);
		if (!previous) return;
		history = history.slice(0, -1);
		siteDraft = cloneDemoSite(previous);
		if (!siteDraft.pages.some((page) => page.id === selectedPageId)) {
			selectedPageId = siteDraft.pages[0].id;
		}
		selectedSectionId =
			siteDraft.pages.find((page) => page.id === selectedPageId)?.sections[0]?.id ?? '';
		saveDraft(siteDraft);
	}

	function selectPage(pageId: string) {
		selectedPageId = pageId;
		selectedSectionId = siteDraft.pages.find((page) => page.id === pageId)?.sections[0]?.id ?? '';
	}

	function addPage() {
		const name = newPageName.trim();
		if (!name) return;
		const id = `${
			name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '') || 'page'
		}-${Date.now()}`;
		changeDraft((next) => {
			next.pages.push({
				id,
				name: name.slice(0, 50),
				slug: uniquePageSlug(name, next.pages),
				sections: [createSection('hero', Date.now())]
			});
		});
		selectPage(id);
		newPageName = '';
		showAddPage = false;
	}

	function updatePage(field: 'name' | 'slug', value: string) {
		changeDraft((next) => {
			const page = next.pages.find((item) => item.id === selectedPageId);
			if (!page) return;
			if (field === 'name') {
				const name = value.trim().slice(0, 50);
				if (name) page.name = name;
				return;
			}
			page.slug = uniquePageSlug(value, next.pages, page.id);
		});
	}

	function duplicateSelectedPage() {
		if (!selectedPage) return;
		const copy = duplicateDemoPage(selectedPage, siteDraft.pages, Date.now());
		changeDraft((next) => next.pages.push(copy));
		selectPage(copy.id);
	}

	function requestDeletePage() {
		if (!selectedPage || selectedPage.id === 'home' || siteDraft.pages.length <= 1) return;
		deleteTarget = { kind: 'page', id: selectedPage.id, name: selectedPage.name };
		deleteConfirmation = '';
	}

	function requestDeleteSection() {
		if (!selectedSection || (selectedPage?.sections.length ?? 0) <= 1) return;
		deleteTarget = { kind: 'section', id: selectedSection.id, name: selectedSection.label };
		deleteConfirmation = '';
	}

	function confirmDelete() {
		if (!deleteTarget || deleteConfirmation.trim() !== deleteTarget.name) return;
		if (deleteTarget.kind === 'page') {
			const targetId = deleteTarget.id;
			const fallback = siteDraft.pages.find((page) => page.id !== targetId);
			changeDraft((next) => {
				next.pages = next.pages.filter((page) => page.id !== targetId);
			});
			if (fallback) selectPage(fallback.id);
		} else {
			const targetId = deleteTarget.id;
			const fallback = selectedPage?.sections.find((section) => section.id !== targetId);
			changeDraft((next) => {
				const page = next.pages.find((item) => item.id === selectedPageId);
				if (page) page.sections = page.sections.filter((section) => section.id !== targetId);
			});
			selectedSectionId = fallback?.id ?? '';
		}
		deleteTarget = null;
		deleteConfirmation = '';
	}

	function addSection(kind: DemoSectionKind) {
		const section = createSection(kind, Date.now());
		changeDraft((next) => {
			const page = next.pages.find((item) => item.id === selectedPageId);
			page?.sections.push(section);
		});
		selectedSectionId = section.id;
		showAddSection = false;
	}

	function updateSection(field: 'eyebrow' | 'title' | 'body' | 'imageAlt', value: string) {
		changeDraft((next) => {
			const section = next.pages
				.find((page) => page.id === selectedPageId)
				?.sections.find((item) => item.id === selectedSectionId);
			if (section) section[field] = value.slice(0, field === 'body' ? 600 : 240);
		});
	}

	function commitInlineEdit(
		sectionId: string,
		field: 'eyebrow' | 'title' | 'body',
		element: HTMLElement
	) {
		const value = element.innerText.replace(/\u00a0/g, ' ').trim();
		const section = selectedPage?.sections.find((item) => item.id === sectionId);
		if (!section || section[field] === value) return;
		selectedSectionId = sectionId;
		updateSection(field, value);
	}

	function beginRichEdit(sectionId: string, field: RichField, element: HTMLElement) {
		selectedSectionId = sectionId;
		activeRichEdit = { sectionId, field, element };
		writingToolsExpanded = false;
		linkEditorOpen = false;
		insertMenuOpen = false;
		linkUrl = '';
		richLinkError = '';
		captureRichSelection();
	}

	function captureRichSelection() {
		if (!activeRichEdit) return;
		const selection = window.getSelection();
		if (!selection?.rangeCount) return;
		const range = selection.getRangeAt(0);
		if (activeRichEdit.element.contains(range.commonAncestorContainer)) {
			richSelection = range.cloneRange();
		}
	}

	function commitActiveRichEdit() {
		if (!activeRichEdit) return;
		const { sectionId, field, element } = activeRichEdit;
		const value = richElementToMarkdown(element).slice(0, field === 'body' ? 600 : 240);
		const section = selectedPage?.sections.find((item) => item.id === sectionId);
		if (!section || section[field] === value) return;
		selectedSectionId = sectionId;
		updateSection(field, value);
	}

	function handleRichBlur() {
		window.setTimeout(() => {
			if (richToolbar?.contains(document.activeElement)) {
				if (!linkEditorOpen && !insertMenuOpen) commitActiveRichEdit();
				return;
			}
			commitActiveRichEdit();
			activeRichEdit = null;
			linkEditorOpen = false;
			insertMenuOpen = false;
			richSelection = null;
		}, 0);
	}

	function selectedRichRange(): Range | null {
		if (!activeRichEdit) return null;
		const range = richSelection?.cloneRange() ?? document.createRange();
		const belongsToEditor =
			activeRichEdit.element.contains(range.startContainer) &&
			activeRichEdit.element.contains(range.endContainer);
		if (!belongsToEditor || range.collapsed) range.selectNodeContents(activeRichEdit.element);
		return range;
	}

	function selectRichResult(node: Node) {
		if (!activeRichEdit) return;
		activeRichEdit.element.focus();
		const range = document.createRange();
		range.selectNodeContents(node);
		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(range);
		richSelection = range.cloneRange();
	}

	function wrapRichSelection(tag: 'strong' | 'em' | 's' | 'code' | 'div' | 'h2' | 'h3') {
		const range = selectedRichRange();
		if (!range) return;
		const wrapper = document.createElement(tag);
		wrapper.append(range.extractContents());
		range.insertNode(wrapper);
		selectRichResult(wrapper);
	}

	function preserveRichSelection(event: PointerEvent) {
		captureRichSelection();
		event.preventDefault();
	}

	function applyRichCommand(
		command:
			'bold' | 'italic' | 'strikethrough' | 'inlineCode' | 'insertUnorderedList' | 'removeFormat'
	) {
		if (!activeRichEdit) return;
		const range = selectedRichRange();
		if (!range) return;
		if (
			command === 'bold' ||
			command === 'italic' ||
			command === 'strikethrough' ||
			command === 'inlineCode'
		) {
			wrapRichSelection(
				command === 'bold'
					? 'strong'
					: command === 'italic'
						? 'em'
						: command === 'strikethrough'
							? 's'
							: 'code'
			);
		} else if (command === 'insertUnorderedList') {
			const list = document.createElement('ul');
			for (const line of range.toString().split(/\n+/).filter(Boolean)) {
				const item = document.createElement('li');
				item.textContent = line;
				list.append(item);
			}
			range.deleteContents();
			range.insertNode(list);
			selectRichResult(list);
		} else {
			const text = document.createTextNode(range.toString());
			range.deleteContents();
			range.insertNode(text);
			selectRichResult(text);
		}
	}

	function applyTextStyle(event: Event & { currentTarget: HTMLSelectElement }) {
		if (!activeRichEdit) return;
		const tag = event.currentTarget.value;
		wrapRichSelection(tag === 'h2' ? 'h2' : tag === 'h3' ? 'h3' : 'div');
	}

	function openLinkEditor() {
		captureRichSelection();
		linkEditorOpen = true;
		insertMenuOpen = false;
		linkUrl = '';
		richLinkError = '';
	}

	function applyRichLink() {
		const href = normalizeRichTextLink(linkUrl);
		if (!href) {
			richLinkError = 'Use a web, email, or site link.';
			return;
		}
		const range = selectedRichRange();
		if (!range) return;
		const anchor = document.createElement('a');
		anchor.href = href;
		anchor.target = '_blank';
		anchor.rel = 'noopener noreferrer';
		anchor.append(range.extractContents());
		range.insertNode(anchor);
		selectRichResult(anchor);
		linkEditorOpen = false;
		linkUrl = '';
		richLinkError = '';
		captureRichSelection();
	}

	function closeRichEditor() {
		commitActiveRichEdit();
		activeRichEdit?.element.blur();
		activeRichEdit = null;
		linkEditorOpen = false;
		insertMenuOpen = false;
		richSelection = null;
	}

	function toggleInsertMenu() {
		captureRichSelection();
		insertMenuOpen = !insertMenuOpen;
		linkEditorOpen = false;
	}

	function openEmbedEditor() {
		commitActiveRichEdit();
		insertMenuOpen = false;
		showEmbedDialog = true;
		embedSource = '';
		embedError = '';
	}

	function addEmbedSection() {
		const embed = parseEmbedUrl(embedSource);
		if (!embed) {
			embedError = 'Paste a complete YouTube, Vimeo, X post, or Twitch link.';
			return;
		}
		const section = createSection('embed', Date.now());
		section.embed = embed;
		section.label = embedProviderLabel(embed.provider);
		section.title = `${embedProviderLabel(embed.provider)} content`;
		changeDraft((next) => {
			const page = next.pages.find((item) => item.id === selectedPageId);
			if (!page) return;
			const currentIndex = page.sections.findIndex((item) => item.id === selectedSectionId);
			page.sections.splice(currentIndex < 0 ? page.sections.length : currentIndex + 1, 0, section);
		});
		selectedSectionId = section.id;
		showEmbedDialog = false;
		embedSource = '';
		embedError = '';
	}

	function updateSelectedEmbed(value: string) {
		const embed = parseEmbedUrl(value);
		if (!embed) {
			embedError = 'Paste a complete YouTube, Vimeo, X post, or Twitch link.';
			return;
		}
		changeDraft((next) => {
			const section = next.pages
				.find((page) => page.id === selectedPageId)
				?.sections.find((item) => item.id === selectedSectionId);
			if (section?.kind === 'embed') section.embed = embed;
		});
		embedError = '';
	}

	function loadEmbed(sectionId: string) {
		if (!loadedEmbeds.includes(sectionId)) loadedEmbeds = [...loadedEmbeds, sectionId];
	}

	function handleRichPaste(event: ClipboardEvent) {
		event.preventDefault();
		const text = event.clipboardData?.getData('text/plain') ?? '';
		const selection = window.getSelection();
		if (!selection?.rangeCount) return;
		const range = selection.getRangeAt(0);
		range.deleteContents();
		const textNode = document.createTextNode(text);
		range.insertNode(textNode);
		selectRichResult(textNode);
	}

	function handleInlineKeydown(event: KeyboardEvent, multiline = false) {
		if (event.key === 'Tab' && activeRichEdit) commitActiveRichEdit();
		if (event.key === 'Escape') {
			event.preventDefault();
			(event.currentTarget as HTMLElement).blur();
		}
		if (!multiline && event.key === 'Enter') {
			event.preventDefault();
			(event.currentTarget as HTMLElement).blur();
		}
	}

	function focusInlineField(field: 'title' | 'body') {
		const match = Array.from(document.querySelectorAll<HTMLElement>('[data-inline-field]')).find(
			(element) =>
				element.dataset.inlineSection === selectedSectionId && element.dataset.inlineField === field
		);
		match?.focus();
	}

	function beginPanelResize(side: 'outline' | 'inspector', event: PointerEvent) {
		if (window.innerWidth <= 900) return;
		panelResize = {
			side,
			startX: event.clientX,
			startWidth: side === 'outline' ? outlineWidth : inspectorWidth
		};
		event.preventDefault();
	}

	function resizeStudioPanels(event: PointerEvent) {
		if (!panelResize) return;
		const delta = event.clientX - panelResize.startX;
		if (panelResize.side === 'outline') {
			outlineWidth = Math.max(190, Math.min(420, panelResize.startWidth + delta));
		} else {
			inspectorWidth = Math.max(260, Math.min(480, panelResize.startWidth - delta));
		}
	}

	function finishPanelResize() {
		panelResize = null;
	}

	function openHealthIssue(issue: SiteHealthIssue) {
		selectPage(issue.pageId);
		if (issue.sectionId) selectedSectionId = issue.sectionId;
		studioPanel = issue.sectionId ? 'inspector' : 'outline';
		open('studio');
	}

	function handleGlobalKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;
		if (libraryPreview) libraryPreview = null;
		else if (showDraftRecovery && !recoveryBusy) showDraftRecovery = false;
		else if (deleteTarget) deleteTarget = null;
		else if (showAddPage) showAddPage = false;
		else if (showAddSection) showAddSection = false;
		else if (showEmbedDialog) showEmbedDialog = false;
		else if (showPreview) showPreview = false;
	}

	function toggleModule(module: string) {
		selectedModules = selectedModules.includes(module)
			? selectedModules.filter((item) => item !== module)
			: [...selectedModules, module];
	}

	function open(next: View) {
		view = next;
		mobileMenu = false;
	}

	function moveSelectedBlock(direction: 'up' | 'down', sectionId = selectedSectionId) {
		const sections = selectedPage?.sections ?? [];
		const index = sections.findIndex((section) => section.id === sectionId);
		const target = direction === 'up' ? index - 1 : index + 1;
		if (index < 0 || target < 0 || target >= sections.length) return;
		changeDraft((next) => {
			const page = next.pages.find((item) => item.id === selectedPageId);
			if (!page) return;
			[page.sections[index], page.sections[target]] = [page.sections[target], page.sections[index]];
		});
	}

	function addReviewedComponent(component: DemoLibraryComponent) {
		const section = createLibrarySection(component, Date.now());
		changeDraft((next) => {
			const page = next.pages.find((item) => item.id === selectedPageId);
			page?.sections.push(section);
		});
		selectedSectionId = section.id;
		libraryPreview = null;
		libraryNotice = `${component.name} was added to ${selectedPage?.name ?? 'this page'}.`;
		studioPanel = 'inspector';
		open('studio');
	}

	function applyReviewedTheme(theme: DemoTheme) {
		changeDraft((next) => {
			next.themeId = theme.id;
			next.accent = theme.accent;
		});
		libraryNotice = `${theme.name} is now applied to this local draft.`;
	}
</script>

<svelte:head>
	<title>TEND Sites — Your website, not ours</title>
	<meta
		name="description"
		content="A Git-native publishing studio for tend.host. This foundation preview does not modify repositories."
	/>
</svelte:head>

<svelte:window
	onkeydown={handleGlobalKeydown}
	onpointermove={resizeStudioPanels}
	onpointerup={finishPanelResize}
/>

<div class:embedded class="sites-shell">
	<header class="topbar">
		<button class="brand" aria-label="Open Sites home" onclick={() => open('home')}>
			<span class="brand-mark"><Sparkles size={17} strokeWidth={2.4} /></span>
			<span><strong>TEND</strong> Sites</span>
		</button>
		<nav class:open={mobileMenu} aria-label="Sites navigation">
			<button
				class:active={view === 'home'}
				aria-label="Your sites"
				title="Your sites"
				onclick={() => open('home')}><LayoutGrid size={17} /><span>Your sites</span></button
			>
			<button
				class:active={view === 'studio'}
				aria-label="Studio"
				title="Studio"
				onclick={() => open('studio')}><Paintbrush size={17} /><span>Studio</span></button
			>
			<button
				class:active={view === 'content'}
				aria-label="Content"
				title="Content"
				onclick={() => open('content')}><FileText size={17} /><span>Content</span></button
			>
			<button
				class:active={view === 'library'}
				aria-label="Library"
				title="Library"
				onclick={() => open('library')}><Library size={17} /><span>Library</span></button
			>
			<button
				class:active={view === 'readiness'}
				onclick={() => open('readiness')}
				aria-label="Readiness"
				title="Readiness"><ShieldCheck size={17} /><span>Readiness</span></button
			>
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
				{#each projects as project, projectIndex (project.id)}
					<article class="project-card">
						<div class="site-preview rich-preview" aria-hidden="true">
							<img src={projectImages[projectIndex]} alt="" />
							<div>
								<small
									>{projectIndex === 0
										? 'TRAVEL JOURNAL'
										: projectIndex === 1
											? 'FIELD GUIDE'
											: 'WEEKEND NOTES'}</small
								><strong>{project.name}</strong>
							</div>
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
						<button
							class="card-action"
							onclick={() => {
								selectPage('home');
								open('studio');
							}}
							>{projectIndex === 0 ? 'Open interactive demo' : 'Open Studio'}
							<ArrowRight size={16} /></button
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
	{:else if view === 'content'}
		<ContentWorkspace site={siteDraft} onchange={changeDraft} />
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
		<main
			class:resizing={panelResize !== null}
			class="studio-page"
			style:--outline-width={`${outlineWidth}px`}
			style:--inspector-width={`${inspectorWidth}px`}
		>
			<div class="studio-mobile-tabs" aria-label="Studio workspace">
				<button class:active={studioPanel === 'outline'} onclick={() => (studioPanel = 'outline')}
					>Outline</button
				>
				<button class:active={studioPanel === 'canvas'} onclick={() => (studioPanel = 'canvas')}
					>Canvas</button
				>
				<button
					class:active={studioPanel === 'inspector'}
					onclick={() => (studioPanel = 'inspector')}>Inspector</button
				>
			</div>
			<aside
				class:mobile-visible={studioPanel === 'outline'}
				class="studio-sidebar"
				aria-label="Site outline"
			>
				<div>
					<span class="eyebrow">{siteDraft.name}</span>
					<h2>{selectedPage?.name ?? 'Page'}</h2>
				</div>
				<nav class="page-list">
					<span>Pages</span>
					{#each siteDraft.pages as page (page.id)}
						<button class:active={selectedPageId === page.id} onclick={() => selectPage(page.id)}>
							{#if page.id === 'home'}<PanelLeft size={17} />{:else}<FileText size={17} />{/if}
							{page.name}
						</button>
					{/each}
					<button class="add-page-button" onclick={() => (showAddPage = true)}
						><CirclePlus size={17} /> Add page</button
					>
					<span>Design</span>
					<button onclick={() => open('library')}><Settings2 size={17} /> Theme</button><button
						onclick={() => open('library')}><Library size={17} /> Components</button
					>
				</nav>
				<div class="block-outline" aria-label="Page blocks">
					<span>Sections</span>
					{#each selectedPage?.sections ?? [] as section (section.id)}
						<button
							class:active={selectedSectionId === section.id}
							aria-pressed={selectedSectionId === section.id}
							onclick={() => (selectedSectionId = section.id)}
							onfocus={() => (selectedSectionId = section.id)}
							onkeydown={(event) => {
								if (event.altKey && event.key === 'ArrowUp') {
									event.preventDefault();
									moveSelectedBlock('up', section.id);
								}
								if (event.altKey && event.key === 'ArrowDown') {
									event.preventDefault();
									moveSelectedBlock('down', section.id);
								}
							}}>{section.label}</button
						>
					{/each}
					<button class="add-section-outline" onclick={() => (showAddSection = true)}
						><CirclePlus size={15} /> Add section</button
					>
				</div>
				<div class="content-summary" aria-label="Content overview">
					<span><strong>{contentIndex.total}</strong> entries</span>
					<span><strong>{contentIndex.drafts}</strong> drafts</span>
					<span><strong>{Object.keys(contentIndex.byLocale).length}</strong> languages</span>
				</div>
				<button class="ai-card" disabled title="AI guidance is not connected in this release."
					><Sparkles size={18} /><span
						><strong>Ask Sites AI</strong><small>Capability not connected yet</small></span
					></button
				>
			</aside>
			<div
				class="panel-resizer"
				role="separator"
				aria-label="Resize site outline"
				aria-orientation="vertical"
				onpointerdown={(event) => beginPanelResize('outline', event)}
			></div>
			<section class:mobile-visible={studioPanel === 'canvas'} class="canvas-area">
				<div class="studio-toolbar">
					<div class="studio-context">
						<strong>{selectedPage?.name ?? 'Page'}</strong><span
							class="toolbar-meta"
							title="Editing in English"><Languages size={14} /><span>English</span></span
						><span
							class:saved={saveStatus !== 'error'}
							class="save-state"
							title={saveStatus === 'loading'
								? 'Saving'
								: saveStatus === 'saved'
									? 'Saved in this panel'
									: saveStatus === 'error'
										? 'Could not save'
										: 'Local demo session'}
							aria-live="polite"
							>{#if saveStatus === 'error'}<TriangleAlert
									size={14}
								/>{:else if saveStatus === 'loading'}<Cloud size={14} />{:else}<Check
									size={14}
								/>{/if}<span
								>{saveStatus === 'loading'
									? 'Saving…'
									: saveStatus === 'saved'
										? 'Saved in this panel'
										: saveStatus === 'error'
											? 'Could not save'
											: 'Local demo session'}</span
							></span
						>
						{#if saveStatus === 'error'}<button
								class="save-recovery"
								aria-label="Resolve save issue"
								title="Resolve save issue"
								onclick={() => (showDraftRecovery = true)}
								><TriangleAlert size={15} /><span>Resolve save issue</span></button
							>{/if}
					</div>
					<div class="studio-actions">
						<button
							class="secondary"
							disabled={history.length === 0}
							aria-label="Undo last change"
							title="Undo last change"
							onclick={undoDraft}><Undo2 size={16} /><span>Undo</span></button
						>
						<button
							class:attention={siteHealth.status === 'needs_attention'}
							class="secondary health-button"
							aria-label={siteHealth.status === 'ready'
								? 'Site health: Ready'
								: `Site health: ${siteHealth.issues.length} to review`}
							title={siteHealth.status === 'ready'
								? 'Site health: Ready'
								: `Site health: ${siteHealth.issues.length} to review`}
							onclick={() => {
								readinessArea = 'health';
								open('readiness');
							}}
						>
							{#if siteHealth.status === 'ready'}<ShieldCheck size={16} /><span
									>Site health: Ready</span
								>{:else}<TriangleAlert size={16} />
								<span>{siteHealth.issues.length} to review</span>{/if}
						</button>
						<button
							class="secondary"
							aria-label="Preview site"
							title="Preview site"
							onclick={() => (showPreview = true)}
							><MonitorPlay size={16} /><span>Preview site</span></button
						><button
							class="primary"
							aria-label="Publish"
							title="Publish"
							onclick={() => open('publish')}><Rocket size={16} /><span>Publish</span></button
						>
					</div>
				</div>
				<div class="browser-frame">
					<div class="browser-top"><i></i><i></i><i></i><span>weekend-notes.example</span></div>
					<div
						class="site-canvas complete-demo"
						style:--accent={siteDraft.accent}
						style:--site-paper={activeTheme.paper}
						style:--site-ink={activeTheme.ink}
					>
						<nav>
							<strong>{siteDraft.name}</strong><span
								>{siteDraft.pages.map((page) => page.name).join('   ·   ')}</span
							>
						</nav>
						{#each selectedPage?.sections ?? [] as section (section.id)}
							<article
								class:selected-section={selectedSectionId === section.id}
								class="canvas-section {section.kind}"
							>
								<button
									class="section-select-overlay"
									aria-label="Select {section.label} section"
									onclick={() => (selectedSectionId = section.id)}
								></button>
								<span class="block-label">{sectionLabels[section.kind]}</span>
								{#if section.image}<img src={section.image} alt={section.imageAlt ?? ''} />{/if}
								{#if section.kind === 'embed' && section.embed}
									<div class="embed-block">
										<div class="embed-heading">
											<span>{embedProviderLabel(section.embed.provider)}</span>
											<strong>{section.title}</strong>
											<small>{section.body}</small>
										</div>
										{#if getEmbedPreviewUrl(section.embed)}
											{#if loadedEmbeds.includes(section.id)}
												<iframe
													src={getEmbedPreviewUrl(section.embed) ?? ''}
													title="{embedProviderLabel(section.embed.provider)} preview"
													loading="lazy"
													allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
													referrerpolicy="strict-origin-when-cross-origin"
													sandbox="allow-scripts allow-same-origin allow-presentation"
												></iframe>
											{:else}
												<button class="load-embed" onclick={() => loadEmbed(section.id)}>
													<Video size={18} /> Load private preview
												</button>
											{/if}
										{:else}
											<!-- eslint-disable svelte/no-navigation-without-resolve -- sourceUrl is a validated canonical external URL. -->
											<a
												class="open-embed"
												href={section.embed.sourceUrl}
												target="_blank"
												rel="noopener noreferrer"
												>Open on {embedProviderLabel(section.embed.provider)}</a
											>
											<!-- eslint-enable svelte/no-navigation-without-resolve -->
										{/if}
										<small class="embed-privacy"
											>External content loads only when you choose it.</small
										>
									</div>
								{:else}
									<div>
										<span
											class="inline-eyebrow"
											contenteditable="plaintext-only"
											role="textbox"
											tabindex="0"
											aria-label="Edit {section.label} eyebrow"
											data-inline-section={section.id}
											data-inline-field="eyebrow"
											onfocus={() => (selectedSectionId = section.id)}
											onkeydown={handleInlineKeydown}
											onblur={(event) =>
												commitInlineEdit(section.id, 'eyebrow', event.currentTarget)}
											>{section.eyebrow}</span
										>
										<div
											class="inline-title"
											contenteditable="true"
											role="textbox"
											tabindex="0"
											aria-label="Edit {section.label} title"
											data-inline-section={section.id}
											data-inline-field="title"
											onfocus={(event) => beginRichEdit(section.id, 'title', event.currentTarget)}
											onmouseup={captureRichSelection}
											onkeyup={captureRichSelection}
											onkeydown={handleInlineKeydown}
											onpaste={handleRichPaste}
											onblur={handleRichBlur}
											use:richContent={section.title}
										></div>
										<div
											class="inline-body"
											contenteditable="true"
											role="textbox"
											tabindex="0"
											aria-multiline="true"
											aria-label="Edit {section.label} text"
											data-inline-section={section.id}
											data-inline-field="body"
											onfocus={(event) => beginRichEdit(section.id, 'body', event.currentTarget)}
											onmouseup={captureRichSelection}
											onkeyup={captureRichSelection}
											onkeydown={(event) => handleInlineKeydown(event, true)}
											onpaste={handleRichPaste}
											onblur={handleRichBlur}
											use:richContent={section.body}
										></div>
										{#if section.kind === 'hero'}<span class="demo-cta">Read the latest story</span
											>{/if}
									</div>
								{/if}
							</article>
						{/each}
						<button class="add-section" onclick={() => (showAddSection = true)}
							><CirclePlus size={15} /> Add section</button
						>
					</div>
				</div>
				{#if activeRichEdit}
					<div bind:this={richToolbar} class="rich-toolbar" aria-label="Text formatting tools">
						<div class="rich-toolbar-main">
							<strong>{activeRichEdit.field === 'title' ? 'Title' : 'Text'}</strong>
							<span aria-hidden="true"></span>
							<button
								aria-label="Bold"
								title="Bold"
								onpointerdown={preserveRichSelection}
								onclick={() => applyRichCommand('bold')}><Bold size={15} /></button
							>
							<button
								aria-label="Italic"
								title="Italic"
								onpointerdown={preserveRichSelection}
								onclick={() => applyRichCommand('italic')}><Italic size={15} /></button
							>
							<button
								aria-label="Strikethrough"
								title="Strikethrough"
								onpointerdown={preserveRichSelection}
								onclick={() => applyRichCommand('strikethrough')}
								><Strikethrough size={15} /></button
							>
							<button
								aria-label="Inline code"
								title="Inline code"
								onpointerdown={preserveRichSelection}
								onclick={() => applyRichCommand('inlineCode')}><Code2 size={15} /></button
							>
							{#if activeRichEdit.field === 'body'}
								<select
									aria-label="Text style"
									onpointerdown={captureRichSelection}
									onchange={applyTextStyle}
								>
									<option value="div">Normal</option>
									<option value="h2">Heading</option>
									<option value="h3">Subheading</option>
								</select>
								<button
									aria-label="Bulleted list"
									title="Bulleted list"
									onpointerdown={preserveRichSelection}
									onclick={() => applyRichCommand('insertUnorderedList')}><List size={15} /></button
								>
							{/if}
							<button
								aria-label="Add link"
								title="Add link"
								onpointerdown={preserveRichSelection}
								onclick={openLinkEditor}><Link2 size={15} /></button
							>
							{#if activeRichEdit.field === 'body'}
								<button
									class:active={insertMenuOpen}
									aria-label="Insert content"
									aria-expanded={insertMenuOpen}
									title="Insert content"
									onpointerdown={preserveRichSelection}
									onclick={toggleInsertMenu}><CirclePlus size={15} /><span>Insert</span></button
								>
							{/if}
							<button
								aria-label="Clear formatting"
								title="Clear formatting"
								onpointerdown={preserveRichSelection}
								onclick={() => applyRichCommand('removeFormat')}
								><RemoveFormatting size={15} /></button
							>
							<button
								class="close-rich-toolbar"
								aria-label="Close text tools"
								onclick={closeRichEditor}><X size={15} /></button
							>
						</div>
						{#if linkEditorOpen}
							<div class="link-editor">
								<label>
									<span>Link address</span>
									<input
										placeholder="https://example.com or /about"
										bind:value={linkUrl}
										onkeydown={(event) => {
											if (event.key === 'Enter') applyRichLink();
											if (event.key === 'Escape') linkEditorOpen = false;
										}}
									/>
								</label>
								<button class="apply-link" onclick={applyRichLink}>Apply link</button>
								{#if richLinkError}<small role="alert">{richLinkError}</small>{/if}
							</div>
						{:else if insertMenuOpen}
							<div class="insert-menu" aria-label="Insert content menu">
								<button onclick={openEmbedEditor}>
									<span class="insert-icon"><Video size={18} /></span>
									<span
										><strong>Video or social post</strong><small>YouTube, Vimeo, X, or Twitch</small
										></span
									>
								</button>
								<p>Responsive sizing is automatic. No embed code needed.</p>
							</div>
						{/if}
					</div>
				{:else}
					<div
						class:expanded={writingToolsExpanded}
						class="writing-tools"
						aria-label="Writing tools"
					>
						<button
							class="writing-tools-toggle"
							aria-expanded={writingToolsExpanded}
							onclick={() => (writingToolsExpanded = !writingToolsExpanded)}
							><Paintbrush size={16} />
							{writingToolsExpanded ? 'Hide tools' : 'Writing tools'}</button
						>
						{#if writingToolsExpanded}
							<span></span>
							<button onclick={() => focusInlineField('title')}>Edit title</button>
							<button onclick={() => focusInlineField('body')}>Edit text</button>
							<button onclick={() => (showAddSection = true)}>Add section</button>
							<button onclick={() => open('library')}>Library</button>
						{/if}
					</div>
				{/if}
			</section>
			<div
				class="panel-resizer"
				role="separator"
				aria-label="Resize block settings"
				aria-orientation="vertical"
				onpointerdown={(event) => beginPanelResize('inspector', event)}
			></div>
			<aside
				class:mobile-visible={studioPanel === 'inspector'}
				class="inspector"
				aria-label="Selected block settings"
			>
				<section class="inspector-section" aria-labelledby="page-settings-title">
					<div>
						<span class="eyebrow">Current page</span>
						<h2 id="page-settings-title">Page settings</h2>
					</div>
					<label
						><span>Page name</span><input
							value={selectedPage?.name ?? ''}
							maxlength="50"
							onchange={(event) => updatePage('name', event.currentTarget.value)}
						/></label
					>
					<label
						><span>Page address</span><input
							value={selectedPage?.slug ?? '/'}
							maxlength="80"
							disabled={selectedPage?.id === 'home'}
							onchange={(event) => updatePage('slug', event.currentTarget.value)}
						/></label
					>
					<div class="page-actions">
						<button class="secondary" onclick={duplicateSelectedPage}
							><Copy size={15} /> Duplicate page</button
						>
						<button
							class="danger-button"
							disabled={selectedPage?.id === 'home' || siteDraft.pages.length <= 1}
							title={selectedPage?.id === 'home' ? 'The home page cannot be removed.' : undefined}
							onclick={requestDeletePage}><Trash2 size={15} /> Remove page</button
						>
					</div>
				</section>
				<hr />
				<div>
					<span class="eyebrow">Selected block</span>
					<h2>{selectedSection?.label ?? 'Choose a section'}</h2>
					<span class="official">Official</span>
				</div>
				<div class="block-order-actions" aria-label="Block order">
					<button
						class="secondary"
						aria-label="Move selected block up"
						onclick={() => moveSelectedBlock('up')}><ArrowUp size={16} /> Up</button
					>
					<button
						class="secondary"
						aria-label="Move selected block down"
						onclick={() => moveSelectedBlock('down')}><ArrowDown size={16} /> Down</button
					>
				</div>
				{#if selectedSection?.kind === 'embed' && selectedSection.embed}
					<label
						><span>Video or post link</span><input
							value={selectedSection.embed.sourceUrl}
							onchange={(event) => updateSelectedEmbed(event.currentTarget.value)}
						/></label
					>
					<small class="inspector-help"
						>{embedProviderLabel(selectedSection.embed.provider)} detected. Sizing stays responsive automatically.</small
					>
					{#if embedError}<small class="inspector-error" role="alert">{embedError}</small>{/if}
				{/if}
				<label
					><span>Eyebrow</span><input
						value={selectedSection?.eyebrow ?? ''}
						oninput={(event) => updateSection('eyebrow', event.currentTarget.value)}
					/></label
				>
				<label
					><span>Title</span><textarea
						rows="3"
						value={selectedSection?.title ?? ''}
						oninput={(event) => updateSection('title', event.currentTarget.value)}
					></textarea></label
				>
				<label
					><span>Body</span><textarea
						rows="5"
						value={selectedSection?.body ?? ''}
						oninput={(event: Event & { currentTarget: HTMLTextAreaElement }) =>
							updateSection('body', event.currentTarget.value)}></textarea></label
				>
				<label
					><span>Layout</span><select disabled
						><option>{selectedSection ? sectionLabels[selectedSection.kind] : 'Section'}</option
						></select
					></label
				>
				<label
					><span>Theme</span><select
						value={activeTheme.id}
						onchange={(event) => {
							const theme = demoThemes.find((item) => item.id === event.currentTarget.value);
							if (theme) applyReviewedTheme(theme);
						}}
						>{#each demoThemes as theme (theme.id)}<option value={theme.id}>{theme.name}</option
							>{/each}</select
					></label
				>
				<div class="media-drop" class:has-image={Boolean(selectedSection?.image)}>
					{#if selectedSection?.image}<img
							src={selectedSection.image}
							alt={selectedSection.imageAlt ?? ''}
						/>{:else}<Image size={24} /><span>No image needed for this section</span>{/if}
				</div>
				{#if selectedSection?.image}
					<label
						><span>Image description</span><textarea
							rows="3"
							value={selectedSection.imageAlt ?? ''}
							oninput={(event) => updateSection('imageAlt', event.currentTarget.value)}
						></textarea></label
					>
				{/if}
				<button class="secondary" onclick={() => (showAddSection = true)}
					>Add another section</button
				>
				<button
					class="danger-button"
					disabled={(selectedPage?.sections.length ?? 0) <= 1}
					title={(selectedPage?.sections.length ?? 0) <= 1
						? 'Every page needs at least one section.'
						: undefined}
					onclick={requestDeleteSection}><Trash2 size={15} /> Remove selected section</button
				>
			</aside>
		</main>
		{#if showAddPage}
			<div class="modal-backdrop" role="presentation">
				<div class="studio-modal" role="dialog" aria-modal="true" aria-labelledby="add-page-title">
					<button class="modal-close" aria-label="Close" onclick={() => (showAddPage = false)}
						><X size={18} /></button
					>
					<span class="eyebrow">Site structure</span>
					<h2 id="add-page-title">Add a page</h2>
					<p>Give the page a clear name. TEND Sites will create a starter hero you can edit.</p>
					<label
						><span>Page name</span><input
							maxlength="50"
							bind:value={newPageName}
							onkeydown={(event) => {
								if (event.key === 'Enter') addPage();
								if (event.key === 'Escape') showAddPage = false;
							}}
						/></label
					>
					<div class="modal-actions">
						<button class="secondary" onclick={() => (showAddPage = false)}>Cancel</button><button
							class="primary"
							disabled={!newPageName.trim()}
							onclick={addPage}>Add page</button
						>
					</div>
				</div>
			</div>
		{/if}
		{#if showAddSection}
			<div class="modal-backdrop" role="presentation">
				<div
					class="studio-modal wide"
					role="dialog"
					aria-modal="true"
					aria-labelledby="add-section-title"
				>
					<button class="modal-close" aria-label="Close" onclick={() => (showAddSection = false)}
						><X size={18} /></button
					>
					<span class="eyebrow">Page sections</span>
					<h2 id="add-section-title">What should come next?</h2>
					<p>Choose a polished starting point, then make the words yours.</p>
					<div class="section-picker">
						{#each Object.entries(sectionLabels) as [kind, label] (kind)}<button
								onclick={() => {
									if (kind === 'embed') {
										showAddSection = false;
										openEmbedEditor();
									} else addSection(kind as DemoSectionKind);
								}}
								><span class="choice-icon"><LayoutGrid size={18} /></span><strong>{label}</strong
								><small
									>{kind === 'hero'
										? 'A strong opening statement with an image.'
										: kind === 'gallery'
											? 'A visual collection for places and work.'
											: kind === 'newsletter'
												? 'A calm invitation to stay in touch.'
												: kind === 'quote'
													? 'A memorable thought with room to breathe.'
													: kind === 'embed'
														? 'Paste a video or social link. No embed code needed.'
														: 'A focused feature with supporting imagery.'}</small
								></button
							>{/each}
					</div>
				</div>
			</div>
		{/if}
		{#if showEmbedDialog}
			<div class="modal-backdrop" role="presentation">
				<div
					class="studio-modal embed-modal"
					role="dialog"
					aria-modal="true"
					aria-labelledby="embed-dialog-title"
				>
					<button class="modal-close" aria-label="Close" onclick={() => (showEmbedDialog = false)}
						><X size={18} /></button
					>
					<span class="eyebrow">Insert content</span>
					<h2 id="embed-dialog-title">Add a video or social post</h2>
					<p>Paste the normal link. TEND Sites handles the safe, responsive layout for you.</p>
					<label>
						<span>Content link</span>
						<input
							placeholder="https://youtube.com/watch?v=…"
							bind:value={embedSource}
							oninput={() => (embedError = '')}
							onkeydown={(event) => {
								if (event.key === 'Enter') addEmbedSection();
								if (event.key === 'Escape') showEmbedDialog = false;
							}}
						/>
					</label>
					<div class="provider-row" aria-label="Supported services">
						<span>YouTube</span><span>Vimeo</span><span>X</span><span>Twitch</span>
					</div>
					{#if detectedEmbed}
						<div class="embed-detected" role="status">
							<Check size={17} />
							<span
								><strong>{embedProviderLabel(detectedEmbed.provider)} detected</strong><small
									>Visitors choose when external content loads.</small
								></span
							>
						</div>
					{/if}
					{#if embedError}<small class="embed-error" role="alert">{embedError}</small>{/if}
					<div class="modal-actions">
						<button class="secondary" onclick={() => (showEmbedDialog = false)}>Cancel</button>
						<button class="primary" disabled={!detectedEmbed} onclick={addEmbedSection}
							>Add content</button
						>
					</div>
				</div>
			</div>
		{/if}
		{#if showDraftRecovery}
			<div class="modal-backdrop" role="presentation">
				<div
					class="studio-modal"
					role="dialog"
					aria-modal="true"
					aria-labelledby="draft-recovery-title"
				>
					<button
						class="modal-close"
						aria-label="Close"
						disabled={recoveryBusy}
						onclick={() => (showDraftRecovery = false)}><X size={18} /></button
					>
					<span class="eyebrow">Draft recovery</span>
					<h2 id="draft-recovery-title">Your visible work is still here.</h2>
					<p>
						TEND Sites could not read or update its saved copy. Try the storage connection again, or
						replace only that saved copy with the draft currently visible in Studio.
					</p>
					<div class="recovery-note">
						<ShieldCheck size={18} /><span
							><strong>No repository or published site will change.</strong><small
								>Recovery is limited to this extension's private local storage.</small
							></span
						>
					</div>
					<div class="modal-actions">
						<button class="secondary" disabled={recoveryBusy} onclick={retryDraftSave}
							>{recoveryBusy ? 'Working…' : 'Try again'}</button
						><button class="primary" disabled={recoveryBusy} onclick={replaceSavedDraft}
							>Replace saved copy</button
						>
					</div>
				</div>
			</div>
		{/if}
		{#if deleteTarget}
			<div class="modal-backdrop" role="presentation">
				<div
					class="studio-modal"
					role="dialog"
					aria-modal="true"
					aria-labelledby="delete-item-title"
				>
					<button class="modal-close" aria-label="Close" onclick={() => (deleteTarget = null)}
						><X size={18} /></button
					>
					<span class="eyebrow">Protected action</span>
					<h2 id="delete-item-title">Remove {deleteTarget.name}?</h2>
					<p>
						This removes the {deleteTarget.kind} from the local draft. You can still use Undo until this
						Studio session closes.
					</p>
					<label
						><span>Type <strong>{deleteTarget.name}</strong> to confirm</span><input
							aria-label="Confirmation name"
							bind:value={deleteConfirmation}
							onkeydown={(event) => {
								if (event.key === 'Enter') confirmDelete();
								if (event.key === 'Escape') deleteTarget = null;
							}}
						/></label
					>
					<div class="modal-actions">
						<button class="secondary" onclick={() => (deleteTarget = null)}>Cancel</button><button
							class="danger-button"
							disabled={deleteConfirmation.trim() !== deleteTarget.name}
							onclick={confirmDelete}>Remove {deleteTarget.kind}</button
						>
					</div>
				</div>
			</div>
		{/if}
		{#if showPreview}
			<div class="modal-backdrop preview-backdrop" role="presentation">
				<div
					class="site-preview-modal"
					role="dialog"
					aria-modal="true"
					aria-label="Full example website preview"
				>
					<header>
						<div>
							<strong>Interactive preview</strong><span>Panel-local draft · not published</span>
						</div>
						<button
							class="modal-close"
							aria-label="Close preview"
							onclick={() => (showPreview = false)}><X size={20} /></button
						>
					</header>
					<div
						class="full-demo-site"
						style:--accent={siteDraft.accent}
						style:--site-paper={activeTheme.paper}
						style:--site-ink={activeTheme.ink}
					>
						<nav>
							<strong>{siteDraft.name}</strong>
							<div>
								{#each siteDraft.pages as page (page.id)}<button
										class:active={selectedPageId === page.id}
										onclick={() => selectPage(page.id)}>{page.name}</button
									>{/each}
							</div>
						</nav>
						{#each selectedPage?.sections ?? [] as section (section.id)}
							<section class="preview-section {section.kind}">
								{#if section.kind === 'embed' && section.embed}
									<div class="embed-block preview-embed">
										<span>{embedProviderLabel(section.embed.provider)}</span>
										<strong>{section.title}</strong>
										<small>{section.body}</small>
										{#if getEmbedPreviewUrl(section.embed) && loadedEmbeds.includes(section.id)}
											<iframe
												src={getEmbedPreviewUrl(section.embed) ?? ''}
												title="{embedProviderLabel(section.embed.provider)} preview"
												loading="lazy"
												allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
												referrerpolicy="strict-origin-when-cross-origin"
												sandbox="allow-scripts allow-same-origin allow-presentation"
											></iframe>
										{:else if getEmbedPreviewUrl(section.embed)}
											<button class="load-embed" onclick={() => loadEmbed(section.id)}
												><Video size={18} /> Load preview</button
											>
										{:else}
											<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- sourceUrl is a validated canonical external URL. -->
											<a href={section.embed.sourceUrl} target="_blank" rel="noopener noreferrer"
												>Open on {embedProviderLabel(section.embed.provider)}</a
											>
										{/if}
									</div>
								{:else}
									{#if section.image}<img src={section.image} alt={section.imageAlt ?? ''} />{/if}
									<div>
										<small>{section.eyebrow}</small>
										<div
											class="preview-title"
											role="heading"
											aria-level="1"
											use:richContent={section.title}
										></div>
										<div class="preview-body" use:richContent={section.body}></div>
									</div>
								{/if}
							</section>
						{/each}
						<footer>
							<strong>{siteDraft.name}</strong><span>Example site created in TEND Sites</span>
						</footer>
					</div>
				</div>
			</div>
		{/if}
	{:else if view === 'readiness'}
		<main class="page readiness-page">
			<section class="hero-row">
				<div>
					<span class="eyebrow">Evidence center</span>
					<h1>Ready for the host, without pretending.</h1>
					<p>
						Inspect each portable foundation separately. Host-side persistence and execution remain
						unavailable.
					</p>
				</div>
				<span class="status live">5 contracts verified</span>
			</section>
			<nav class="readiness-tabs" aria-label="Readiness sections">
				{#each [['overview', 'Overview'], ['health', 'Site health'], ['drafts', 'Draft safety'], ['media', 'Media'], ['languages', 'Languages'], ['library', 'Library'], ['preview', 'Preview'], ['guidance', 'Guidance']] as tab (tab[0])}
					<button
						class:active={readinessArea === tab[0]}
						onclick={() => (readinessArea = tab[0] as ReadinessArea)}>{tab[1]}</button
					>
				{/each}
			</nav>

			{#if readinessArea === 'overview'}
				<section class="readiness-grid" aria-label="Foundation readiness overview">
					<button onclick={() => (readinessArea = 'health')}
						>{#if siteHealth.status === 'ready'}<ShieldCheck size={21} />{:else}<TriangleAlert
								size={21}
							/>{/if}<span
							><strong>Site health</strong><small
								>{siteHealth.status === 'ready'
									? 'Copy, structure and accessibility look complete'
									: `${siteHealth.issues.length} items need review`}</small
							></span
						><em>{siteHealth.status === 'ready' ? 'Ready' : 'Review'}</em></button
					>
					<button onclick={() => (readinessArea = 'drafts')}
						><DatabaseZap size={21} /><span
							><strong>Draft safety</strong><small>Sequence and conflict evidence</small></span
						><em>Verified</em></button
					>
					<button onclick={() => (readinessArea = 'media')}
						><Image size={21} /><span
							><strong>Media</strong><small
								>{mediaEvidence.variants.length} deterministic variants</small
							></span
						><em>Planned</em></button
					>
					<button onclick={() => (readinessArea = 'languages')}
						><Languages size={21} /><span
							><strong>Languages</strong><small
								>{localizationEvidence.coveragePercent}% content coverage</small
							></span
						><em>Measured</em></button
					>
					<button onclick={() => (readinessArea = 'library')}
						><Library size={21} /><span
							><strong>Library</strong><small>Five certification checks</small></span
						><em>Certified</em></button
					>
					<button onclick={() => (readinessArea = 'preview')}
						><TestTube2 size={21} /><span
							><strong>Preview</strong><small>Separate-origin policy evidence</small></span
						><em>Ready</em></button
					>
					<button onclick={() => (readinessArea = 'guidance')}
						><Sparkles size={21} /><span
							><strong>Guidance</strong><small
								>{assistanceEvidence.suggestions.length} helpful suggestions</small
							></span
						><em>Local</em></button
					>
				</section>
			{:else}
				<section class="readiness-detail">
					{#if readinessArea === 'health'}
						<div class="readiness-icon">
							{#if siteHealth.status === 'ready'}<ShieldCheck size={24} />{:else}<TriangleAlert
									size={24}
								/>{/if}
						</div>
						<div>
							<span class="eyebrow">Local quality check</span>
							<h2>
								{siteHealth.status === 'ready'
									? 'This draft is ready to review.'
									: 'A few details need attention.'}
							</h2>
							<p>
								These checks run locally against the example draft. Passing them improves quality
								but does not authorize a preview or deployment.
							</p>
						</div>
						<dl>
							<div>
								<dt>Blocking</dt>
								<dd>{siteHealth.blockers}</dd>
							</div>
							<div>
								<dt>Needs attention</dt>
								<dd>{siteHealth.attention}</dd>
							</div>
						</dl>
						<div class="health-issues" aria-live="polite">
							{#if siteHealth.issues.length === 0}
								<div class="health-ready">
									<Check size={18} /><span
										><strong>No local issues found</strong><small
											>Keep reviewing the real preview before publishing.</small
										></span
									>
								</div>
							{:else}
								{#each siteHealth.issues as issue (`${issue.code}-${issue.pageId}-${issue.sectionId ?? ''}`)}
									<button onclick={() => openHealthIssue(issue)}>
										<TriangleAlert size={17} />
										<span><strong>{issue.title}</strong><small>{issue.guidance}</small></span>
										<ArrowRight size={16} />
									</button>
								{/each}
							{/if}
						</div>
					{:else if readinessArea === 'drafts'}
						<div class="readiness-icon"><DatabaseZap size={24} /></div>
						<div>
							<span class="eyebrow">Draft safety</span>
							<h2>Autosave can detect conflicts before source changes.</h2>
							<p>
								Sequence {draftEvidence.revision?.sequence} is represented as durable evidence. Undo cannot
								cross a committed source revision.
							</p>
						</div>
						<dl>
							<div>
								<dt>Status</dt>
								<dd>{draftEvidence.status}</dd>
							</div>
							<div>
								<dt>Host persistence</dt>
								<dd>Not connected</dd>
							</div>
						</dl>
						<div class="conflict-actions" aria-label="Conflict resolution preview">
							<button
								class="secondary"
								aria-pressed={conflictChoice === 'keep_draft'}
								onclick={() => (conflictChoice = 'keep_draft')}>Keep my draft</button
							>
							<button
								class="secondary"
								aria-pressed={conflictChoice === 'use_repository'}
								onclick={() => (conflictChoice = 'use_repository')}>Use repository version</button
							>
							{#if conflictChoice}<small
									>Resolution selected for review. No source was changed.</small
								>{/if}
						</div>
					{:else if readinessArea === 'media'}
						<div class="readiness-icon"><Image size={24} /></div>
						<div>
							<span class="eyebrow">Repository media</span>
							<h2>Variants are deterministic and accessibility-aware.</h2>
							<p>
								{mediaEvidence.variants.length} bounded variants are planned from one digest-bound source
								asset.
							</p>
						</div>
						<dl>
							<div>
								<dt>Transform</dt>
								<dd>Host capability required</dd>
							</div>
							<div>
								<dt>Upscaling</dt>
								<dd>Rejected</dd>
							</div>
						</dl>
					{:else if readinessArea === 'languages'}
						<div class="readiness-icon"><Languages size={24} /></div>
						<div>
							<span class="eyebrow">Localization</span>
							<h2>Missing translations are explicit.</h2>
							<p>
								{localizationEvidence.completeEntries} of {localizationEvidence.logicalEntries} entries
								are complete across {localizationEvidence.locales.length} languages.
							</p>
						</div>
						<dl>
							<div>
								<dt>Coverage</dt>
								<dd>{localizationEvidence.coveragePercent}%</dd>
							</div>
							<div>
								<dt>AI authority</dt>
								<dd>Proposal only</dd>
							</div>
						</dl>
					{:else if readinessArea === 'library'}
						<div class="readiness-icon"><Library size={24} /></div>
						<div>
							<span class="eyebrow">Theme and component trust</span>
							<h2>Compatibility and certification are evaluated together.</h2>
							<p>
								The sample component is {libraryEvidence.status}, with provenance and five required
								checks.
							</p>
						</div>
						<dl>
							<div>
								<dt>Install</dt>
								<dd>Host capability required</dd>
							</div>
							<div>
								<dt>Panel scripts</dt>
								<dd>Forbidden</dd>
							</div>
						</dl>
					{:else if readinessArea === 'preview'}
						<div class="readiness-icon"><TestTube2 size={24} /></div>
						<div>
							<span class="eyebrow">Isolated preview</span>
							<h2>Checks can pass without authorizing deployment.</h2>
							<p>
								The evidence is {previewEvidence.status}; it remains structurally unable to deploy.
							</p>
						</div>
						<dl>
							<div>
								<dt>Panel credentials</dt>
								<dd>Never available</dd>
							</div>
							<div>
								<dt>Deploy</dt>
								<dd>Separate authority required</dd>
							</div>
						</dl>
					{:else}
						<div class="readiness-icon"><Sparkles size={24} /></div>
						<div>
							<span class="eyebrow">Private local guidance</span>
							<h2>Useful checks before involving an AI provider.</h2>
							<p>
								{assistanceEvidence.suggestions.length} SEO or accessibility suggestions were found locally.
								Nothing was sent or changed.
							</p>
						</div>
						<dl>
							<div>
								<dt>Network</dt>
								<dd>Not used</dd>
							</div>
							<div>
								<dt>Apply</dt>
								<dd>Review required</dd>
							</div>
						</dl>
					{/if}
				</section>
			{/if}
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
				<span class="library-trust"><ShieldCheck size={16} /> Reviewed by TEND Stack</span>
				<span></span><button
					class:active={libraryView === 'components'}
					onclick={() => (libraryView = 'components')}>Components</button
				><button class:active={libraryView === 'themes'} onclick={() => (libraryView = 'themes')}
					>Themes</button
				>
			</div>
			{#if libraryNotice}<div class="library-notice" role="status">
					<Check size={17} />{libraryNotice}
				</div>{/if}
			{#if libraryView === 'components'}
				<section class="component-grid" aria-label="Reviewed components">
					{#each demoLibraryComponents as component, index (component.id)}
						<article>
							<div class="component-preview preview-{component.kind}">
								<span></span><span></span><i class:round={index === 2}></i>
							</div>
							<div>
								<span class="status live">Official</span><small>{component.category}</small>
							</div>
							<h2>{component.name}</h2>
							<p>{component.description}</p>
							<div class="library-card-actions">
								<button class="secondary" onclick={() => (libraryPreview = component)}
									>Preview</button
								><button class="card-action" onclick={() => addReviewedComponent(component)}
									>Add to {selectedPage?.name ?? 'page'} <ArrowRight size={15} /></button
								>
							</div>
						</article>
					{/each}
				</section>
			{:else}
				<section class="theme-library-grid" aria-label="Reviewed themes">
					{#each demoThemes as theme (theme.id)}
						<article class:active-theme={activeTheme.id === theme.id}>
							<div
								class="theme-library-preview"
								style:--theme-accent={theme.accent}
								style:--theme-paper={theme.paper}
								style:--theme-ink={theme.ink}
							>
								<small>{theme.label}</small><strong>Stories worth sharing.</strong><span></span>
							</div>
							<div class="theme-card-heading">
								<div>
									<span class="status live">Official</span>
									<h2>{theme.name}</h2>
								</div>
								{#if activeTheme.id === theme.id}<span class="theme-applied"
										><Check size={15} /> Applied</span
									>{/if}
							</div>
							<p>{theme.description}</p>
							<button
								class="card-action"
								disabled={activeTheme.id === theme.id}
								onclick={() => applyReviewedTheme(theme)}
								><Paintbrush size={15} />
								{activeTheme.id === theme.id ? 'Applied to this draft' : 'Apply theme'}</button
							>
						</article>
					{/each}
				</section>
			{/if}

			{#if libraryPreview}
				<div class="modal-backdrop" role="presentation">
					<div
						class="studio-modal library-preview-modal"
						role="dialog"
						aria-modal="true"
						aria-labelledby="library-preview-title"
					>
						<button class="modal-close" aria-label="Close" onclick={() => (libraryPreview = null)}
							><X size={18} /></button
						>
						<span class="eyebrow">Reviewed component preview</span>
						<h2 id="library-preview-title">{libraryPreview.name}</h2>
						<p>{libraryPreview.description}</p>
						<div
							class="library-section-sample"
							style:--accent={siteDraft.accent}
							style:--site-paper={activeTheme.paper}
							style:--site-ink={activeTheme.ink}
						>
							<small>{libraryPreview.eyebrow}</small>
							<h3>{libraryPreview.title}</h3>
							<p>{libraryPreview.body}</p>
						</div>
						<div class="modal-actions">
							<button class="secondary" onclick={() => (libraryPreview = null)}
								>Keep browsing</button
							><button class="primary" onclick={() => addReviewedComponent(libraryPreview!)}
								>Add to {selectedPage?.name ?? 'this page'}</button
							>
						</div>
					</div>
				</div>
			{/if}
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
						><span>Rollback</span><strong>Previous revision retained</strong><span>Artifact</span
						><strong>Not built</strong><span>Traffic</span><strong>Current site stays online</strong
						><span>Domain</span><strong>Unchanged</strong><span>Outage policy</span><strong
							>Reconcile before retry</strong
						>
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
		container-type: inline-size;
		background: radial-gradient(circle at 50% -20%, #12322a 0, transparent 34%), #070b0d;
	}
	.sites-shell.embedded {
		min-height: 100%;
	}
	.sites-shell.embedded .topbar {
		padding-inline: clamp(16px, 2vw, 32px);
	}
	.sites-shell.embedded .page {
		width: min(1680px, calc(100% - 28px));
		padding-block: 36px 56px;
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
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
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
	.readiness-tabs {
		display: flex;
		gap: 8px;
		margin: 22px 0 26px;
		overflow-x: auto;
		padding-bottom: 4px;
	}
	.readiness-tabs button {
		border: 1px solid var(--border);
		border-radius: 999px;
		background: transparent;
		color: var(--muted);
		cursor: pointer;
		padding: 10px 16px;
		white-space: nowrap;
	}
	.readiness-tabs button.active {
		border-color: color-mix(in srgb, var(--green) 50%, var(--border));
		background: color-mix(in srgb, var(--green) 10%, transparent);
		color: var(--green);
	}
	.readiness-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 14px;
	}
	.readiness-grid button {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 14px;
		min-height: 112px;
		padding: 20px;
		border: 1px solid var(--border);
		border-radius: 18px;
		background: var(--surface);
		color: #edf5f1;
		cursor: pointer;
		text-align: left;
	}
	.readiness-grid button:first-child {
		grid-column: 1 / -1;
	}
	.readiness-grid button :global(svg),
	.readiness-icon {
		color: var(--green);
	}
	.readiness-grid span {
		display: grid;
		gap: 5px;
	}
	.readiness-grid small {
		color: var(--muted);
	}
	.readiness-grid em {
		font-style: normal;
		font-size: 12px;
		font-weight: 750;
		color: var(--green);
	}
	.health-button.attention {
		color: #f6c35c;
		border-color: #755b24;
		background: #241f12;
	}
	.readiness-detail {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) minmax(260px, 0.55fr);
		gap: 20px;
		align-items: start;
		padding: 26px;
		border: 1px solid var(--border);
		border-radius: 20px;
		background: var(--surface);
	}
	.readiness-icon {
		display: grid;
		place-items: center;
		width: 48px;
		height: 48px;
		border-radius: 14px;
		background: color-mix(in srgb, var(--green) 12%, transparent);
	}
	.readiness-detail h2 {
		margin: 6px 0 8px;
		font-size: 24px;
	}
	.readiness-detail p {
		margin: 0;
		color: var(--muted);
		line-height: 1.65;
	}
	.readiness-detail dl {
		display: grid;
		gap: 10px;
		margin: 0;
	}
	.readiness-detail dl div {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding-bottom: 10px;
		border-bottom: 1px solid var(--border);
	}
	.readiness-detail dt {
		color: var(--muted);
	}
	.readiness-detail dd {
		margin: 0;
		font-weight: 700;
		text-align: right;
	}
	.conflict-actions {
		display: flex;
		align-items: center;
		gap: 8px;
		grid-column: 2 / -1;
		flex-wrap: wrap;
	}
	.conflict-actions button[aria-pressed='true'] {
		border-color: var(--green);
		color: var(--green);
	}
	.conflict-actions small {
		width: 100%;
		color: var(--muted);
	}
	.health-issues {
		display: grid;
		gap: 9px;
		grid-column: 2 / -1;
	}
	.health-issues button,
	.health-ready {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 14px;
		color: #edf5f1;
		text-align: left;
		background: #0b1214;
		border: 1px solid var(--border);
		border-radius: 13px;
	}
	.health-issues button {
		cursor: pointer;
	}
	.health-issues button:hover {
		border-color: #755b24;
		background: #19170f;
	}
	.health-issues button > :global(svg:first-child) {
		color: #f6c35c;
	}
	.health-issues span {
		display: grid;
		gap: 4px;
	}
	.health-issues small {
		color: var(--muted);
	}
	.health-ready {
		grid-template-columns: auto minmax(0, 1fr);
		color: var(--green);
		background: #0b1813;
		border-color: #234d3d;
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
	.danger-button,
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
	.danger-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: 42px;
		padding: 0 17px;
		color: #fecaca;
		font-weight: 750;
		background: #2a1114;
		border: 1px solid #7f3038;
		border-radius: 11px;
		cursor: pointer;
	}
	.danger-button:hover:not(:disabled) {
		color: #fff1f2;
		border-color: #dc5b67;
		background: #3a171c;
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
	.rich-preview {
		position: relative;
		align-items: end;
		height: 170px;
		padding: 0;
		background: #0c1715;
	}
	.rich-preview img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.rich-preview::after {
		content: '';
		position: absolute;
		inset: 35% 0 0;
		background: linear-gradient(transparent, #07100ee8);
	}
	.rich-preview > div {
		position: relative;
		z-index: 1;
		display: grid;
		gap: 3px;
		padding: 16px;
		text-shadow: 0 2px 16px #000;
	}
	.rich-preview small {
		color: var(--green);
		font-size: 8px;
		font-weight: 800;
		letter-spacing: 0.14em;
	}
	.project-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		margin: 17px 4px 10px;
	}
	.project-heading > div {
		min-width: 0;
		flex: 1 1 auto;
	}
	.project-heading h2,
	.project-heading p {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.project-heading p {
		margin: 0;
		color: var(--green);
		font-size: 12px;
	}
	.status {
		flex: 0 0 auto;
		height: fit-content;
		color: #f2c664;
		background: #342b12;
		border-radius: 20px;
		padding: 4px 8px;
		font-size: 10px;
		line-height: 1.2;
		white-space: nowrap;
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
		grid-template-columns:
			var(--outline-width) 8px minmax(0, 1fr) 8px
			var(--inspector-width);
		min-height: calc(100dvh - 64px);
	}
	.studio-page.resizing,
	.studio-page.resizing * {
		cursor: col-resize !important;
		user-select: none !important;
	}
	.panel-resizer {
		position: relative;
		z-index: 6;
		background: #090f11;
		cursor: col-resize;
		touch-action: none;
	}
	.panel-resizer::after {
		content: '';
		position: absolute;
		inset: 0 3px;
		background: var(--border);
		transition: background 0.16s ease;
	}
	.panel-resizer:hover::after,
	.panel-resizer:focus-visible::after {
		background: var(--green);
	}
	.studio-mobile-tabs {
		display: none;
	}
	.block-outline {
		display: grid;
		gap: 6px;
		margin-top: 18px;
		padding-top: 16px;
		border-top: 1px solid var(--border);
	}
	.block-outline > span {
		padding: 0 10px 4px;
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.block-outline button {
		border: 0;
		border-radius: 9px;
		padding: 10px 11px;
		background: transparent;
		color: var(--muted);
		text-align: left;
	}
	.block-outline button.active {
		background: #103226;
		color: var(--green);
	}
	.block-order-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}
	.block-order-actions button {
		justify-content: center;
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
		container: studio-canvas / inline-size;
	}
	.studio-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		margin-bottom: 15px;
		min-width: 0;
	}
	.studio-toolbar > div {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}
	.studio-toolbar .toolbar-meta,
	.studio-toolbar .save-state {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		color: #81938c;
		background: #131d20;
		border-radius: 20px;
		padding: 5px 8px;
		font-size: 10px;
		white-space: nowrap;
	}
	.studio-toolbar .toolbar-meta span,
	.studio-toolbar .save-state span,
	.studio-toolbar button span {
		display: inline;
	}
	.studio-actions {
		flex: 0 1 auto;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.studio-actions::-webkit-scrollbar {
		display: none;
	}
	.studio-actions button {
		flex: 0 0 auto;
		white-space: nowrap;
	}
	.studio-toolbar .saved {
		color: var(--green);
	}
	.save-state:not(.saved) {
		color: #ffb77c;
	}
	.save-recovery {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 5px 9px;
		color: #ffd4b2;
		font-size: 10px;
		background: #3a2116;
		border: 1px solid #754026;
		border-radius: 999px;
		cursor: pointer;
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
		color: var(--site-ink);
		background: var(--site-paper);
	}
	.site-canvas nav {
		display: flex;
		justify-content: space-between;
		font-size: 11px;
	}
	.canvas-section {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(130px, 0.7fr);
		gap: 24px;
		width: 100%;
		margin-top: 20px;
		padding: 22px;
		color: var(--site-ink);
		text-align: left;
		border: 2px solid transparent;
		border-radius: 12px;
		background: color-mix(in srgb, var(--site-paper) 88%, white);
		cursor: pointer;
	}
	.section-select-overlay {
		position: absolute;
		z-index: 0;
		inset: 0;
		width: 100%;
		border: 0;
		border-radius: inherit;
		background: transparent;
		cursor: pointer;
	}
	.canvas-section > img,
	.canvas-section > div,
	.canvas-section .block-label {
		position: relative;
		z-index: 1;
	}
	.canvas-section:first-of-type {
		margin-top: 48px;
	}
	.canvas-section.selected-section {
		border-color: var(--accent);
		box-shadow: 0 8px 30px #173d2b20;
	}
	.canvas-section img {
		width: 100%;
		height: 180px;
		object-fit: cover;
		border-radius: 10px;
		grid-column: 2;
		grid-row: 1;
	}
	.canvas-section > div {
		grid-column: 1;
		grid-row: 1;
		align-self: center;
	}
	.canvas-section.story,
	.canvas-section.gallery {
		grid-template-columns: minmax(150px, 0.8fr) minmax(0, 1.2fr);
	}
	.canvas-section.story img,
	.canvas-section.gallery img {
		grid-column: 1;
	}
	.canvas-section.story > div,
	.canvas-section.gallery > div {
		grid-column: 2;
	}
	.canvas-section.quote,
	.canvas-section.newsletter {
		display: block;
		text-align: center;
		padding: 38px;
		background: color-mix(in srgb, var(--accent) 16%, var(--site-paper));
	}
	.canvas-section.embed {
		display: block;
		padding: 18px;
		background: color-mix(in srgb, var(--accent) 7%, var(--site-paper));
	}
	.embed-block {
		display: grid;
		gap: 12px;
		width: 100%;
	}
	.embed-heading {
		display: grid;
		gap: 5px;
	}
	.embed-heading > span,
	.embed-block > span {
		color: color-mix(in srgb, var(--accent) 78%, #0d4733);
		font-size: 10px;
		font-weight: 850;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.embed-heading small,
	.embed-block > small {
		color: color-mix(in srgb, var(--site-ink) 68%, transparent);
	}
	.embed-block iframe {
		display: block;
		width: 100%;
		border: 0;
		border-radius: 10px;
		aspect-ratio: 16 / 9;
		background: #050807;
	}
	.load-embed,
	.open-embed {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		min-height: 82px;
		color: var(--site-ink);
		font-weight: 800;
		text-decoration: none;
		border: 1px dashed color-mix(in srgb, var(--accent) 66%, transparent);
		border-radius: 10px;
		background: color-mix(in srgb, var(--accent) 12%, var(--site-paper));
		cursor: pointer;
	}
	.embed-privacy {
		color: color-mix(in srgb, var(--site-ink) 58%, transparent) !important;
		font-size: 10px;
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
	.canvas-section .inline-eyebrow {
		display: block;
		font-size: 9px;
		letter-spacing: 0.12em;
	}
	.canvas-section .inline-title {
		display: block;
		max-width: 600px;
		margin: 10px 0;
		font-weight: 700;
		font-size: clamp(24px, 3.2vw, 46px);
		line-height: 1.08;
	}
	.canvas-section .inline-body {
		display: block;
		max-width: 570px;
		color: #51605a;
		line-height: 1.6;
	}
	.canvas-section [contenteditable] {
		border-radius: 5px;
		outline: none;
		cursor: text;
	}
	.canvas-section [contenteditable]:hover {
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 12%, transparent);
	}
	.canvas-section [contenteditable]:focus {
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 36%, transparent);
	}
	.canvas-section .inline-body :global(h1),
	.canvas-section .inline-body :global(h2),
	.canvas-section .inline-body :global(h3),
	.canvas-section .inline-body :global(div),
	.canvas-section .inline-body :global(ul) {
		margin: 0;
	}
	.canvas-section .inline-body :global(h2) {
		color: var(--site-ink);
		font-size: 1.35em;
		line-height: 1.25;
	}
	.canvas-section .inline-body :global(h3) {
		color: var(--site-ink);
		font-size: 1.12em;
		line-height: 1.35;
	}
	.canvas-section .inline-body :global(ul) {
		padding-left: 1.25em;
	}
	.canvas-section [contenteditable] :global(a) {
		color: color-mix(in srgb, var(--accent) 72%, #0d4733);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.rich-toolbar {
		position: sticky;
		z-index: 14;
		bottom: 16px;
		display: grid;
		gap: 6px;
		width: fit-content;
		max-width: min(100%, 720px);
		margin: 14px auto 0;
		padding: 6px;
		border: 1px solid #3b6254;
		border-radius: 14px;
		background: #07100def;
		box-shadow: 0 16px 48px #000b;
		backdrop-filter: blur(18px);
	}
	.rich-toolbar-main {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.rich-toolbar-main > strong {
		padding: 0 8px;
		color: var(--green);
		font-size: 10px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.rich-toolbar-main > span {
		width: 1px;
		height: 22px;
		background: #2d423a;
	}
	.rich-toolbar button,
	.rich-toolbar select {
		min-height: 34px;
		color: #c7d7d1;
		border: 0;
		border-radius: 9px;
		background: transparent;
	}
	.rich-toolbar button {
		display: inline-grid;
		place-items: center;
		min-width: 34px;
		padding: 0 9px;
		cursor: pointer;
	}
	.rich-toolbar button:hover,
	.rich-toolbar button:focus-visible,
	.rich-toolbar select:hover,
	.rich-toolbar select:focus-visible {
		color: white;
		background: #17251f;
		outline: none;
	}
	.rich-toolbar select {
		padding: 0 26px 0 9px;
		font: inherit;
		font-size: 11px;
		cursor: pointer;
	}
	.rich-toolbar .close-rich-toolbar {
		margin-left: 2px;
		color: #90a49c;
	}
	.link-editor {
		display: grid;
		grid-template-columns: minmax(220px, 1fr) auto;
		gap: 6px;
		padding: 6px;
		border-top: 1px solid #263b34;
	}
	.link-editor label {
		display: grid;
		gap: 3px;
	}
	.link-editor label > span {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
	}
	.link-editor input {
		width: 100%;
		min-height: 34px;
		padding: 0 10px;
		color: white;
		border: 1px solid #355247;
		border-radius: 9px;
		outline: none;
		background: #0d1915;
	}
	.link-editor input:focus {
		border-color: var(--green);
	}
	.link-editor .apply-link {
		color: #06150f;
		background: var(--green);
		font-size: 11px;
		font-weight: 800;
	}
	.link-editor small {
		grid-column: 1 / -1;
		color: #ffaeae;
		font-size: 10px;
	}
	.insert-menu {
		display: grid;
		gap: 6px;
		padding: 8px;
		border-top: 1px solid #263b34;
	}
	.insert-menu > button {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 10px;
		min-height: 52px;
		padding: 8px 10px;
		text-align: left;
		background: #101d18;
	}
	.insert-menu > button > span:last-child {
		display: grid;
		gap: 2px;
	}
	.insert-menu small,
	.insert-menu p {
		margin: 0;
		color: #83978f;
		font-size: 10px;
	}
	.insert-menu p {
		padding: 2px 7px;
	}
	.insert-icon {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		color: var(--green);
		border-radius: 9px;
		background: #0a3125;
	}
	.writing-tools {
		position: sticky;
		z-index: 12;
		bottom: 16px;
		display: flex;
		align-items: center;
		gap: 5px;
		width: fit-content;
		max-width: 100%;
		margin: 14px auto 0;
		padding: 5px;
		border: 1px solid #315348;
		border-radius: 14px;
		background: #09130fef;
		box-shadow: 0 14px 40px #0009;
		backdrop-filter: blur(16px);
	}
	.writing-tools button {
		min-height: 34px;
		padding: 0 10px;
		color: #b9c9c3;
		font-size: 11px;
		font-weight: 750;
		border: 0;
		border-radius: 9px;
		background: transparent;
		cursor: pointer;
	}
	.writing-tools button:hover {
		color: white;
		background: #17251f;
	}
	.writing-tools .writing-tools-toggle {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		color: #07130f;
		background: var(--green);
	}
	.writing-tools > span {
		width: 1px;
		height: 22px;
		background: #2d423a;
	}
	.demo-cta {
		display: inline-block;
		margin-top: 8px;
		color: #09251c;
		background: var(--accent);
		border: 0;
		border-radius: 8px;
		padding: 10px 13px;
		font-weight: 800;
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
	.inspector-section {
		display: grid;
		gap: 13px;
	}
	.inspector hr {
		width: 100%;
		margin: 2px 0;
		border: 0;
		border-top: 1px solid var(--border);
	}
	.page-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}
	.page-actions button {
		padding-inline: 10px;
		font-size: 11px;
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
	.media-drop.has-image {
		display: block;
		overflow: hidden;
		border-style: solid;
	}
	.media-drop img {
		display: block;
		width: 100%;
		height: 130px;
		object-fit: cover;
	}
	.add-page-button,
	.add-section-outline {
		color: var(--green) !important;
		border: 1px dashed #2e6150 !important;
	}
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 80;
		display: grid;
		place-items: center;
		padding: 20px;
		background: #020504d9;
		backdrop-filter: blur(12px);
	}
	.studio-modal {
		position: relative;
		width: min(480px, 100%);
		padding: 28px;
		border: 1px solid #2b4139;
		border-radius: 20px;
		background: #0d1517;
		box-shadow: 0 35px 100px #000;
	}
	.studio-modal.wide {
		width: min(800px, 100%);
	}
	.studio-modal h2 {
		margin: 4px 0 8px;
		font-size: 28px;
	}
	.studio-modal label {
		display: grid;
		gap: 8px;
		color: var(--muted);
		font-size: 12px;
	}
	.studio-modal input {
		color: #fff;
		background: #080d0f;
		border: 1px solid var(--border);
		border-radius: 11px;
		padding: 13px;
	}
	.embed-modal .provider-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 12px;
	}
	.embed-modal .provider-row span {
		padding: 5px 8px;
		color: #abc0b8;
		font-size: 10px;
		border: 1px solid #2c423a;
		border-radius: 999px;
	}
	.embed-detected {
		display: flex;
		align-items: flex-start;
		gap: 9px;
		margin-top: 12px;
		padding: 12px;
		color: var(--green);
		border: 1px solid #285b48;
		border-radius: 11px;
		background: #0b211a;
	}
	.embed-detected span {
		display: grid;
		gap: 3px;
	}
	.embed-detected small {
		color: #93a79f;
	}
	.embed-error,
	.inspector-error {
		display: block;
		margin-top: 8px;
		color: #ffaeae;
	}
	.inspector-help {
		color: #7f958c;
		line-height: 1.45;
	}
	.recovery-note {
		display: flex;
		align-items: flex-start;
		gap: 11px;
		margin-top: 18px;
		padding: 14px;
		color: var(--green);
		background: #0b211a;
		border: 1px solid #235842;
		border-radius: 12px;
	}
	.recovery-note span {
		display: grid;
		gap: 3px;
	}
	.recovery-note small {
		color: var(--muted);
		font-size: 11px;
	}
	.modal-close {
		position: absolute;
		top: 16px;
		right: 16px;
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		color: #d7e4df;
		background: #111b1d;
		border: 1px solid var(--border);
		border-radius: 10px;
		cursor: pointer;
	}
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 9px;
		margin-top: 22px;
	}
	.section-picker {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
		margin-top: 22px;
	}
	.section-picker button {
		display: grid;
		gap: 8px;
		min-height: 150px;
		padding: 16px;
		color: #edf5f1;
		text-align: left;
		background: #10191b;
		border: 1px solid var(--border);
		border-radius: 14px;
		cursor: pointer;
	}
	.section-picker button:hover {
		border-color: #428268;
		background: #11231d;
	}
	.section-picker small {
		color: var(--muted);
		line-height: 1.45;
	}
	.preview-backdrop {
		align-items: start;
		overflow-y: auto;
	}
	.site-preview-modal {
		width: min(1180px, 100%);
		margin: 20px auto;
		overflow: hidden;
		border: 1px solid #2b4139;
		border-radius: 20px;
		background: #0d1517;
		box-shadow: 0 35px 100px #000;
	}
	.site-preview-modal > header {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 68px;
		padding: 12px 70px 12px 20px;
		border-bottom: 1px solid var(--border);
	}
	.site-preview-modal > header div {
		display: grid;
		gap: 4px;
	}
	.site-preview-modal > header span {
		color: var(--muted);
		font-size: 11px;
	}
	.full-demo-site {
		color: var(--site-ink);
		background: var(--site-paper);
	}
	.full-demo-site > nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		padding: 22px clamp(24px, 6vw, 80px);
		border-bottom: 1px solid #cfd8d1;
	}
	.full-demo-site nav div {
		display: flex;
		gap: 5px;
	}
	.full-demo-site nav button {
		padding: 8px 10px;
		color: #40544c;
		background: transparent;
		border: 0;
		border-radius: 8px;
		cursor: pointer;
	}
	.full-demo-site nav button.active {
		color: #0b3b2a;
		background: color-mix(in srgb, var(--accent) 25%, transparent);
	}
	.preview-section {
		display: grid;
		grid-template-columns: 1fr 1fr;
		align-items: center;
		gap: clamp(26px, 6vw, 80px);
		min-height: 420px;
		padding: clamp(40px, 8vw, 100px);
	}
	.preview-section:nth-child(odd) {
		background: color-mix(in srgb, var(--accent) 9%, var(--site-paper));
	}
	.preview-section img {
		width: 100%;
		max-height: 430px;
		object-fit: cover;
		border-radius: 18px;
		box-shadow: 0 24px 60px #213b2d30;
	}
	.preview-section small {
		color: #12744f;
		font-weight: 800;
		letter-spacing: 0.15em;
	}
	.preview-section .preview-title {
		margin: 12px 0 16px;
		font-family: Georgia, serif;
		font-size: clamp(38px, 6vw, 74px);
		line-height: 1;
	}
	.preview-section .preview-title :global(*) {
		margin: 0;
		font: inherit;
		line-height: inherit;
	}
	.preview-section .preview-body {
		color: #506159;
		font-size: 17px;
	}
	.preview-section .preview-body :global(*) {
		margin: 0 0 8px;
	}
	.preview-section.story img,
	.preview-section.gallery img {
		order: -1;
	}
	.preview-section.quote,
	.preview-section.newsletter {
		display: block;
		min-height: auto;
		text-align: center;
	}
	.preview-section.embed {
		display: block;
		min-height: auto;
	}
	.preview-embed {
		max-width: 900px;
		margin: 0 auto;
	}
	.preview-embed > strong {
		font-family: Georgia, serif;
		font-size: clamp(28px, 5vw, 54px);
	}
	.full-demo-site footer {
		display: flex;
		justify-content: space-between;
		gap: 20px;
		padding: 30px clamp(24px, 6vw, 80px);
		color: #cde0d7;
		background: var(--site-ink);
	}
	.filter-row {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 24px;
	}
	.filter-row > span:not(.library-trust) {
		flex: 1;
	}
	.library-trust {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 8px 11px;
		color: #9fcbb9;
		font-size: 12px;
		border: 1px solid #234438;
		border-radius: 10px;
		background: #0d1b17;
	}
	.library-notice {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 20px;
		padding: 12px 14px;
		color: #baf4d9;
		border: 1px solid #296548;
		border-radius: 12px;
		background: #0e281e;
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
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
		margin: 14px 0 10px;
	}
	.component-grid article > div:nth-child(2) small {
		min-width: 0;
		color: var(--muted);
		line-height: 1.2;
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
	.library-card-actions {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 8px;
		margin-top: 14px;
	}
	.library-card-actions button {
		width: 100%;
	}
	.theme-library-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 16px;
	}
	.theme-library-grid > article {
		padding: 14px;
		border: 1px solid var(--border);
		border-radius: 16px;
		background: var(--surface);
	}
	.theme-library-grid > article.active-theme {
		border-color: #4eaf84;
		box-shadow: 0 0 0 1px #4eaf8430;
	}
	.theme-library-preview {
		display: grid;
		align-content: center;
		gap: 10px;
		min-height: 190px;
		padding: 28px;
		color: var(--theme-ink);
		border-radius: 12px;
		background: var(--theme-paper);
	}
	.theme-library-preview small {
		color: var(--theme-accent);
		font-size: 10px;
		font-weight: 850;
		letter-spacing: 0.13em;
		text-transform: uppercase;
	}
	.theme-library-preview strong {
		max-width: 320px;
		font-family: Georgia, serif;
		font-size: clamp(24px, 3vw, 38px);
		line-height: 1;
	}
	.theme-library-preview span {
		width: 68px;
		height: 8px;
		border-radius: 999px;
		background: var(--theme-accent);
	}
	.theme-card-heading {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 14px;
		margin-top: 14px;
	}
	.theme-card-heading h2 {
		margin: 8px 0 0;
	}
	.theme-applied {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		color: var(--green);
		font-size: 12px;
		font-weight: 800;
	}
	.library-preview-modal {
		width: min(680px, 100%);
	}
	.library-section-sample {
		margin-top: 20px;
		padding: clamp(28px, 6vw, 54px);
		color: var(--site-ink);
		border-radius: 16px;
		background: var(--site-paper);
	}
	.library-section-sample small {
		color: var(--accent);
		font-weight: 850;
		letter-spacing: 0.13em;
	}
	.library-section-sample h3 {
		max-width: 520px;
		margin: 12px 0;
		font-family: Georgia, serif;
		font-size: clamp(28px, 5vw, 48px);
		line-height: 1.02;
	}
	.library-section-sample p {
		margin-bottom: 0;
		color: color-mix(in srgb, var(--site-ink) 72%, transparent);
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
		.section-picker {
			grid-template-columns: repeat(2, 1fr);
		}
		.preview-section {
			grid-template-columns: 1fr;
		}
		.readiness-detail {
			grid-template-columns: auto 1fr;
		}
		.readiness-detail dl {
			grid-column: 1 / -1;
		}
		.conflict-actions {
			grid-column: 1 / -1;
		}
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
			grid-template-columns: 1fr;
			position: relative;
			padding-top: 51px;
		}
		.panel-resizer {
			display: none;
		}
		.studio-mobile-tabs {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			position: absolute;
			inset: 0 0 auto;
			gap: 6px;
			padding: 8px 10px;
			border-bottom: 1px solid var(--border);
			background: #090f12;
		}
		.studio-mobile-tabs button {
			border: 0;
			border-radius: 9px;
			padding: 8px;
			background: transparent;
			color: var(--muted);
		}
		.studio-mobile-tabs button.active {
			background: var(--surface-2);
			color: var(--green);
		}
		.studio-sidebar,
		.inspector,
		.canvas-area {
			display: none;
		}
		.studio-sidebar.mobile-visible,
		.inspector.mobile-visible,
		.canvas-area.mobile-visible {
			display: block;
		}
		.continue-grid,
		.publish-grid,
		.adoption-grid {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 640px) {
		.sites-shell.embedded .page {
			width: min(100% - 20px, 1680px);
			padding-block: 24px 44px;
		}
		.section-picker {
			grid-template-columns: 1fr;
		}
		.full-demo-site > nav {
			align-items: start;
			flex-direction: column;
		}
		.full-demo-site nav div {
			flex-wrap: wrap;
		}
		.preview-section {
			min-height: auto;
			padding: 42px 24px;
		}
		.readiness-grid {
			grid-template-columns: 1fr;
		}
		.readiness-grid button:first-child {
			grid-column: auto;
		}
		.readiness-grid button {
			grid-template-columns: auto 1fr;
		}
		.readiness-grid em {
			grid-column: 2;
		}
		.readiness-detail {
			grid-template-columns: 1fr;
		}
		.readiness-detail dl {
			grid-column: auto;
		}
		.health-issues {
			grid-column: auto;
		}
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
		.theme-library-grid,
		.toggle-grid,
		.identity-grid,
		.review-grid {
			grid-template-columns: 1fr;
		}
		.filter-row {
			align-items: stretch;
			flex-wrap: wrap;
		}
		.filter-row > span:not(.library-trust) {
			display: none;
		}
		.library-trust {
			width: 100%;
		}
		.filter-row button {
			flex: 1;
		}
		.library-card-actions {
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
		.writing-tools.expanded {
			flex-wrap: wrap;
			justify-content: center;
		}
		.rich-toolbar {
			position: sticky;
			bottom: 8px;
			width: 100%;
		}
		.rich-toolbar-main {
			flex-wrap: wrap;
		}
		.rich-toolbar-main > strong {
			flex: 1;
		}
		.link-editor {
			grid-template-columns: 1fr;
		}
		.link-editor .apply-link {
			width: 100%;
		}
		.site-canvas {
			min-height: 520px;
			padding: 25px 18px;
		}
		.site-canvas nav span {
			display: none;
		}
		.canvas-section {
			grid-template-columns: 1fr;
			margin-top: 30px;
			padding: 22px 18px;
		}
		.canvas-section img,
		.canvas-section > div,
		.canvas-section.story img,
		.canvas-section.story > div,
		.canvas-section.gallery img,
		.canvas-section.gallery > div {
			grid-column: 1;
			grid-row: auto;
		}
		.canvas-section .inline-title {
			font-size: 34px;
		}
		.filter-row {
			overflow-x: auto;
		}
		.filter-row span {
			display: none;
		}
	}
	@container (max-width: 1080px) {
		.topbar {
			gap: 14px;
		}
		.topbar nav button {
			width: 40px;
			height: 40px;
			padding: 0;
		}
		.topbar nav button > span {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip: rect(0 0 0 0);
		}
		.connection {
			font-size: 0;
		}
		.connection > span {
			margin: 0;
		}
	}
	@container studio-canvas (max-width: 920px) {
		.studio-toolbar {
			gap: 8px;
		}
		.studio-context > strong {
			max-width: 150px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.studio-toolbar .toolbar-meta > span,
		.studio-toolbar .save-state > span,
		.studio-toolbar button > span {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip: rect(0 0 0 0);
		}
		.studio-toolbar .toolbar-meta,
		.studio-toolbar .save-state,
		.studio-toolbar button {
			flex: 0 0 38px;
			justify-content: center;
			width: 38px;
			height: 38px;
			padding: 0;
			border-radius: 10px;
		}
	}
	@container studio-canvas (max-width: 570px) {
		.studio-toolbar {
			align-items: stretch;
			flex-direction: column;
		}
		.studio-actions {
			width: 100%;
		}
		.studio-context > strong {
			flex: 1;
			max-width: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		button {
			transition: none;
		}
	}
</style>
