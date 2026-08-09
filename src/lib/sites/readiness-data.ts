import { evaluateDraftSave } from '../contracts/drafts';
import { assessLibraryItem } from '../contracts/library';
import { reportLocalizationCoverage } from '../contracts/localization';
import { planMediaVariants } from '../contracts/media';
import { assessPreviewEvidence } from '../contracts/preview-policy';

export const draftEvidence = evaluateDraftSave(
	{
		contract: 'tend.host/sites-draft-save-request/v1',
		requestId: 'a1111111-1111-4111-8111-111111111111',
		projectId: 'weekend-notes',
		entryId: 'field-notes-en',
		baseRevision: '4'.repeat(64),
		contentSha256: '5'.repeat(64),
		sequence: 3,
		requestedAt: '2026-08-09T20:00:00Z'
	},
	'4'.repeat(64),
	null,
	'a2222222-2222-4222-8222-222222222222',
	'2026-08-09T20:00:01Z'
);

export const mediaEvidence = planMediaVariants(
	{
		contract: 'tend.host/sites-media-asset/v1',
		assetId: 'journal-cover',
		projectId: 'weekend-notes',
		path: 'static/media/journal-cover.jpg',
		sha256: '6'.repeat(64),
		contentType: 'image/jpeg',
		bytes: 820_000,
		width: 2400,
		height: 1600,
		alt: { en: 'Open journal beside a camera' },
		createdAt: '2026-08-09T20:00:00Z'
	},
	[
		{ variantId: 'card', purpose: 'card', width: 960, height: 640, format: 'webp', quality: 82 },
		{
			variantId: 'thumb',
			purpose: 'thumbnail',
			width: 480,
			height: 320,
			format: 'avif',
			quality: 76
		}
	]
);

const project = {
	contract: 'tend.host/sites/v1' as const,
	id: 'weekend-notes',
	name: 'Weekend Notes',
	adapter: 'sveltekit' as const,
	repositoryId: 'repo-weekend-notes',
	defaultBranch: 'main',
	collections: [
		{
			id: 'posts',
			label: 'Blog posts',
			kind: 'posts' as const,
			directory: 'src/content/posts',
			format: 'markdown' as const
		}
	],
	locales: { defaultLocale: 'en', locales: ['en', 'es'], strategy: 'multiple_folders' as const },
	mediaDirectory: 'static/media',
	mediaPublicPath: '/media',
	buildScript: 'build',
	status: 'draft' as const
};

export const localizationEvidence = reportLocalizationCoverage(project, [
	{
		contract: 'tend.host/sites-content-entry/v1',
		id: 'field-notes-en',
		logicalId: 'field-notes',
		collectionId: 'posts',
		locale: 'en',
		path: 'src/content/posts/en/field-notes.md',
		title: 'Field Notes',
		slug: 'field-notes',
		description: 'A weekend route worth remembering.',
		draft: false,
		frontmatter: {},
		bodySha256: '7'.repeat(64)
	}
]);

const libraryItem = {
	contract: 'tend.host/sites-library-item/v1' as const,
	kind: 'component' as const,
	id: 'split-hero',
	name: 'Split Hero',
	version: '1.0.0',
	publisherId: 'tend-stack',
	trust: 'official' as const,
	adapter: 'sveltekit' as const,
	adapterRange: '^2.0.0',
	entryPath: 'src/lib/components/SplitHero.svelte',
	integritySha256: '8'.repeat(64),
	panelScript: false as const
};

export const libraryEvidence = assessLibraryItem(libraryItem, {
	contract: 'tend.host/sites-library-certification/v1',
	certificationId: 'a3333333-3333-4333-8333-333333333333',
	itemId: libraryItem.id,
	itemVersion: libraryItem.version,
	itemIntegritySha256: libraryItem.integritySha256,
	repositoryId: 'official-sites-library',
	commit: '9'.repeat(40),
	archiveSha256: 'a'.repeat(64),
	checks: ['schema', 'integrity', 'accessibility', 'responsive', 'security'].map((id) => ({
		id: id as 'schema' | 'integrity' | 'accessibility' | 'responsive' | 'security',
		status: 'passed' as const,
		evidenceSha256: 'b'.repeat(64)
	})),
	certifiedAt: '2026-08-09T20:00:00Z'
});

export const previewEvidence = assessPreviewEvidence(
	{
		contract: 'tend.host/sites-preview-policy/v1',
		policyId: 'default-isolated',
		separateOrigin: true,
		panelCredentials: false,
		secrets: 'none',
		network: 'public_packages',
		maxSeconds: 300,
		maxMemoryMiB: 1024,
		maxDiskMiB: 4096,
		maxLogBytes: 1_000_000,
		ttlSeconds: 3600,
		requiredChecks: ['build', 'accessibility']
	},
	{
		contract: 'tend.host/sites-preview-execution-evidence/v1',
		previewId: 'a4444444-4444-4444-8444-444444444444',
		policyId: 'default-isolated',
		snapshotId: 'a5555555-5555-4555-8555-555555555555',
		changeSetId: 'a6666666-6666-4666-8666-666666666666',
		artifactSha256: 'c'.repeat(64),
		previewUrl: 'https://preview.example.test',
		startedAt: '2026-08-09T20:00:00Z',
		finishedAt: '2026-08-09T20:01:00Z',
		expiresAt: '2026-08-09T21:01:00Z',
		memoryPeakMiB: 480,
		diskPeakMiB: 900,
		logBytes: 48_000,
		checks: ['build', 'accessibility'].map((checkId) => ({
			checkId,
			checkVersion: '1.0.0',
			status: 'passed' as const,
			durationMs: 1000,
			summary: `${checkId} passed`,
			evidenceSha256: 'd'.repeat(64)
		}))
	},
	'https://panel.example.test',
	'2026-08-09T20:02:00Z'
);
