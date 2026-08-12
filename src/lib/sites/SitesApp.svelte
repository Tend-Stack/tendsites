<script lang="ts">
	import {
		ArrowLeft,
		ArrowRight,
		ArrowUp,
		ArrowDown,
		Bold,
		Check,
		CircleAlert,
		CirclePlus,
		Cloud,
		CloudOff,
		Code2,
		Copy,
		DatabaseZap,
		Download,
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
		LoaderCircle,
		Menu,
		MonitorPlay,
		Paintbrush,
		PanelLeft,
		Rocket,
		RemoveFormatting,
		Search,
		Settings2,
		ShieldCheck,
		TestTube2,
		Trash2,
		TriangleAlert,
		Sparkles,
		Strikethrough,
		Undo2,
		Video,
		Wrench,
		X
	} from '@lucide/svelte';
	import { onMount } from 'svelte';

	import type { SiteGoal, SiteModule } from '../contracts/catalog';
	import { planSiteCreation } from '../planning/site-creation';

	import {
		customSiteModes,
		demoAdoptionReport,
		demoChangePreview,
		demoCustomSitePlan,
		demoImportedContentSchema,
		starterCatalog,
		starterRepositoryAssessments,
		starterRepositoryCatalog,
		supportedFrameworkAdapters
	} from './foundation-data';
	import ContentWorkspace from './ContentWorkspace.svelte';
	import type { HostMediaBridge } from './host-media';
	import {
		ConnectedRepositoryBranchSchema,
		ConnectedRepositoryReportSchema,
		ConnectedRepositorySchema,
		ConnectedSourceEvidenceSchema,
		SourceControlConnectionsSchema,
		assessConnectedRepository,
		type ConnectedRepository,
		type ConnectedRepositoryBranch,
		type ConnectedRepositoryReport,
		type ConnectedSourceEvidence,
		type SourceControlConnections,
		type HostSourceBridge
	} from './host-source';
	import PostFeed from './PostFeed.svelte';
	import SeoWorkspace, { type SeoArea } from './SeoWorkspace.svelte';
	import StructureWorkspace, { type StructureArea } from './StructureWorkspace.svelte';
	import VisitorForm from './VisitorForm.svelte';
	import VisitorJournal from './VisitorJournal.svelte';
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
		createDefaultPageSeo,
		createDemoSite,
		createSection,
		demoImages,
		duplicateDemoPage,
		postsForSection,
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
	import {
		createPortableSource,
		type PortableAsset,
		type PortableAssetRequest
	} from './source-export';
	import {
		navigationChildren,
		navigationRoots,
		removeNavigationPage,
		resolveAnnouncementHref,
		resolveNavigationHref
	} from './site-structure';

	type View =
		| 'home'
		| 'content'
		| 'structure'
		| 'create'
		| 'adopt'
		| 'studio'
		| 'library'
		| 'seo'
		| 'readiness'
		| 'publish';
	type ReadinessArea =
		'overview' | 'health' | 'drafts' | 'media' | 'languages' | 'library' | 'preview' | 'guidance';

	let {
		embedded = false,
		storage,
		media,
		sourceBridge
	}: {
		embedded?: boolean;
		storage?: DraftStorage;
		media?: HostMediaBridge;
		sourceBridge?: HostSourceBridge;
	} = $props();
	let view = $state<View>('home');
	let wizardStep = $state(1);
	let selectedGoal = $state<SiteGoal>('blog');
	let selectedTheme = $state('editorial');
	let selectedRepositoryStarter = $state<string | null>(null);
	let sourceRepositories = $state<ConnectedRepository[]>([]);
	let sourceBranches = $state<ConnectedRepositoryBranch[]>([]);
	let selectedSourceRepository = $state<ConnectedRepository | null>(null);
	let selectedSourceRef = $state('');
	let sourceQuery = $state('');
	let sourceStatus = $state<'idle' | 'loading' | 'inspecting' | 'connecting' | 'ready' | 'error'>(
		'idle'
	);
	let sourceError = $state('');
	let sourceReport = $state<ConnectedRepositoryReport | null>(null);
	let sourceConnection = $state<ConnectedSourceEvidence | null>(null);
	let sourceControlConnections = $state<SourceControlConnections | null>(null);
	let sourceControlBusy = $state(false);
	let sourceControlPrompt = $state('');
	let selectedModules = $state<string[]>(['Home', 'About', 'Blog', 'Gallery', 'Contact']);
	let siteName = $state('Weekend Notes');
	let accent = $state('#56e6ad');
	let mobileMenu = $state(false);
	let readinessArea = $state<ReadinessArea>('overview');
	let seoArea = $state<SeoArea>('overview');
	let structureArea = $state<StructureArea>('overview');
	let seoPageId = $state('home');
	let siteDraft = $state<DemoSite>(createDemoSite());
	let selectedPageId = $state('home');
	let selectedSectionId = $state('hero-1');
	type DraftHistoryEntry = { site: DemoSite; key: string; changedAt: number };
	let history = $state<DraftHistoryEntry[]>([]);
	let redoHistory = $state<DemoSite[]>([]);
	let saveStatus = $state<'loading' | 'saved' | 'local' | 'error'>('loading');
	let saveError = $state('');
	let showAddPage = $state(false);
	let showAddSection = $state(false);
	let showPreview = $state(false);
	let previewViewport = $state<'desktop' | 'tablet' | 'phone'>('desktop');
	let previewExperience = $state<
		'site' | 'not-found' | 'loading' | 'offline' | 'maintenance' | 'error'
	>('site');
	let previewPostId = $state<string | null>(null);
	let showDraftRecovery = $state(false);
	let recoveryBusy = $state(false);
	let exportStatus = $state<'idle' | 'working' | 'done' | 'error'>('idle');
	let exportMessage = $state('');
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
	const activeAdoptionReport = $derived(
		sourceReport ? assessConnectedRepository(sourceReport) : demoAdoptionReport
	);
	const sourceProjectId = 'connected-site';
	const githubConnection = $derived(
		sourceControlConnections?.providers.find((provider) => provider.id === 'github') ?? null
	);
	const reportIsConnected = $derived(
		Boolean(
			sourceReport &&
			sourceConnection &&
			sourceConnection.repository.fullName === sourceReport.repository.fullName &&
			sourceConnection.repository.ref === sourceReport.repository.ref &&
			sourceConnection.commit === sourceReport.inspection.snapshot.commit
		)
	);

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
		const handleSourceConnection = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;
			if (event.data?.type !== 'tend.github-manifest') return;
			if (event.data.ok === true) {
				sourceControlPrompt = 'GitHub connected. Repository access is refreshing…';
				void loadSourceControlConnections();
			} else {
				sourceError = 'GitHub did not complete the connection. You can try again here.';
			}
		};
		window.addEventListener('message', handleSourceConnection);
		if (!storage) {
			saveStatus = 'local';
			return () => window.removeEventListener('message', handleSourceConnection);
		}
		draftStore = new DemoDraftStore(storage, draftStorageKey);
		void draftStore
			?.load()
			.then((stored) => {
				if (stored && latestSaveRequest === 0) siteDraft = cloneDemoSite(stored.site);
				saveStatus = 'saved';
			})
			.catch((reason) => {
				saveStatus = 'error';
				saveError =
					reason instanceof Error
						? reason.message.slice(0, 180)
						: 'The saved draft could not be read.';
			});
		return () => window.removeEventListener('message', handleSourceConnection);
	});

	function saveDraft(next: DemoSite): Promise<void> {
		if (!draftStore) {
			saveStatus = 'local';
			return Promise.resolve();
		}
		const request = ++latestSaveRequest;
		saveStatus = 'loading';
		saveError = '';
		return draftStore
			.save(next)
			.then(() => {
				if (request === latestSaveRequest) {
					saveStatus = 'saved';
					saveError = '';
				}
			})
			.catch((reason) => {
				if (request === latestSaveRequest) {
					saveStatus = 'error';
					saveError =
						reason instanceof Error
							? reason.message.slice(0, 180)
							: 'The draft could not be saved.';
				}
			});
	}

	async function retryDraftSave() {
		if (!draftStore || recoveryBusy) return;
		recoveryBusy = true;
		try {
			await draftStore.retryLoad();
			saveError = '';
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
			saveError = '';
			showDraftRecovery = false;
			saveDraft(siteDraft);
		} catch {
			saveStatus = 'error';
		} finally {
			recoveryBusy = false;
		}
	}

	function changeDraft(mutator: (next: DemoSite) => void, historyKey = 'action') {
		const changedAt = Date.now();
		const previous = cloneDemoSite(siteDraft);
		const next = cloneDemoSite(siteDraft);
		mutator(next);
		if (JSON.stringify(previous) === JSON.stringify(next)) return;
		const latest = history.at(-1);
		const coalescesTyping =
			historyKey.startsWith('typing:') &&
			latest?.key === historyKey &&
			changedAt - latest.changedAt < 1_000;
		history = coalescesTyping
			? [...history.slice(0, -1), { ...latest, changedAt }]
			: [...history.slice(-19), { site: previous, key: historyKey, changedAt }];
		redoHistory = [];
		siteDraft = next;
		saveDraft(next);
	}

	function undoDraft() {
		const entry = history.at(-1);
		if (!entry) return;
		history = history.slice(0, -1);
		redoHistory = [...redoHistory.slice(-19), cloneDemoSite(siteDraft)];
		siteDraft = cloneDemoSite(entry.site);
		if (!siteDraft.pages.some((page) => page.id === selectedPageId)) {
			selectedPageId = siteDraft.pages[0].id;
		}
		selectedSectionId =
			siteDraft.pages.find((page) => page.id === selectedPageId)?.sections[0]?.id ?? '';
		saveDraft(siteDraft);
	}

	function redoDraft() {
		const next = redoHistory.at(-1);
		if (!next) return;
		redoHistory = redoHistory.slice(0, -1);
		history = [
			...history.slice(-19),
			{ site: cloneDemoSite(siteDraft), key: 'redo', changedAt: Date.now() }
		];
		siteDraft = cloneDemoSite(next);
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
			const section = createSection('hero', Date.now());
			next.pages.push({
				id,
				name: name.slice(0, 50),
				slug: uniquePageSlug(name, next.pages),
				seo: createDefaultPageSeo(name.slice(0, 50), [section], next.seo.description),
				sections: [section]
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
				next.structure.header = removeNavigationPage(next.structure.header, targetId);
				next.structure.footer = removeNavigationPage(next.structure.footer, targetId);
				if (next.structure.notFound.pageId === targetId) {
					next.structure.notFound.pageId = next.pages[0]?.id ?? '';
				}
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

	function updateSection(
		field: 'eyebrow' | 'title' | 'body' | 'imageAlt' | 'formConsentLabel' | 'formRecipientLabel',
		value: string
	) {
		changeDraft((next) => {
			const section = next.pages
				.find((page) => page.id === selectedPageId)
				?.sections.find((item) => item.id === selectedSectionId);
			if (section) {
				const maximum = field === 'body' ? 600 : field === 'formRecipientLabel' ? 120 : 240;
				section[field] = value.slice(0, maximum);
			}
		});
	}

	function updatePostFeed(
		field: 'collectionId' | 'postOrder' | 'postLimit',
		value: string | number
	) {
		changeDraft((next) => {
			const section = next.pages
				.find((page) => page.id === selectedPageId)
				?.sections.find((item) => item.id === selectedSectionId);
			if (!section || section.kind !== 'post-feed') return;
			if (field === 'postLimit') section.postLimit = Math.max(1, Math.min(6, Number(value)));
			else if (field === 'postOrder')
				section.postOrder = value === 'featured' ? 'featured' : 'latest';
			else section.collectionId = String(value);
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
		if (issue.target === 'structure') {
			structureArea = issue.structureArea ?? 'overview';
			open('structure');
			return;
		}
		if (issue.target === 'site-seo' || issue.target === 'page-seo') {
			seoArea = issue.target === 'site-seo' ? 'site' : 'pages';
			seoPageId = issue.pageId;
			open('seo');
			return;
		}
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
		if (next === 'adopt' && sourceBridge && sourceStatus === 'idle') {
			void loadSourceControlConnections();
			void loadSourceConnection();
		}
	}

	async function loadSourceControlConnections() {
		if (!sourceBridge) return;
		sourceControlBusy = true;
		sourceError = '';
		try {
			sourceControlConnections = SourceControlConnectionsSchema.parse(
				await sourceBridge.getSourceControlConnections()
			);
			if (githubConnection?.available) await loadSourceRepositories();
		} catch (error) {
			sourceError =
				error instanceof Error ? error.message : 'Source connections could not be loaded.';
		} finally {
			sourceControlBusy = false;
		}
	}

	async function beginGithubConnection() {
		if (!sourceBridge || sourceControlBusy) return;
		sourceControlBusy = true;
		sourceError = '';
		try {
			await sourceBridge.beginSourceControlConnection('github');
			sourceControlPrompt =
				'Finish the GitHub steps in the new tab, then refresh repository access here.';
		} catch (error) {
			sourceError =
				error instanceof Error ? error.message : 'GitHub connection could not be started.';
		} finally {
			sourceControlBusy = false;
		}
	}

	async function manageGithubAccess() {
		if (!sourceBridge || sourceControlBusy) return;
		try {
			await sourceBridge.manageSourceControlAccess('github');
			sourceControlPrompt = 'Add or remove repositories on GitHub, then refresh access here.';
		} catch (error) {
			sourceError =
				error instanceof Error ? error.message : 'GitHub repository access could not be opened.';
		}
	}

	async function loadSourceConnection() {
		if (!sourceBridge) return;
		try {
			const connection = await sourceBridge.getConnection(sourceProjectId);
			sourceConnection = connection ? ConnectedSourceEvidenceSchema.parse(connection) : null;
		} catch {
			sourceConnection = null;
		}
	}

	async function loadSourceRepositories() {
		if (!sourceBridge) return;
		sourceStatus = 'loading';
		sourceError = '';
		try {
			sourceRepositories = ConnectedRepositorySchema.array().parse(
				await sourceBridge.listRepositories(sourceQuery.trim())
			);
			sourceStatus = 'idle';
		} catch (error) {
			sourceRepositories = [];
			sourceStatus = 'error';
			sourceError = error instanceof Error ? error.message : 'Repositories could not be loaded.';
		}
	}

	async function selectSourceRepository(repository: ConnectedRepository) {
		if (!sourceBridge) return;
		selectedSourceRepository = repository;
		selectedSourceRef = repository.defaultBranch;
		sourceReport = null;
		sourceStatus = 'loading';
		sourceError = '';
		try {
			sourceBranches = ConnectedRepositoryBranchSchema.array().parse(
				await sourceBridge.listBranches(repository.owner, repository.name)
			);
			sourceStatus = 'idle';
		} catch (error) {
			sourceBranches = [{ name: repository.defaultBranch, protected: false }];
			sourceStatus = 'error';
			sourceError =
				error instanceof Error
					? error.message
					: 'Branches could not be loaded. The default remains available.';
		}
	}

	async function inspectSourceRepository() {
		if (!sourceBridge || !selectedSourceRepository || !selectedSourceRef) return;
		sourceStatus = 'inspecting';
		sourceError = '';
		sourceReport = null;
		try {
			sourceReport = ConnectedRepositoryReportSchema.parse(
				await sourceBridge.inspectRepository({
					owner: selectedSourceRepository.owner,
					repository: selectedSourceRepository.name,
					ref: selectedSourceRef,
					projectId: sourceProjectId
				})
			);
			sourceStatus = 'ready';
		} catch (error) {
			sourceStatus = 'error';
			sourceError =
				error instanceof Error ? error.message : 'Repository analysis was safely stopped.';
		}
	}

	async function connectSourceRepository() {
		if (!sourceBridge || !sourceReport) return;
		sourceStatus = 'connecting';
		sourceError = '';
		try {
			sourceConnection = ConnectedSourceEvidenceSchema.parse(
				await sourceBridge.connectRepository({
					owner: sourceReport.repository.owner,
					repository: sourceReport.repository.name,
					ref: sourceReport.repository.ref,
					projectId: sourceProjectId,
					expectedCommit: sourceReport.inspection.snapshot.commit,
					expectedTreeSha256: sourceReport.inspection.snapshot.treeSha256,
					expectedArchiveSha256: sourceReport.inspection.snapshot.archiveSha256,
					confirmation: sourceReport.repository.fullName
				})
			);
			sourceStatus = 'ready';
		} catch (error) {
			sourceStatus = 'error';
			sourceError = error instanceof Error ? error.message : 'The source could not be connected.';
		}
	}

	async function resolvePortableAsset(
		request: PortableAssetRequest
	): Promise<PortableAsset | null> {
		const reference = request.reference;
		if (reference.startsWith('data:')) {
			if (!reference.toLowerCase().startsWith('data:image/')) return null;
			const response = await fetch(reference);
			if (!response.ok) return null;
			return {
				bytes: new Uint8Array(await response.arrayBuffer()),
				mimeType: response.headers.get('content-type')?.split(';')[0] ?? ''
			};
		}
		const url = new URL(reference, window.location.href);
		if (
			!['http:', 'https:', 'blob:'].includes(url.protocol) ||
			url.origin !== window.location.origin ||
			url.username ||
			url.password
		)
			return null;
		const response = await fetch(url, { credentials: 'same-origin' });
		if (!response.ok) return null;
		return {
			bytes: new Uint8Array(await response.arrayBuffer()),
			mimeType: response.headers.get('content-type')?.split(';')[0] ?? ''
		};
	}

	async function downloadPortableSource() {
		if (exportStatus === 'working') return;
		exportStatus = 'working';
		exportMessage = 'Preparing content and copying safe media…';
		try {
			const result = await createPortableSource(siteDraft, resolvePortableAsset);
			const bytes = result.archive.slice().buffer;
			const url = URL.createObjectURL(new Blob([bytes], { type: 'application/zip' }));
			const link = document.createElement('a');
			link.href = url;
			link.download = result.filename;
			link.click();
			URL.revokeObjectURL(url);
			exportStatus = 'done';
			exportMessage = result.warnings.length
				? `Downloaded ${result.fileCount} files. ${result.warnings.length} media item${result.warnings.length === 1 ? '' : 's'} need review in the export report.`
				: `Downloaded ${result.fileCount} files with ${result.assetCount} portable media item${result.assetCount === 1 ? '' : 's'}.`;
		} catch (reason) {
			exportStatus = 'error';
			exportMessage =
				reason instanceof Error
					? reason.message.slice(0, 180)
					: 'The source archive could not be prepared.';
		}
	}

	function openPreviewPage(pageId: string) {
		previewPostId = null;
		previewExperience = 'site';
		selectPage(pageId);
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
				class:active={view === 'structure'}
				aria-label="Structure"
				title="Structure"
				onclick={() => open('structure')}><Menu size={17} /><span>Structure</span></button
			>
			<button
				class:active={view === 'library'}
				aria-label="Library"
				title="Library"
				onclick={() => open('library')}><Library size={17} /><span>Library</span></button
			>
			<button
				class:active={view === 'seo'}
				aria-label="Search and sharing"
				title="Search and sharing"
				onclick={() => open('seo')}><Search size={17} /><span>SEO</span></button
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
						</div>
						<div class="project-meta">
							<div>
								<span>{project.updated}</span><span
									>{project.locales.locales.length} language{project.locales.locales.length === 1
										? ''
										: 's'}</span
								>
							</div>
							<span class:sites-badge--positive={project.status === 'published'} class="sites-badge"
								>{project.status}</span
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
		<ContentWorkspace
			site={siteDraft}
			onchange={changeDraft}
			onsave={() => saveDraft(siteDraft)}
			{saveStatus}
			{saveError}
			{media}
			canUndo={history.length > 0}
			canRedo={redoHistory.length > 0}
			onundo={undoDraft}
			onredo={redoDraft}
		/>
	{:else if view === 'structure'}
		<StructureWorkspace
			site={siteDraft}
			onchange={(next) => changeDraft((draft) => Object.assign(draft, next))}
			bind:area={structureArea}
		/>
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
					Choose a repository already authorized in tend.host. Analysis is read-only and never runs
					the site's code.
				</p>
			</div>
			<section class="source-connect" aria-labelledby="source-connect-title">
				<div class="source-connect-heading">
					<div>
						<span class="eyebrow">Shared source control</span>
						<h2 id="source-connect-title">Bring in the site you already own.</h2>
						<p>
							Connect an account once in tend.host, then reuse its repository access for Sites, app
							deployments, and future Git workflows.
						</p>
					</div>
					<span class:available={githubConnection?.available === true} class="source-capability">
						{githubConnection?.available ? 'Repository access ready' : 'Connection needed'}
					</span>
				</div>
				{#if sourceBridge}
					<div class="source-provider-card" aria-live="polite">
						<div class="source-provider-identity">
							<span><GitBranch size={21} /></span>
							<div>
								<strong>GitHub</strong>
								<p>
									{#if githubConnection?.available}
										Connected for repository imports and deployments.
									{:else if githubConnection?.configured}
										The shared App is connected. Choose which repositories it may access.
									{:else}
										Connect the shared GitHub App without leaving this Sites workflow.
									{/if}
								</p>
							</div>
						</div>
						{#if githubConnection?.installations.length}
							<div class="source-installations" aria-label="Connected GitHub accounts">
								{#each githubConnection.installations as installation (installation.owner)}
									<span>
										{installation.owner}
										<small
											>{installation.repositorySelection === 'all'
												? 'All repositories'
												: 'Selected repositories'}</small
										>
									</span>
								{/each}
							</div>
						{/if}
						<div class="source-provider-actions">
							{#if !githubConnection?.configured || githubConnection?.authMode === 'personal_access_token'}
								<button
									class="primary"
									type="button"
									disabled={sourceControlBusy}
									onclick={() => void beginGithubConnection()}
								>
									{#if sourceControlBusy}<LoaderCircle class="spin" size={17} /> Opening…{:else}<GitBranch
											size={17}
										/>
										{githubConnection?.authMode === 'personal_access_token'
											? 'Upgrade connection'
											: 'Connect GitHub'}{/if}
								</button>
							{:else}
								<button type="button" onclick={() => void manageGithubAccess()}>
									<Settings2 size={17} /> Add or change repository access
								</button>
							{/if}
							<button
								type="button"
								disabled={sourceControlBusy}
								onclick={() => void loadSourceControlConnections()}
							>
								{#if sourceControlBusy}<LoaderCircle class="spin" size={17} /> Checking…{:else}<Search
										size={17}
									/> Refresh access{/if}
							</button>
						</div>
						{#if sourceControlPrompt}<p class="source-provider-prompt">
								{sourceControlPrompt}
							</p>{/if}
					</div>
					{#if githubConnection?.available}
						{#if sourceConnection}
							<div class="source-connected" aria-live="polite">
								<span><Check size={18} /></span>
								<div>
									<strong>{sourceConnection.repository.fullName} is connected</strong>
									<p>
										{sourceConnection.repository.ref} · commit {sourceConnection.commit.slice(
											0,
											10
										)}… This records the selected source for reviewed work; repository writes and
										publishing remain unavailable.
									</p>
								</div>
							</div>
						{/if}
						<div class="source-search">
							<label for="source-search-input">Find a GitHub repository</label>
							<div>
								<Search size={17} />
								<input
									id="source-search-input"
									bind:value={sourceQuery}
									placeholder="Repository name"
									onkeydown={(event) => {
										if (event.key === 'Enter') void loadSourceRepositories();
									}}
								/>
								<button
									type="button"
									disabled={sourceStatus === 'loading' ||
										sourceStatus === 'inspecting' ||
										sourceStatus === 'connecting'}
									onclick={() => void loadSourceRepositories()}
									>{sourceStatus === 'loading' ? 'Loading…' : 'Search'}</button
								>
							</div>
						</div>
						{#if sourceError}<p class="source-error" role="alert">{sourceError}</p>{/if}
						<div class="source-connect-grid">
							<div class="source-repository-list" aria-label="Connected GitHub repositories">
								{#each sourceRepositories as repository (repository.fullName)}
									<button
										type="button"
										class:selected={selectedSourceRepository?.fullName === repository.fullName}
										onclick={() => void selectSourceRepository(repository)}
									>
										<GitBranch size={17} />
										<span
											><strong>{repository.fullName}</strong><small
												>{repository.description || 'No repository description'}</small
											></span
										>
										<em>{repository.private ? 'Private' : 'Public'}</em>
									</button>
								{:else}
									{#if sourceStatus !== 'loading'}
										<p>No connected repositories matched this search.</p>
									{/if}
								{/each}
							</div>
							<div class="source-review">
								{#if selectedSourceRepository}
									<span class="eyebrow">Selected source</span>
									<h3>{selectedSourceRepository.fullName}</h3>
									<label>
										Branch
										<select bind:value={selectedSourceRef}>
											{#each sourceBranches as branch (branch.name)}
												<option value={branch.name}
													>{branch.name}{branch.protected ? ' · protected' : ''}</option
												>
											{/each}
										</select>
									</label>
									<div class="source-safety">
										<ShieldCheck size={18} />
										<span
											><strong>Analysis only</strong><small
												>No scripts, builds, writes, secrets, or deployment destination.</small
											></span
										>
									</div>
									<button
										class="primary"
										type="button"
										disabled={!selectedSourceRef || sourceStatus === 'inspecting'}
										onclick={() => void inspectSourceRepository()}
									>
										{#if sourceStatus === 'inspecting'}<LoaderCircle class="spin" size={17} />
											Analyzing safely…{:else}<FileSearch size={17} /> Analyze repository{/if}
									</button>
								{:else}
									<FileSearch size={28} />
									<h3>Select a repository</h3>
									<p>Then choose its branch and request a disposable analysis.</p>
								{/if}
								{#if sourceReport}<div class="source-connect-action">
										<div>
											<strong
												>{reportIsConnected ? 'Source connected' : 'Keep this selection'}</strong
											>
											<p>
												The host re-verifies the exact commit before saving this repository
												selection. It does not grant Git write or deployment access.
											</p>
										</div>
										<button
											class="primary"
											type="button"
											disabled={reportIsConnected || sourceStatus === 'connecting'}
											onclick={() => void connectSourceRepository()}
										>
											{#if sourceStatus === 'connecting'}
												<LoaderCircle class="spin" size={17} /> Re-verifying…
											{:else if reportIsConnected}
												<Check size={17} /> Connected
											{:else}
												<GitBranch size={17} /> Connect source
											{/if}
										</button>
									</div>{/if}
							</div>
						</div>
						{#if sourceReport}
							<div class="source-result" aria-live="polite">
								<div>
									<span class="eyebrow">Live compatibility evidence</span>
									<h3>{sourceReport.framework} site · {activeAdoptionReport.status}</h3>
									<p>
										Commit {sourceReport.inspection.snapshot.commit.slice(0, 10)}… was inspected and
										the checkout was removed.
									</p>
								</div>
								<dl>
									<div>
										<dt>Files</dt>
										<dd>{sourceReport.inspection.snapshot.fileCount}</dd>
									</div>
									<div>
										<dt>Source size</dt>
										<dd>
											{Math.max(
												1,
												Math.round(sourceReport.inspection.snapshot.archiveBytes / 1024)
											)} KB
										</dd>
									</div>
									<div>
										<dt>Secrets</dt>
										<dd>0 delivered</dd>
									</div>
									<div>
										<dt>Checkout</dt>
										<dd>Removed</dd>
									</div>
								</dl>
								{#if sourceReport.pagesDeployment}
									<div class="source-pages">
										<GitBranch size={18} />
										<div>
											<strong>Published with GitHub Pages</strong>
											<p>
												GitHub Actions builds
												{sourceReport.pagesDeployment.artifactPath
													? ` ${sourceReport.pagesDeployment.artifactPath}/`
													: ' a site artifact'}
												from {sourceReport.repository.ref}.
												{#if sourceReport.pagesDeployment.customDomain}
													It is mapped to {sourceReport.pagesDeployment.customDomain}.
												{/if}
											</p>
										</div>
									</div>
								{/if}
							</div>
						{/if}
					{:else if !sourceControlBusy}
						<div class="source-onboarding">
							<ShieldCheck size={22} />
							<div>
								<strong>Repository credentials stay in tend.host.</strong>
								<p>
									Sites only receives repository choices and short-lived, read-only evidence.
									Connect GitHub above, select repository access on GitHub, then refresh this panel.
								</p>
							</div>
						</div>
					{/if}
				{:else}
					<div class="source-unavailable">
						<GitBranch size={22} />
						<div>
							<strong>Connect once, use it everywhere.</strong>
							<p>
								When Sites runs in tend.host, this same panel connects GitHub and immediately
								continues to repository selection. No second settings workflow is required.
							</p>
						</div>
					</div>
				{/if}
			</section>
			<section class="adoption-paths" aria-labelledby="adoption-paths-title">
				<div class="section-heading">
					<div>
						<span class="eyebrow">Choose how Sites helps</span>
						<h2 id="adoption-paths-title">Your website does not have to look or work like ours.</h2>
					</div>
					<p>
						Visual building is the easy default. Custom repositories keep their framework,
						templates, and rendering.
					</p>
				</div>
				<div class="adoption-path-grid">
					{#each customSiteModes as mode (mode.id)}
						<article>
							<span class="path-icon">
								{#if mode.id === 'visual'}<Paintbrush
										size={21}
									/>{:else if mode.id === 'headless'}<Code2 size={21} />{:else}<GitBranch
										size={21}
									/>{/if}
							</span>
							<small>{mode.bestFor}</small>
							<h3>{mode.name}</h3>
							<p>{mode.summary}</p>
						</article>
					{/each}
				</div>
			</section>

			<section class="custom-site-proof" aria-label="Custom site adoption example">
				<div>
					<span class="eyebrow">Example custom-site plan</span>
					<h2>Keep the renderer. Map only the content.</h2>
					<p>
						A detected {demoCustomSitePlan.framework} site keeps every component, route, style, and build
						decision in its repository.
					</p>
				</div>
				<dl>
					<div>
						<dt>Editing mode</dt>
						<dd>Content only</dd>
					</div>
					<div>
						<dt>Mapped collections</dt>
						<dd>{demoCustomSitePlan.collectionIds.length}</dd>
					</div>
					<div>
						<dt>Renderer</dt>
						<dd>Preserved</dd>
					</div>
					<div>
						<dt>Repository changes</dt>
						<dd>Review required</dd>
					</div>
				</dl>
			</section>

			<section class="adapter-catalog" aria-labelledby="adapter-catalog-title">
				<div class="section-heading">
					<div>
						<span class="eyebrow">Framework-aware, renderer-neutral</span>
						<h2 id="adapter-catalog-title">We map the content. Your framework stays yours.</h2>
					</div>
					<p>
						Detection reads a bounded snapshot only. It cannot clone, run, build, publish, or
						receive provider credentials.
					</p>
				</div>
				<div class="framework-list" aria-label="Supported framework detectors">
					{#each supportedFrameworkAdapters as adapter (adapter.framework)}
						<span><Code2 size={14} /> {adapter.label}</span>
					{/each}
				</div>
				<div class="schema-preview">
					<div>
						<span class="eyebrow">Imported content form</span>
						<h3>{demoImportedContentSchema.catalog.forms[0].collection.label}</h3>
						<p>
							A familiar Git-CMS configuration becomes a reviewed Sites form. Provider and
							publishing settings are deliberately discarded.
						</p>
					</div>
					<div class="schema-fields">
						{#each demoImportedContentSchema.catalog.forms[0].fields as field (field.name)}
							<label>
								<span>{field.label}{field.required ? ' *' : ''}</span>
								{#if field.widget === 'markdown'}
									<textarea disabled placeholder="Write the story…"></textarea>
								{:else}
									<input
										disabled
										placeholder={field.widget === 'image' ? 'Choose an image' : field.label}
									/>
								{/if}
								<small>{field.widget}</small>
							</label>
						{/each}
					</div>
				</div>
				<p class="authority-note">
					<ShieldCheck size={16} /> Repository access remains unavailable until tend.host supplies a reviewed,
					short-lived capability.
				</p>
			</section>

			<section class="starter-repositories" aria-labelledby="starter-repositories-title">
				<div class="section-heading">
					<div>
						<span class="eyebrow">Starter repositories</span>
						<h2 id="starter-repositories-title">
							Begin with a complete site, not an empty canvas.
						</h2>
					</div>
					<p>
						Community identity stays visible. Only immutable, reviewed revisions can be selected.
					</p>
				</div>
				<div class="starter-repository-grid">
					{#each starterRepositoryCatalog as starter, index (starter.id)}
						{@const assessment = starterRepositoryAssessments[index]}
						<article class:selected={selectedRepositoryStarter === starter.id}>
							<div class="starter-repository-heading">
								<span class="path-icon"><GitBranch size={19} /></span>
								<span class:reviewed={assessment.selectable} class="review-state">
									{assessment.selectable ? 'Reviewed' : 'Review needed'}
								</span>
							</div>
							<small>{starter.framework} · {starter.publisher}</small>
							<h3>{starter.name}</h3>
							<p>{starter.summary}</p>
							<div class="starter-tags">
								{#each starter.contentFormats as format (format)}<span>{format}</span>{/each}
							</div>
							<button
								class="secondary"
								disabled={!assessment.selectable}
								onclick={() => (selectedRepositoryStarter = starter.id)}
							>
								{assessment.selectable ? 'Review starter' : 'Unavailable until reviewed'}
							</button>
							{#if selectedRepositoryStarter === starter.id}
								<p class="starter-evidence">
									Pinned commit {starter.commit.slice(0, 8)}… · {starter.license}. Creation remains
									disabled until tend.host supplies an authenticated repository capability.
								</p>
							{/if}
						</article>
					{/each}
				</div>
			</section>
			<div class="adoption-grid">
				<section class="report-card">
					<div class="report-heading">
						<span class="icon-box"><FileSearch size={22} /></span>
						<div>
							<span class="eyebrow">Compatibility report</span>
							<h2>Ready to review</h2>
						</div>
						<span class="sites-badge sites-badge--positive">{activeAdoptionReport.status}</span>
					</div>
					<div class="check-list">
						{#each activeAdoptionReport.checks as check (check.id)}
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
							<dd>{activeAdoptionReport.snapshotId.slice(0, 8)}…</dd>
						</div>
						<div>
							<dt>Commit</dt>
							<dd>{activeAdoptionReport.commit.slice(0, 10)}…</dd>
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
					<button
						class="primary"
						disabled={!sourceBridge}
						onclick={() => document.getElementById('source-connect-title')?.scrollIntoView()}
						><GitBranch size={17} />
						{sourceBridge ? 'Choose connected source' : 'Connect through tend.host'}</button
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
							onclick={() => {
								previewPostId = null;
								showPreview = true;
							}}><MonitorPlay size={16} /><span>Preview site</span></button
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
										{#if section.kind === 'post-feed'}
											<div class="canvas-post-feed">
												<PostFeed posts={postsForSection(siteDraft, section)} />
											</div>
										{/if}
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
					<span class="sites-badge sites-badge--positive sites-badge--compact">Official</span>
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
				{#if selectedSection?.kind === 'post-feed'}
					<div class="inspector-callout">
						<strong>Connected content</strong>
						<small>Published posts update this section automatically. Drafts stay private.</small>
					</div>
					<label>
						<span>Post collection</span>
						<select
							value={selectedSection.collectionId}
							onchange={(event) => updatePostFeed('collectionId', event.currentTarget.value)}
						>
							{#each siteDraft.collections as collection (collection.id)}
								<option value={collection.id}>{collection.name}</option>
							{/each}
						</select>
					</label>
					<label>
						<span>Show first</span>
						<select
							value={selectedSection.postOrder}
							onchange={(event) => updatePostFeed('postOrder', event.currentTarget.value)}
						>
							<option value="latest">Newest posts</option>
							<option value="featured">Featured, then newest</option>
						</select>
					</label>
					<label>
						<span>Number of posts</span>
						<select
							value={selectedSection.postLimit}
							onchange={(event) => updatePostFeed('postLimit', Number(event.currentTarget.value))}
						>
							{#each [1, 2, 3, 4, 5, 6] as count (count)}<option value={count}>{count}</option
								>{/each}
						</select>
					</label>
				{/if}
				{#if selectedSection?.kind === 'form'}
					<div class="inspector-callout">
						<strong>Review-only preview</strong>
						<small>Visitor entries stay in the browser. No delivery destination is connected.</small
						>
					</div>
					<label>
						<span>Consent text</span>
						<textarea
							rows="3"
							value={selectedSection.formConsentLabel}
							oninput={(event) => updateSection('formConsentLabel', event.currentTarget.value)}
						></textarea>
					</label>
					<label>
						<span>Delivery status label</span>
						<input
							value={selectedSection.formRecipientLabel}
							oninput={(event) => updateSection('formRecipientLabel', event.currentTarget.value)}
						/>
					</label>
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
											: kind === 'post-feed'
												? 'Show published stories automatically, with real read-more pages.'
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
					class="site-preview-modal {previewViewport}"
					role="dialog"
					aria-modal="true"
					aria-label="Full example website preview"
				>
					<header>
						<div>
							<strong>Interactive preview</strong><span>Panel-local draft · not published</span>
						</div>
						<div class="preview-controls" role="group" aria-label="Preview controls">
							{#each ['desktop', 'tablet', 'phone'] as width (width)}
								<button
									class:active={previewViewport === width}
									aria-label="{width} preview"
									onclick={() => (previewViewport = width as typeof previewViewport)}
									>{width}</button
								>
							{/each}
							<select aria-label="Preview experience" bind:value={previewExperience}>
								<option value="site">Site page</option>
								<option value="not-found">404 page</option>
								<option value="loading">Loading page</option>
								<option value="offline">Offline page</option>
								<option value="maintenance">Maintenance page</option>
								<option value="error">Error page</option>
							</select>
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
						{#if siteDraft.structure.announcement.enabled}
							{@const announcementHref = resolveAnnouncementHref(
								siteDraft.structure.announcement.href,
								siteDraft.pages
							)}
							<div class="visitor-announcement">
								<span>{siteDraft.structure.announcement.text}</span>
								{#if announcementHref?.startsWith('/')}
									{@const announcementPage = siteDraft.pages.find(
										(page) => page.slug === announcementHref
									)}
									{#if announcementPage}<button onclick={() => openPreviewPage(announcementPage.id)}
											>Read more</button
										>{/if}
								{:else if announcementHref}
									<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- validated HTTPS/mailto destination. -->
									<a href={announcementHref} target="_blank" rel="noopener noreferrer">Read more</a>
								{/if}
							</div>
						{/if}
						<nav>
							<strong>{siteDraft.name}</strong>
							<div class="visitor-desktop-nav">
								{#each navigationRoots(siteDraft.structure.header) as item (item.id)}
									{@const href = resolveNavigationHref(item, siteDraft.pages)}
									{@const children = navigationChildren(siteDraft.structure.header, item.id)}
									<div class="visitor-nav-entry" class:has-submenu={children.length > 0}>
										{#if item.type === 'page' && item.pageId}<button
												class:active={previewExperience === 'site' &&
													selectedPageId === item.pageId}
												onclick={() => openPreviewPage(item.pageId!)}>{item.label}</button
											>{:else if href}
											<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- validated HTTPS/mailto destination. -->
											<a {href} target="_blank" rel="noopener noreferrer">{item.label}</a>
										{/if}
										{#if children.length}
											<details class="visitor-submenu">
												<summary aria-label="Open {item.label} submenu">⌄</summary>
												<div>
													{#each children as child (child.id)}
														{@const childHref = resolveNavigationHref(child, siteDraft.pages)}
														{#if child.type === 'page' && child.pageId}<button
																onclick={() => openPreviewPage(child.pageId!)}>{child.label}</button
															>{:else if childHref}
															<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- validated HTTPS/mailto destination. -->
															<a href={childHref} target="_blank" rel="noopener noreferrer"
																>{child.label}</a
															>
														{/if}
													{/each}
												</div>
											</details>
										{/if}
									</div>
								{/each}
							</div>
							<details class="visitor-mobile-nav">
								<summary>Menu</summary>
								<div>
									{#each navigationRoots(siteDraft.structure.header) as item (item.id)}
										{@const href = resolveNavigationHref(item, siteDraft.pages)}
										{@const children = navigationChildren(siteDraft.structure.header, item.id)}
										{#if item.type === 'page' && item.pageId}<button
												onclick={() => openPreviewPage(item.pageId!)}>{item.label}</button
											>{:else if href}
											<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- validated HTTPS/mailto destination. -->
											<a {href} target="_blank" rel="noopener noreferrer">{item.label}</a>
										{/if}
										{#if children.length}<div class="visitor-mobile-submenu">
												{#each children as child (child.id)}
													{@const childHref = resolveNavigationHref(child, siteDraft.pages)}
													{#if child.type === 'page' && child.pageId}<button
															onclick={() => openPreviewPage(child.pageId!)}>{child.label}</button
														>{:else if childHref}
														<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- validated HTTPS/mailto destination. -->
														<a href={childHref} target="_blank" rel="noopener noreferrer"
															>{child.label}</a
														>
													{/if}
												{/each}
											</div>{/if}
									{/each}
								</div>
							</details>
						</nav>
						{#if previewExperience === 'not-found'}
							<section class="visitor-not-found">
								<small>404 · PAGE NOT FOUND</small>
								<h1>{siteDraft.structure.notFound.title}</h1>
								<p>{siteDraft.structure.notFound.body}</p>
								<button onclick={() => openPreviewPage(siteDraft.structure.notFound.pageId)}
									>{siteDraft.structure.notFound.actionLabel}</button
								>
							</section>
						{:else if previewExperience !== 'site'}
							{@const systemPage = siteDraft.structure.systemPages[previewExperience]}
							<section class="visitor-system-page {previewExperience}" aria-live="polite">
								{#if previewExperience === 'loading'}
									<span class="visitor-system-icon"
										><LoaderCircle size={36} aria-hidden="true" /></span
									>
									<small>JUST A MOMENT</small>
								{:else if previewExperience === 'offline'}
									<span class="visitor-system-icon"><CloudOff size={36} aria-hidden="true" /></span>
									<small>CONNECTION LOST</small>
								{:else if previewExperience === 'maintenance'}
									<span class="visitor-system-icon"><Wrench size={36} aria-hidden="true" /></span>
									<small>PLANNED PAUSE</small>
								{:else}
									<span class="visitor-system-icon"
										><CircleAlert size={36} aria-hidden="true" /></span
									>
									<small>WE HIT A PROBLEM</small>
								{/if}
								<h1>{systemPage.title}</h1>
								<p>{systemPage.body}</p>
								{#if previewExperience === 'offline' || previewExperience === 'error'}
									<button onclick={() => (previewExperience = 'site')}
										>{previewExperience === 'offline'
											? siteDraft.structure.systemPages.offline.actionLabel
											: siteDraft.structure.systemPages.error.actionLabel}</button
									>
								{:else if previewExperience === 'maintenance'}
									<strong>{siteDraft.structure.systemPages.maintenance.statusText}</strong>
								{:else}
									<div class="visitor-loading-track"><i></i></div>
								{/if}
							</section>
						{:else if previewPostId !== null || selectedPage?.id === 'journal'}
							<VisitorJournal site={siteDraft} bind:postId={previewPostId} />
						{:else}
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
											{#if section.kind === 'post-feed'}
												<PostFeed
													posts={postsForSection(siteDraft, section)}
													interactive
													onopen={(post) => {
														selectPage('journal');
														previewPostId = post.id;
													}}
												/>
											{/if}
											{#if section.kind === 'form'}
												<VisitorForm {section} />
											{/if}
										</div>
									{/if}
								</section>
							{/each}
						{/if}
						<footer>
							<div>
								<strong>{siteDraft.name}</strong><span>Example site created in TEND Sites</span>
							</div>
							<nav aria-label="Footer navigation">
								{#each navigationRoots(siteDraft.structure.footer) as item (item.id)}
									{@const href = resolveNavigationHref(item, siteDraft.pages)}
									{@const children = navigationChildren(siteDraft.structure.footer, item.id)}
									<span class="footer-nav-group">
										{#if item.type === 'page' && item.pageId}<button
												onclick={() => openPreviewPage(item.pageId!)}>{item.label}</button
											>{:else if href}
											<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- validated HTTPS/mailto destination. -->
											<a {href} target="_blank" rel="noopener noreferrer">{item.label}</a>
										{/if}
										{#each children as child (child.id)}
											{@const childHref = resolveNavigationHref(child, siteDraft.pages)}
											{#if child.type === 'page' && child.pageId}<button
													class="footer-child"
													onclick={() => openPreviewPage(child.pageId!)}>{child.label}</button
												>{:else if childHref}
												<!-- eslint-disable svelte/no-navigation-without-resolve -- validated HTTPS/mailto destination. -->
												<a
													class="footer-child"
													href={childHref}
													target="_blank"
													rel="noopener noreferrer">{child.label}</a
												>
												<!-- eslint-enable svelte/no-navigation-without-resolve -->
											{/if}
										{/each}
									</span>
								{/each}
							</nav>
							<div class="visitor-social">
								{#each siteDraft.structure.social as item (item.id)}
									<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- validated HTTPS/mailto destination. -->
									<a href={item.href} target="_blank" rel="noopener noreferrer">{item.label}</a>
								{/each}
							</div>
						</footer>
					</div>
				</div>
			</div>
		{/if}
	{:else if view === 'seo'}
		<SeoWorkspace
			site={siteDraft}
			onchange={(next) => changeDraft((draft) => Object.assign(draft, next))}
			bind:area={seoArea}
			bind:selectedPageId={seoPageId}
		/>
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
				<span class="sites-badge sites-badge--positive foundation-count">5 verified checks</span>
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
					<button onclick={() => open('seo')}
						><Search size={21} /><span
							><strong>Search & sharing</strong><small>Identity, pages, previews and files</small
							></span
						><em>Review</em></button
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
								<span class="sites-badge sites-badge--positive">Official</span><small
									>{component.category}</small
								>
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
									<span class="sites-badge sites-badge--positive">Official</span>
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
					<article class="source-export-card">
						<div class="source-export-heading">
							<span><Download size={20} /></span>
							<div>
								<strong>Take your source with you</strong>
								<p>Download structured source, Markdown content, and safely copied media.</p>
							</div>
						</div>
						<button
							class="primary source-export-button"
							disabled={exportStatus === 'working'}
							onclick={downloadPortableSource}
						>
							{#if exportStatus === 'working'}<LoaderCircle class="spin" size={18} /> Preparing…{:else}<Download
									size={18}
								/> Download source archive{/if}
						</button>
						<p
							class:error={exportStatus === 'error'}
							class="source-export-status"
							aria-live="polite"
						>
							{exportMessage || 'No TEND Sites runtime is required to read the archive.'}
						</p>
					</article>
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
		min-width: 0;
		max-width: 100%;
		overflow-x: clip;
		container-type: inline-size;
		background: radial-gradient(circle at 50% -20%, #12322a 0, transparent 34%), #070b0d;
	}
	.sites-shell.embedded {
		min-height: 100%;
		background: #070b0d;
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
		flex-wrap: wrap;
		gap: 8px;
		margin: 22px 0 26px;
		max-width: 100%;
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
		max-width: 100%;
		min-width: 0;
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
	.hero-row > div {
		min-width: 0;
		max-width: 100%;
	}
	.hero-row h1,
	.hero-row p {
		overflow-wrap: anywhere;
	}
	.hero-row > .sites-badge {
		align-self: flex-start;
		max-width: 100%;
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
		min-width: 0;
		padding: 12px;
		overflow: hidden;
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
	.sites-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
		min-height: 24px;
		color: #f2c664;
		background: #2c2617;
		border: 1px solid #594b27;
		border-radius: 999px;
		padding: 4px 10px;
		font-size: 11px;
		font-weight: 700;
		line-height: 1;
		white-space: nowrap;
		text-transform: capitalize;
		box-shadow: none;
		filter: none;
		text-shadow: none;
	}
	.sites-badge--positive {
		color: var(--green);
		background: #10271f;
		border-color: #285543;
	}
	.sites-badge--compact {
		min-height: 22px;
		padding: 3px 8px;
		font-size: 10px;
	}
	.project-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		min-width: 0;
		color: #71847d;
		font-size: 11px;
		margin: 0 4px 14px;
	}
	.project-meta > div {
		display: flex;
		flex: 1 1 auto;
		flex-wrap: wrap;
		gap: 4px 16px;
		min-width: 0;
	}
	.project-meta > div span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.project-meta .sites-badge {
		flex: 0 0 auto;
		max-width: 100%;
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
		max-width: 1240px;
	}
	.source-connect {
		margin-bottom: 18px;
		padding: 22px;
		border: 1px solid #28634f;
		border-radius: 18px;
		background: linear-gradient(140deg, #0b211a, #091315 55%);
	}
	.source-connect-heading {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 24px;
		margin-bottom: 18px;
	}
	.source-connect-heading h2 {
		margin: 6px 0;
	}
	.source-connect-heading p,
	.source-repository-list > p,
	.source-review > p,
	.source-unavailable p,
	.source-result p {
		margin: 0;
		color: var(--muted);
	}
	.source-capability {
		flex: 0 0 auto;
		padding: 7px 10px;
		color: #c6aa68;
		font-size: 11px;
		font-weight: 750;
		border: 1px solid #5b4925;
		border-radius: 999px;
		background: #201a0d;
	}
	.source-capability.available {
		color: #67e6b6;
		border-color: #28634f;
		background: #0d2a20;
	}
	.source-provider-card {
		display: grid;
		grid-template-columns: minmax(240px, 1fr) auto;
		gap: 14px 22px;
		align-items: center;
		margin-bottom: 16px;
		padding: 15px;
		border: 1px solid #29483e;
		border-radius: 14px;
		background: #091713;
	}
	.source-provider-identity {
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 0;
	}
	.source-provider-identity > span {
		display: grid;
		width: 40px;
		height: 40px;
		place-items: center;
		flex: 0 0 auto;
		color: var(--green);
		border-radius: 11px;
		background: #103226;
	}
	.source-provider-identity p,
	.source-provider-prompt {
		margin: 3px 0 0;
		color: var(--muted);
		font-size: 12px;
	}
	.source-provider-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 8px;
	}
	.source-provider-actions button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		min-height: 40px;
		padding: 0 13px;
		color: #c6d6d0;
		font-weight: 750;
		border: 1px solid #315448;
		border-radius: 10px;
		background: #0b1d17;
	}
	.source-provider-actions button.primary {
		color: #07130f;
		border-color: var(--green);
		background: var(--green);
	}
	.source-installations {
		display: flex;
		flex-wrap: wrap;
		gap: 7px;
		grid-column: 1 / -1;
	}
	.source-installations > span {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 6px 9px;
		color: #c8d9d2;
		font-size: 12px;
		border: 1px solid #2a5143;
		border-radius: 999px;
		background: #0d241c;
	}
	.source-installations small {
		color: #7f978e;
	}
	.source-provider-prompt {
		grid-column: 1 / -1;
		padding-top: 10px;
		border-top: 1px solid #203b32;
	}
	.source-onboarding {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 12px;
		align-items: start;
		padding: 15px;
		color: var(--green);
		border: 1px solid #2a5143;
		border-radius: 12px;
		background: #0a1b15;
	}
	.source-onboarding p {
		margin: 4px 0 0;
		color: var(--muted);
	}
	.source-connected {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 11px;
		align-items: start;
		margin-bottom: 14px;
		padding: 13px;
		border: 1px solid #367a62;
		border-radius: 12px;
		background: #0d291f;
	}
	.source-connected > span {
		display: grid;
		width: 32px;
		height: 32px;
		place-items: center;
		color: #07130f;
		border-radius: 9px;
		background: var(--green);
	}
	.source-connected p {
		margin: 4px 0 0;
		color: #9db2aa;
		font-size: 12px;
		line-height: 1.5;
	}
	.source-search {
		display: grid;
		gap: 6px;
		margin-bottom: 14px;
	}
	.source-search > label,
	.source-review label {
		color: #9fb2ab;
		font-size: 12px;
		font-weight: 750;
	}
	.source-search > div {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 10px;
		padding-left: 12px;
		border: 1px solid #29483e;
		border-radius: 12px;
		background: #08130f;
	}
	.source-search input,
	.source-review select {
		box-sizing: border-box;
		width: 100%;
		color: #eef6f2;
		border: 0;
		outline: 0;
		background: transparent;
		padding: 12px 0;
	}
	.source-search button {
		align-self: stretch;
		padding-inline: 18px;
		color: #07130f;
		font-weight: 850;
		border: 0;
		border-radius: 10px;
		background: var(--green);
	}
	.source-error {
		margin: -4px 0 12px;
		padding: 10px 12px;
		color: #f0aaa4;
		font-size: 12px;
		border: 1px solid #613735;
		border-radius: 10px;
		background: #241313;
	}
	.source-connect-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
		gap: 14px;
		min-height: 260px;
	}
	.source-repository-list {
		display: grid;
		align-content: start;
		gap: 7px;
		max-height: 330px;
		overflow: auto;
		padding-right: 3px;
	}
	.source-repository-list button {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 11px;
		min-width: 0;
		padding: 12px;
		color: #b9cbc5;
		text-align: left;
		border: 1px solid #213b33;
		border-radius: 11px;
		background: #0a1713;
	}
	.source-repository-list button:hover,
	.source-repository-list button.selected {
		color: #62e3b1;
		border-color: #3a8268;
		background: #10271f;
	}
	.source-repository-list button span,
	.source-repository-list button strong,
	.source-repository-list button small {
		display: block;
		min-width: 0;
	}
	.source-repository-list button strong,
	.source-repository-list button small {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.source-repository-list button small {
		margin-top: 3px;
		color: #748981;
	}
	.source-repository-list button em {
		color: #80958e;
		font-size: 10px;
		font-style: normal;
	}
	.source-review {
		display: grid;
		align-content: start;
		gap: 13px;
		padding: 18px;
		border: 1px solid #263f38;
		border-radius: 13px;
		background: #091511;
	}
	.source-review h3 {
		margin: 0;
	}
	.source-review label {
		display: grid;
		gap: 6px;
	}
	.source-review select {
		padding: 10px;
		border: 1px solid #29483e;
		border-radius: 10px;
		background: #07110e;
	}
	.source-review .primary {
		width: 100%;
	}
	.source-pages {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 10px;
		align-items: start;
		padding: 12px;
		border: 1px solid #285445;
		border-radius: 11px;
		background: #0b2019;
		color: #63e6b3;
	}
	.source-pages p {
		margin: 3px 0 0;
		color: #a4b8b1;
	}
	.source-connect-action {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 18px;
		padding-top: 14px;
		border-top: 1px solid #244038;
	}
	.source-connect-action > div {
		min-width: 0;
	}
	.source-connect-action p {
		margin-top: 3px;
		font-size: 12px;
	}
	.source-connect-action .primary {
		flex: 0 0 auto;
	}
	.source-safety {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 9px;
		padding: 11px;
		color: #5ee0ad;
		border-radius: 10px;
		background: #0d251d;
	}
	.source-safety span,
	.source-safety strong,
	.source-safety small {
		display: block;
	}
	.source-safety small {
		margin-top: 3px;
		color: #82978f;
	}
	.source-result {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 18px;
		align-items: center;
		margin-top: 14px;
		padding: 16px;
		border: 1px solid #39876a;
		border-radius: 13px;
		background: #0c271e;
	}
	.source-result h3 {
		margin: 5px 0;
		text-transform: capitalize;
	}
	.source-result dl {
		display: grid;
		grid-template-columns: repeat(4, minmax(82px, 1fr));
		gap: 7px;
		margin: 0;
	}
	.source-result dl div {
		padding: 9px;
		border-radius: 9px;
		background: #081812;
	}
	.source-result dt {
		color: #789087;
		font-size: 9px;
		text-transform: uppercase;
	}
	.source-result dd {
		margin: 3px 0 0;
		font-size: 12px;
		font-weight: 750;
	}
	.source-unavailable {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 12px;
		align-items: center;
		padding: 16px;
		color: #88a099;
		border: 1px solid #2c403a;
		border-radius: 12px;
		background: #0a1512;
	}
	.section-heading {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 22px;
		margin-bottom: 16px;
	}
	.section-heading h2 {
		margin: 5px 0 0;
	}
	.section-heading > p {
		max-width: 460px;
		margin: 0;
		color: var(--muted);
	}
	.adoption-paths,
	.adapter-catalog,
	.starter-repositories {
		margin-bottom: 18px;
		padding: 22px;
		border: 1px solid var(--border);
		border-radius: 18px;
		background: #0a1214;
	}
	.adoption-path-grid,
	.starter-repository-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 12px;
	}
	.adoption-path-grid article,
	.starter-repository-grid article {
		min-width: 0;
		padding: 18px;
		border: 1px solid #20332f;
		border-radius: 15px;
		background: #0d1618;
	}
	.adoption-path-grid h3,
	.starter-repository-grid h3 {
		margin: 8px 0;
	}
	.adoption-path-grid p,
	.starter-repository-grid p {
		margin: 0;
		color: var(--muted);
		line-height: 1.5;
	}
	.adoption-path-grid small,
	.starter-repository-grid small {
		color: #7f9690;
		text-transform: capitalize;
	}
	.path-icon {
		display: grid;
		place-items: center;
		width: 42px;
		height: 42px;
		margin-bottom: 14px;
		color: var(--green);
		border-radius: 12px;
		background: #103127;
	}
	.custom-site-proof {
		display: grid;
		grid-template-columns: minmax(0, 1.3fr) minmax(300px, 0.7fr);
		gap: 22px;
		align-items: center;
		margin-bottom: 18px;
		padding: 22px;
		border: 1px solid #245b49;
		border-radius: 18px;
		background: linear-gradient(120deg, #0c211b, #0a1214);
	}
	.custom-site-proof h2 {
		margin: 7px 0;
	}
	.custom-site-proof p {
		margin: 0;
		color: var(--muted);
	}
	.custom-site-proof dl {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		margin: 0;
	}
	.custom-site-proof dl div {
		padding: 10px;
		border-radius: 10px;
		background: #08120f;
	}
	.custom-site-proof dt {
		color: var(--muted);
		font-size: 10px;
		text-transform: uppercase;
	}
	.custom-site-proof dd {
		margin: 4px 0 0;
		font-weight: 750;
	}
	.framework-list {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 18px;
	}
	.framework-list span {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 7px 10px;
		color: #b6c9c3;
		font-size: 12px;
		border: 1px solid #24433a;
		border-radius: 999px;
		background: #0c1a17;
	}
	.schema-preview {
		display: grid;
		grid-template-columns: minmax(220px, 0.7fr) minmax(0, 1.3fr);
		gap: 22px;
		padding: 18px;
		border: 1px solid #20332f;
		border-radius: 15px;
		background: #0d1618;
	}
	.schema-preview h3 {
		margin: 7px 0;
	}
	.schema-preview p,
	.authority-note {
		margin: 0;
		color: var(--muted);
		line-height: 1.5;
	}
	.schema-fields {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
	}
	.schema-fields label {
		display: grid;
		gap: 5px;
		min-width: 0;
		color: #c8d8d3;
		font-size: 12px;
	}
	.schema-fields input,
	.schema-fields textarea {
		box-sizing: border-box;
		width: 100%;
		padding: 10px;
		color: #91a49e;
		border: 1px solid #263b36;
		border-radius: 9px;
		background: #08110f;
	}
	.schema-fields textarea {
		min-height: 64px;
		resize: none;
	}
	.schema-fields small {
		color: #6f8580;
		text-transform: capitalize;
	}
	.authority-note {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 14px;
		font-size: 12px;
	}
	.starter-repository-heading {
		display: flex;
		align-items: start;
		justify-content: space-between;
	}
	.starter-repository-heading .path-icon {
		margin-bottom: 8px;
	}
	.review-state {
		color: #d6a73d;
		font-size: 11px;
		font-weight: 750;
	}
	.review-state.reviewed {
		color: var(--green);
	}
	.starter-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin: 14px 0;
	}
	.starter-tags span {
		padding: 5px 8px;
		color: #9eb1ab;
		font-size: 10px;
		border-radius: 999px;
		background: #15211f;
	}
	.starter-repository-grid .secondary {
		width: 100%;
	}
	.starter-repository-grid article.selected {
		border-color: #3a9c78;
		box-shadow: 0 0 0 2px #1a4938;
	}
	.starter-repository-grid .starter-evidence {
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid var(--border);
		font-size: 11px;
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
	.canvas-section.newsletter,
	.canvas-section.post-feed {
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
	.canvas-post-feed {
		pointer-events: none;
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
	.inspector-callout {
		display: grid;
		gap: 4px;
		padding: 12px;
		color: var(--green);
		background: #0b211a;
		border: 1px solid #235842;
		border-radius: 12px;
	}
	.inspector-callout small {
		color: var(--muted);
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
	.site-preview-modal.tablet {
		width: min(820px, 100%);
	}
	.site-preview-modal.phone {
		width: min(430px, 100%);
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
	.preview-controls {
		display: flex !important;
		gap: 4px !important;
		margin-right: 6px;
	}
	.preview-controls button {
		padding: 7px 9px;
		color: #91a49c;
		font-size: 11px;
		text-transform: capitalize;
		border: 1px solid #293a35;
		border-radius: 7px;
		background: #10191b;
	}
	.preview-controls button.active {
		color: #082219;
		border-color: var(--green);
		background: var(--green);
	}
	.preview-controls select {
		min-height: 32px;
		padding: 6px 26px 6px 9px;
		color: #d6e4de;
		font-size: 11px;
		border: 1px solid #293a35;
		border-radius: 7px;
		background: #10191b;
	}
	.full-demo-site {
		color: var(--site-ink);
		background: var(--site-paper);
	}
	.visitor-announcement {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 12px;
		padding: 10px 18px;
		color: #11241c;
		font-size: 13px;
		font-weight: 700;
		background: var(--accent);
	}
	.visitor-announcement button,
	.visitor-announcement a {
		padding: 0;
		color: inherit;
		font-weight: 900;
		text-decoration: underline;
		border: 0;
		background: transparent;
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
	.full-demo-site nav a {
		display: inline-flex;
		align-items: center;
		padding: 8px 10px;
		color: #40544c;
		font-size: 13px;
		text-decoration: none;
		border-radius: 8px;
	}
	.full-demo-site nav button.active {
		color: #0b3b2a;
		background: color-mix(in srgb, var(--accent) 25%, transparent);
	}
	.full-demo-site nav .visitor-nav-entry {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0;
	}
	.visitor-submenu {
		position: static;
	}
	.visitor-submenu summary {
		display: grid;
		place-items: center;
		width: 26px;
		height: 34px;
		margin-left: -7px;
		color: #40544c;
		font-weight: 900;
		list-style: none;
		cursor: pointer;
	}
	.visitor-submenu summary::-webkit-details-marker {
		display: none;
	}
	.full-demo-site nav .visitor-submenu > div {
		position: absolute;
		top: calc(100% + 7px);
		right: 0;
		display: grid;
		min-width: 190px;
		padding: 8px;
		border: 1px solid #cfd8d1;
		border-radius: 10px;
		background: var(--site-paper);
		box-shadow: 0 15px 40px #10201830;
		z-index: 5;
	}
	.full-demo-site nav .visitor-submenu > div > button,
	.full-demo-site nav .visitor-submenu > div > a {
		width: 100%;
		box-sizing: border-box;
		justify-content: flex-start;
		text-align: left;
	}
	.visitor-mobile-nav {
		display: none;
		position: relative;
	}
	.visitor-mobile-nav summary {
		padding: 8px 10px;
		color: #40544c;
		font-weight: 800;
		cursor: pointer;
	}
	.visitor-mobile-nav > div {
		position: absolute;
		right: 0;
		top: calc(100% + 8px);
		display: grid !important;
		min-width: 180px;
		padding: 8px;
		border: 1px solid #cfd8d1;
		border-radius: 10px;
		background: var(--site-paper);
		box-shadow: 0 15px 40px #10201830;
		z-index: 4;
	}
	.full-demo-site nav .visitor-mobile-submenu {
		display: grid !important;
		gap: 2px;
		margin: 0 0 5px 12px;
		padding-left: 8px;
		border-left: 2px solid color-mix(in srgb, var(--accent) 55%, transparent);
	}
	.full-demo-site nav .visitor-mobile-submenu > button,
	.full-demo-site nav .visitor-mobile-submenu > a {
		width: 100%;
		box-sizing: border-box;
		justify-content: flex-start;
		text-align: left;
	}
	.visitor-not-found {
		display: grid;
		align-content: center;
		justify-items: center;
		min-height: 520px;
		padding: clamp(45px, 9vw, 110px);
		text-align: center;
	}
	.visitor-not-found small {
		color: #147650;
		font-weight: 900;
		letter-spacing: 0.13em;
	}
	.visitor-not-found h1 {
		max-width: 760px;
		margin: 20px 0 12px;
		font:
			500 clamp(38px, 7vw, 76px) / 1 Georgia,
			serif;
	}
	.visitor-not-found p {
		max-width: 600px;
		color: #506159;
		font-size: 18px;
		line-height: 1.6;
	}
	.visitor-not-found button {
		margin-top: 18px;
		padding: 12px 18px;
		color: #102219;
		font-weight: 800;
		border: 0;
		border-radius: 999px;
		background: var(--accent);
	}
	.visitor-system-page {
		display: grid;
		align-content: center;
		justify-items: center;
		min-height: 520px;
		padding: clamp(45px, 9vw, 110px);
		text-align: center;
		background: radial-gradient(
			circle at 50% 20%,
			color-mix(in srgb, var(--accent) 18%, transparent),
			transparent 38%
		);
	}
	.visitor-system-icon {
		display: inline-flex;
		color: #147650;
	}
	.visitor-system-page.loading .visitor-system-icon {
		animation: visitor-spin 1.7s linear infinite;
	}
	.visitor-system-page small {
		margin-top: 22px;
		color: #147650;
		font-weight: 900;
		letter-spacing: 0.13em;
	}
	.visitor-system-page h1 {
		max-width: 760px;
		margin: 18px 0 10px;
		font:
			500 clamp(38px, 7vw, 70px) / 1.02 Georgia,
			serif;
	}
	.visitor-system-page p {
		max-width: 600px;
		margin: 0;
		color: #506159;
		font-size: 18px;
		line-height: 1.6;
	}
	.visitor-system-page button {
		margin-top: 22px;
		padding: 12px 18px;
		color: #102219;
		font-weight: 800;
		border: 0;
		border-radius: 999px;
		background: var(--accent);
	}
	.visitor-system-page strong {
		margin-top: 22px;
		color: #147650;
	}
	.visitor-loading-track {
		width: min(280px, 75%);
		height: 5px;
		margin-top: 26px;
		overflow: hidden;
		border-radius: 999px;
		background: #cbd8d1;
	}
	.visitor-loading-track i {
		display: block;
		width: 45%;
		height: 100%;
		border-radius: inherit;
		background: #147650;
		animation: visitor-load 1.5s ease-in-out infinite alternate;
	}
	@keyframes visitor-spin {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes visitor-load {
		to {
			transform: translateX(122%);
		}
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
	.preview-section .preview-body :global(.table-scroll) {
		overflow-x: auto;
	}
	.preview-section .preview-body :global(table) {
		width: 100%;
		border-collapse: collapse;
	}
	.preview-section .preview-body :global(th),
	.preview-section .preview-body :global(td) {
		padding: 0.6rem;
		text-align: left;
		border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
	}
	.preview-section .preview-body :global(.markdown-callout) {
		padding: 0.8rem;
		border: 1px solid color-mix(in srgb, var(--accent) 38%, transparent);
		border-radius: 10px;
		background: color-mix(in srgb, var(--accent) 8%, transparent);
	}
	.preview-section .preview-body :global(.markdown-callout strong) {
		display: block;
		color: var(--accent);
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
	.preview-section.post-feed {
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
	.full-demo-site footer > div:first-child {
		display: grid;
		gap: 5px;
	}
	.full-demo-site footer nav,
	.visitor-social {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.full-demo-site footer .footer-nav-group {
		display: inline-flex;
		align-items: center;
		gap: 2px;
	}
	.full-demo-site footer .footer-child::before {
		content: '›';
		margin-right: 5px;
		color: var(--accent);
	}
	.full-demo-site footer nav button,
	.full-demo-site footer nav a,
	.visitor-social a {
		padding: 5px 7px;
		color: #cde0d7;
		font-size: 12px;
		text-decoration: none;
		border: 0;
		background: transparent;
	}
	.site-preview-modal.phone .visitor-desktop-nav,
	.site-preview-modal.tablet .visitor-desktop-nav {
		display: none;
	}
	.site-preview-modal.phone .visitor-mobile-nav,
	.site-preview-modal.tablet .visitor-mobile-nav {
		display: block;
	}
	.site-preview-modal.phone .preview-section {
		grid-template-columns: 1fr;
		min-height: auto;
		padding: 38px 24px;
	}
	.site-preview-modal.phone .full-demo-site footer {
		align-items: flex-start;
		flex-direction: column;
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
	.source-export-card {
		display: grid;
		gap: 16px;
		padding: 20px;
		border: 1px solid color-mix(in srgb, var(--green) 34%, var(--border));
		border-radius: 18px;
		background: linear-gradient(145deg, rgba(86, 230, 173, 0.09), rgba(14, 20, 23, 0.96));
	}
	.source-export-heading {
		display: grid;
		grid-template-columns: 38px 1fr;
		gap: 12px;
		align-items: start;
	}
	.source-export-heading > span {
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		color: var(--green);
		border-radius: 12px;
		background: rgba(86, 230, 173, 0.1);
	}
	.source-export-heading p,
	.source-export-status {
		margin: 5px 0 0;
		color: var(--muted);
		font-size: 13px;
		line-height: 1.45;
	}
	.source-export-button {
		width: 100%;
	}
	.source-export-status {
		min-height: 38px;
		margin: -4px 2px 0;
	}
	.source-export-status.error {
		color: #ffaaa5;
	}
	.publish-grid .honesty-note {
		margin: 0;
	}
	.details {
		grid-template-columns: 1fr 1fr;
	}

	@media (max-width: 900px) {
		.site-preview-modal > header {
			align-items: flex-start;
			flex-direction: column;
			padding-right: 62px;
		}
		.preview-controls {
			flex-wrap: wrap;
		}
		.visitor-desktop-nav {
			display: none !important;
		}
		.visitor-mobile-nav {
			display: block;
		}
		.full-demo-site footer {
			align-items: flex-start;
			flex-direction: column;
		}
		.hero-row {
			align-items: start;
			flex-direction: column;
		}
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
		.adoption-grid,
		.custom-site-proof,
		.schema-preview,
		.adoption-path-grid,
		.starter-repository-grid,
		.source-connect-grid,
		.source-result {
			grid-template-columns: 1fr;
		}
		.source-result dl {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.source-connect-heading {
			flex-direction: column;
		}
		.source-provider-card {
			grid-template-columns: 1fr;
		}
		.source-provider-actions {
			justify-content: flex-start;
		}
		.source-connect-action {
			align-items: stretch;
			flex-direction: column;
		}
		.source-connect-action .primary {
			width: 100%;
		}
		.section-heading {
			align-items: start;
			flex-direction: column;
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
		.visitor-system-page.loading .visitor-system-icon,
		.visitor-loading-track i {
			animation: none;
		}
	}
</style>
