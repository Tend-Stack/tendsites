import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const extensionDistribution = resolve(import.meta.dirname, '..', 'dist', 'extension');

test('presents a truthful foundation overview', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByRole('heading', { name: 'Sites you own, source and all.' })).toBeVisible();
	await expect(page.getByText('Foundation preview')).toBeVisible();
	await expect(page.getByRole('button', { name: 'View safe analysis' })).toBeVisible();
});

test('shows source adoption evidence without granting mutation authority', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'View safe analysis' }).click();

	await expect(
		page.getByRole('heading', { name: 'Understand first. Change nothing.' })
	).toBeVisible();
	await expect(page.getByText('Protected by default')).toBeVisible();
	await expect(
		page.getByRole('heading', { name: 'Your website does not have to look or work like ours.' })
	).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Keep my custom design' })).toBeVisible();
	await expect(page.getByText('Keep the renderer. Map only the content.')).toBeVisible();
	await expect(
		page.getByRole('heading', { name: 'Begin with a complete site, not an empty canvas.' })
	).toBeVisible();
	await expect(page.getByRole('button', { name: 'Unavailable until reviewed' })).toBeDisabled();
	await page.getByRole('button', { name: 'Review starter' }).first().click();
	await expect(page.getByText(/Pinned commit 88888888/)).toBeVisible();
	await expect(page.getByText('Not available')).toHaveCount(2);
	await expect(page.getByRole('button', { name: 'Connect through tend.host' })).toBeDisabled();
});

test('guides creation without pretending to create source', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'New site' }).click();

	await expect(page.getByText('What are you making?', { exact: true })).toBeVisible();
	for (const next of ['Next: Look', 'Next: Structure', 'Next: Identity', 'Next: Review']) {
		await page.getByRole('button', { name: next }).click();
	}

	await expect(page.getByText('Source creation is intentionally disabled.')).toBeVisible();
	await expect(page.getByText('3 reviewed files')).toBeVisible();
	await page.getByRole('button', { name: 'Open Studio preview' }).click();
	await expect(page.getByText('Local demo session')).toBeVisible();
	await expect(page.getByLabel('Content overview')).toContainText('3 entries');
});

test('edits real posts in a focused content workspace', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Content', exact: true }).click();

	await expect(
		page.getByRole('heading', { name: 'Stories, organized and ready to reuse.' })
	).toBeVisible();
	await expect(page.locator('.post-list > button')).toHaveCount(3);
	await page
		.getByLabel('Posts')
		.getByRole('button', { name: /A cabin reading list/ })
		.click();
	await expect(page.locator('.post-editor > header h2')).toHaveText('A cabin reading list');

	const title = page.getByLabel('Title');
	await title.fill('Books for a rainy cabin weekend');
	await title.blur();
	await expect(page.locator('.post-editor > header h2')).toHaveText(
		'Books for a rainy cabin weekend'
	);

	await page.getByLabel('Status').selectOption('published');
	await expect(page.locator('.post-list em.published')).toHaveCount(3);
	await page.getByRole('button', { name: 'New post' }).first().click();
	await expect(page.locator('.post-editor > header h2')).toHaveText('Untitled post');
});

test('publishing clearly remains non-authoritative', async ({ page }) => {
	await page.goto('/');
	await page
		.getByLabel('Sites navigation')
		.getByRole('button', { name: 'Studio', exact: true })
		.click();
	await page.getByRole('button', { name: 'Publish', exact: true }).click();

	await expect(page.getByText('No deployment has been requested.')).toBeVisible();
	await expect(page.getByText('Operation')).toBeVisible();
	await expect(page.getByText('Not created')).toBeVisible();
	await expect(page.getByText('Proposed files')).toBeVisible();
	await expect(page.getByText('Deletes')).toBeVisible();
});

test('organizes readiness evidence into focused tabs', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Readiness', exact: true }).click();

	await expect(
		page.getByRole('heading', { name: 'Ready for the host, without pretending.' })
	).toBeVisible();
	await expect(page.getByLabel('Foundation readiness overview')).toBeVisible();
	await page.getByRole('button', { name: 'Draft safety', exact: true }).click();
	await page.getByRole('button', { name: 'Keep my draft' }).click();
	await expect(
		page.getByText('Resolution selected for review. No source was changed.')
	).toBeVisible();
	await page.getByRole('button', { name: 'Overview', exact: true }).click();
	await page.getByRole('button', { name: 'Media', exact: true }).click();
	await expect(
		page.getByRole('heading', { name: 'Variants are deterministic and accessibility-aware.' })
	).toBeVisible();
	await expect(page.getByText('Host capability required')).toBeVisible();
	await expect(page.getByText('Separate authority required')).not.toBeVisible();
	await page.getByRole('button', { name: 'Preview', exact: true }).click();
	await expect(
		page.getByRole('heading', { name: 'Checks can pass without authorizing deployment.' })
	).toBeVisible();
	await expect(page.getByText('Separate authority required')).toBeVisible();
	await page.getByRole('button', { name: 'Guidance', exact: true }).click();
	await expect(
		page.getByRole('heading', { name: 'Useful checks before involving an AI provider.' })
	).toBeVisible();
	await expect(page.getByText('Not used')).toBeVisible();
});

test('supports keyboard block ordering and a purpose-built mobile studio', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Studio', exact: true }).click();
	const blocks = page.getByLabel('Page blocks');
	await blocks.getByRole('button', { name: 'Field Notes' }).press('Alt+ArrowUp');
	await expect(blocks.getByRole('button').first()).toHaveText('Field Notes');

	await page.setViewportSize({ width: 390, height: 844 });
	await page.getByRole('button', { name: 'Inspector', exact: true }).click();
	await expect(page.getByLabel('Selected block settings')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Field Notes' })).toBeVisible();
	await page.getByRole('button', { name: 'Canvas', exact: true }).click();
	await expect(page.locator('.browser-frame')).toBeVisible();
});

test('resizes desktop Studio panels and edits section copy directly on canvas', async ({
	page
}) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto('/');
	await page.getByRole('button', { name: 'Open interactive demo' }).click();

	const outline = page.getByRole('complementary', { name: 'Site outline' });
	const before = await outline.boundingBox();
	const outlineHandle = page.getByRole('separator', { name: 'Resize site outline' });
	const handleBox = await outlineHandle.boundingBox();
	expect(before).not.toBeNull();
	expect(handleBox).not.toBeNull();
	await page.mouse.move(handleBox!.x + 4, handleBox!.y + 120);
	await page.mouse.down();
	await page.mouse.move(handleBox!.x + 64, handleBox!.y + 120);
	await page.mouse.up();
	const after = await outline.boundingBox();
	expect(after!.width).toBeGreaterThan(before!.width + 40);

	const inlineTitle = page.getByRole('textbox', { name: 'Edit Lake hero title' });
	await inlineTitle.fill('A calmer way to see the world');
	await inlineTitle.press('Tab');
	await expect(page.getByLabel('Selected block settings').getByLabel('Title')).toHaveValue(
		'A calmer way to see the world'
	);

	await page.getByRole('button', { name: 'Writing tools' }).click();
	await expect(page.getByRole('button', { name: 'Edit text' })).toBeVisible();
	await page.getByRole('button', { name: 'Hide tools' }).click();
	await expect(page.getByRole('button', { name: 'Edit text' })).toHaveCount(0);
});

test('opens contextual rich text tools and saves portable Markdown formatting', async ({
	page
}) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto('/');
	await page.getByRole('button', { name: 'Open interactive demo' }).click();

	const title = page.getByRole('textbox', { name: 'Edit Lake hero title' });
	await title.click();
	await expect(page.getByLabel('Text formatting tools')).toBeVisible();
	await expect(page.getByLabel('Text formatting tools')).toContainText('Title');
	await title.press('Control+A');
	await page.getByRole('button', { name: 'Bold' }).click();
	await expect(title.locator('strong')).toHaveText('Stories, sound & places worth remembering.');
	await page.getByRole('button', { name: 'Close text tools' }).click();
	await expect(page.getByLabel('Selected block settings').getByLabel('Title')).toHaveValue(
		'**Stories, sound & places worth remembering.**'
	);

	const body = page.getByRole('textbox', { name: 'Edit Lake hero text' });
	await body.click();
	await body.press('Control+A');
	await page.getByRole('button', { name: 'Add link' }).click();
	await page.getByLabel('Link address').fill('https://example.com/journal');
	await page.getByRole('button', { name: 'Apply link' }).click();
	await expect(body.locator('a')).toHaveAttribute('href', 'https://example.com/journal');
	await page.getByRole('button', { name: 'Close text tools' }).click();
	await expect(page.getByLabel('Selected block settings').getByLabel('Body')).toHaveValue(
		'[A personal corner for essays, field recordings and the occasional experiment.](https://example.com/journal)'
	);
});

test('keeps the floating editor and inserts reviewed external content without embed code', async ({
	page
}) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto('/');
	await page.getByRole('button', { name: 'Open interactive demo' }).click();

	const body = page.getByRole('textbox', { name: 'Edit Lake hero text' });
	await body.click();
	const toolbar = page.getByLabel('Text formatting tools');
	await expect(toolbar).toBeVisible();
	await expect(toolbar.getByRole('button', { name: 'Strikethrough' })).toBeVisible();
	await expect(toolbar.getByRole('button', { name: 'Inline code' })).toBeVisible();
	await toolbar.getByRole('button', { name: 'Insert content' }).click();
	await toolbar.getByRole('button', { name: 'Video or social post' }).click();

	const dialog = page.getByRole('dialog', { name: 'Add a video or social post' });
	await dialog.getByLabel('Content link').fill('https://youtu.be/dQw4w9WgXcQ');
	await expect(dialog.getByText('YouTube detected')).toBeVisible();
	await dialog.getByRole('button', { name: 'Add content' }).click();

	const embed = page.locator('.canvas-section.embed');
	await expect(embed.getByText('YouTube content')).toBeVisible();
	await expect(embed.locator('iframe')).toHaveCount(0);
	await embed.getByRole('button', { name: 'Load private preview' }).click();
	await expect(embed.locator('iframe')).toHaveAttribute(
		'src',
		'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
	);
});

test('keeps Studio actions compact when side panels constrain the canvas', async ({ page }) => {
	await page.setViewportSize({ width: 1200, height: 900 });
	await page.goto('/');
	await page.getByRole('button', { name: 'Open interactive demo' }).click();

	const toolbar = page.locator('.studio-toolbar');
	await expect(page.getByRole('button', { name: 'Undo last change' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Site health: Ready' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Preview site' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Publish' })).toBeVisible();
	const box = await toolbar.boundingBox();
	expect(box!.height).toBeLessThan(70);
});

test('previews reviewed components and applies a real local theme', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Library', exact: true }).click();

	await page.getByRole('button', { name: 'Preview', exact: true }).first().click();
	const componentPreview = page.getByRole('dialog', { name: 'Split Hero' });
	await expect(
		componentPreview.getByText('Give your idea a memorable first impression.')
	).toBeVisible();
	await componentPreview.getByRole('button', { name: 'Add to Home' }).click();

	await expect(
		page.getByLabel('Selected block settings').getByRole('heading', { name: 'Split Hero' })
	).toBeVisible();
	await page.getByRole('button', { name: 'Library', exact: true }).click();
	await page.getByRole('button', { name: 'Themes', exact: true }).click();
	await page.getByRole('button', { name: 'Apply theme', exact: true }).last().click();
	await expect(page.getByText('TEND Docs is now applied to this local draft.')).toBeVisible();
	await expect(page.getByText('Applied to this draft')).toBeVisible();

	await page
		.getByLabel('Sites navigation')
		.getByRole('button', { name: 'Studio', exact: true })
		.click();
	await expect(page.getByLabel('Selected block settings').getByLabel('Theme')).toHaveValue('docs');
});

test('edits a full example site with pages, sections, undo and preview', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Open interactive demo' }).click();

	await expect(page.locator('.canvas-section img').first()).toBeVisible();
	await page.getByRole('button', { name: 'Add page' }).click();
	const addPageDialog = page.getByRole('dialog', { name: 'Add a page' });
	await addPageDialog.getByLabel('Page name').fill('Places');
	await addPageDialog.getByRole('button', { name: 'Add page', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Places', exact: true })).toBeVisible();

	await page.getByRole('button', { name: 'Add section', exact: true }).last().click();
	await page.getByRole('button', { name: /Photo gallery/ }).click();
	await expect(page.getByRole('heading', { name: 'Photo gallery' })).toBeVisible();

	const title = page.getByRole('textbox', { name: 'Title', exact: true });
	await title.fill('Places that made us slow down');
	await expect(page.getByRole('textbox', { name: 'Edit Photo gallery title' })).toHaveText(
		'Places that made us slow down'
	);
	await page.getByRole('button', { name: 'Undo' }).click();
	await expect(title).not.toHaveValue('Places that made us slow down');

	await page.getByRole('button', { name: 'Preview site' }).click();
	await expect(page.getByRole('dialog', { name: 'Full example website preview' })).toBeVisible();
	await expect(page.getByText('Panel-local draft · not published')).toBeVisible();
	await page.getByRole('button', { name: 'Home', exact: true }).last().click();
	await expect(
		page
			.getByRole('dialog', { name: 'Full example website preview' })
			.getByRole('heading', { name: 'Stories, sound & places worth remembering.' })
	).toBeVisible();
});

test('places published posts on a page and opens a real visitor article', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Open interactive demo' }).click();
	await page.getByRole('textbox', { name: 'Edit Latest journal posts title' }).click();

	const inspector = page.getByLabel('Selected block settings');
	await expect(inspector.getByLabel('Post collection')).toHaveValue('journal-posts');
	await inspector.getByLabel('Number of posts').selectOption('1');
	await inspector.getByLabel('Show first').selectOption('featured');

	await page.getByRole('button', { name: 'Preview site' }).click();
	const preview = page.getByRole('dialog', { name: 'Full example website preview' });
	await expect(preview.locator('.post-card h3')).toHaveText('Field Notes from the long way home');
	await expect(preview.getByText('A cabin reading list')).toHaveCount(0);
	await preview.getByRole('button', { name: 'Read story' }).click();
	await expect(
		preview.getByRole('heading', { name: 'Field Notes from the long way home' })
	).toBeVisible();
	await preview.getByRole('button', { name: 'Back to Home' }).click();
	await expect(preview.getByText('Recent stories')).toBeVisible();
});

test('manages page identity and requires named confirmation before removal', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Open interactive demo' }).click();
	await page.getByRole('button', { name: 'About', exact: true }).first().click();

	const inspector = page.getByLabel('Selected block settings');
	const pageName = inspector.getByLabel('Page name');
	await pageName.fill('Our Story');
	await pageName.press('Tab');
	await expect(page.getByRole('button', { name: 'Our Story', exact: true }).first()).toBeVisible();

	const address = inspector.getByLabel('Page address');
	await address.fill('/story');
	await address.press('Tab');
	await expect(address).toHaveValue('/story');

	await inspector.getByRole('button', { name: 'Duplicate page' }).click();
	await expect(page.getByRole('button', { name: 'Our Story copy', exact: true })).toBeVisible();
	await inspector.getByRole('button', { name: 'Remove page' }).click();

	const dialog = page.getByRole('dialog', { name: 'Remove Our Story copy?' });
	await expect(dialog.getByRole('button', { name: 'Remove page' })).toBeDisabled();
	await dialog.getByLabel('Confirmation name').fill('Our Story copy');
	await dialog.getByRole('button', { name: 'Remove page' }).click();
	await expect(page.getByRole('button', { name: 'Our Story copy', exact: true })).toHaveCount(0);
});

test('finds a local site-health issue and returns to the exact editor section', async ({
	page
}) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Open interactive demo' }).click();
	const inspector = page.getByLabel('Selected block settings');
	await inspector.getByLabel('Title').fill('');

	await page.getByRole('button', { name: '1 to review' }).click();
	await expect(page.getByRole('heading', { name: 'A few details need attention.' })).toBeVisible();
	await page.getByRole('button', { name: /Lake hero needs a title/ }).click();

	await expect(page.getByLabel('Selected block settings').getByLabel('Title')).toHaveValue('');
});

test('recovers an unreadable extension-scoped draft without changing source', async ({ page }) => {
	await page.route('**/test-extension/**', async (route) => {
		const filename = new URL(route.request().url()).pathname.split('/').at(-1);
		if (filename !== 'index.js' && filename !== 'style.css') {
			await route.fulfill({ status: 404, body: 'Not found' });
			return;
		}
		await route.fulfill({
			status: 200,
			contentType: filename === 'index.js' ? 'text/javascript' : 'text/css',
			body: await readFile(resolve(extensionDistribution, filename))
		});
	});

	await page.goto('/');
	await page.evaluate(async () => {
		let stored: unknown = { contract: 'invalid-draft' };
		const host = {
			id: 'host.tend.sites',
			storage: {
				get: async () => stored,
				set: async (_key: string, value: unknown) => {
					stored = value;
				},
				delete: async () => {
					stored = null;
				}
			},
			onUnmount() {}
		};
		const extensionUrl = '/test-extension/index.js';
		const extension = await import(/* @vite-ignore */ extensionUrl);
		const container = document.createElement('div');
		document.body.replaceChildren(container);
		await extension.default(host).mount(container);
	});

	await page.getByRole('button', { name: 'Studio', exact: true }).click();
	await expect(page.getByText('Could not save')).toBeVisible();
	await page.getByRole('button', { name: 'Resolve save issue' }).click();
	const dialog = page.getByRole('dialog', { name: 'Your visible work is still here.' });
	await expect(dialog.getByText('No repository or published site will change.')).toBeVisible();
	await dialog.getByRole('button', { name: 'Replace saved copy' }).click();
	await expect(page.getByText('Saved in this panel')).toBeVisible();
});

test('keeps embedded pages spacious without clipping site or library labels', async ({ page }) => {
	await page.route('**/test-extension/**', async (route) => {
		const filename = new URL(route.request().url()).pathname.split('/').at(-1);
		if (filename !== 'index.js' && filename !== 'style.css') {
			await route.fulfill({ status: 404, body: 'Not found' });
			return;
		}
		await route.fulfill({
			status: 200,
			contentType: filename === 'index.js' ? 'text/javascript' : 'text/css',
			body: await readFile(resolve(extensionDistribution, filename))
		});
	});

	await page.setViewportSize({ width: 1600, height: 1000 });
	await page.goto('/');
	await page.evaluate(async () => {
		const host = { id: 'host.tend.sites', onUnmount() {} };
		const extensionUrl = '/test-extension/index.js';
		const extension = await import(/* @vite-ignore */ extensionUrl);
		const container = document.createElement('div');
		document.body.replaceChildren(container);
		await extension.default(host).mount(container);
	});

	const shell = page.locator('.sites-shell.embedded');
	await expect(shell).toBeVisible();
	await expect(page.locator('.project-card .status.live')).toHaveCount(2);
	await expect(page.locator('.project-card .status:not(.live)')).toHaveCount(1);

	const homeLayout = await page.evaluate(() => {
		const shellRect = document.querySelector('.sites-shell.embedded')?.getBoundingClientRect();
		const pageRect = document.querySelector('.sites-shell.embedded .page')?.getBoundingClientRect();
		const labelsFit = [...document.querySelectorAll('.project-card .status')].every((label) => {
			const labelRect = label.getBoundingClientRect();
			const cardRect = label.closest('.project-card')?.getBoundingClientRect();
			return Boolean(
				cardRect && labelRect.left >= cardRect.left && labelRect.right <= cardRect.right
			);
		});
		return {
			contentInset:
				shellRect && pageRect ? pageRect.left - shellRect.left : Number.POSITIVE_INFINITY,
			labelsFit
		};
	});
	expect(homeLayout.contentInset).toBeLessThanOrEqual(20);
	expect(homeLayout.labelsFit).toBe(true);

	await page.getByRole('button', { name: 'Library', exact: true }).click();
	await expect(page.locator('.component-grid .status.live')).toHaveCount(7);
	const libraryLabelsFit = await page.evaluate(() =>
		[...document.querySelectorAll('.component-grid .status')].every((label) => {
			const labelRect = label.getBoundingClientRect();
			const cardRect = label.closest('article')?.getBoundingClientRect();
			return Boolean(
				cardRect && labelRect.left >= cardRect.left && labelRect.right <= cardRect.right
			);
		})
	);
	expect(libraryLabelsFit).toBe(true);
});

test('keeps the embedded Studio canvas between its resizable side panels', async ({ page }) => {
	await page.route('**/test-extension/**', async (route) => {
		const filename = new URL(route.request().url()).pathname.split('/').at(-1);
		if (filename !== 'index.js' && filename !== 'style.css') {
			await route.fulfill({ status: 404, body: 'Not found' });
			return;
		}
		await route.fulfill({
			status: 200,
			contentType: filename === 'index.js' ? 'text/javascript' : 'text/css',
			body: await readFile(resolve(extensionDistribution, filename))
		});
	});

	await page.setViewportSize({ width: 2048, height: 1200 });
	await page.goto('/');
	await page.evaluate(async () => {
		const host = { id: 'host.tend.sites', onUnmount() {} };
		const extensionUrl = '/test-extension/index.js';
		const extension = await import(/* @vite-ignore */ extensionUrl);
		const container = document.createElement('div');
		document.body.replaceChildren(container);
		await extension.default(host).mount(container);
	});
	await page.getByRole('button', { name: 'Studio', exact: true }).click();

	const outline = await page.getByRole('complementary', { name: 'Site outline' }).boundingBox();
	const canvas = await page.locator('.canvas-area').boundingBox();
	const browser = await page.locator('.browser-frame').boundingBox();
	const inspector = await page
		.getByRole('complementary', { name: 'Selected block settings' })
		.boundingBox();
	expect(outline).not.toBeNull();
	expect(canvas).not.toBeNull();
	expect(browser).not.toBeNull();
	expect(inspector).not.toBeNull();
	expect(canvas!.x).toBeGreaterThanOrEqual(outline!.x + outline!.width);
	expect(inspector!.x).toBeGreaterThanOrEqual(canvas!.x + canvas!.width);
	expect(canvas!.width).toBeGreaterThan(700);
	expect(browser!.width).toBeGreaterThan(600);
	expect(browser!.x).toBeGreaterThanOrEqual(canvas!.x);
	expect(browser!.x + browser!.width).toBeLessThanOrEqual(canvas!.x + canvas!.width);
});

test('replaces a stale extension stylesheet before mounting updated code', async ({ page }) => {
	await page.route('**/test-extension/**', async (route) => {
		const filename = new URL(route.request().url()).pathname.split('/').at(-1);
		if (filename !== 'index.js' && filename !== 'style.css') {
			await route.fulfill({ status: 404, body: 'Not found' });
			return;
		}
		await route.fulfill({
			status: 200,
			contentType: filename === 'index.js' ? 'text/javascript' : 'text/css',
			body: await readFile(resolve(extensionDistribution, filename))
		});
	});

	await page.setViewportSize({ width: 1600, height: 1000 });
	await page.goto('/');
	const stylesheetHref = await page.evaluate(async () => {
		const stale = document.createElement('link');
		stale.id = 'host-tend-sites-styles';
		stale.rel = 'stylesheet';
		stale.href = '/test-extension/style.css?v=0.2.3';
		document.head.append(stale);
		const extensionUrl = '/test-extension/index.js?v=0.4.0';
		const extension = await import(/* @vite-ignore */ extensionUrl);
		const container = document.createElement('div');
		document.body.replaceChildren(container);
		await extension.default({ id: 'host.tend.sites', onUnmount() {} }).mount(container);
		return (document.getElementById('host-tend-sites-styles') as HTMLLinkElement | null)?.href;
	});

	expect(stylesheetHref).toContain('/test-extension/style.css?v=0.4.0');
	await page.getByRole('button', { name: 'Studio', exact: true }).click();
	await expect(page.locator('.browser-frame')).toBeVisible();
});

test('mounts and unmounts the packaged extension without leaking its application tree', async ({
	page
}) => {
	await page.route('**/test-extension/**', async (route) => {
		const filename = new URL(route.request().url()).pathname.split('/').at(-1);
		if (filename !== 'index.js' && filename !== 'style.css') {
			await route.fulfill({ status: 404, body: 'Not found' });
			return;
		}
		await route.fulfill({
			status: 200,
			contentType: filename === 'index.js' ? 'text/javascript' : 'text/css',
			body: await readFile(resolve(extensionDistribution, filename))
		});
	});

	await page.goto('/');
	const lifecycle = await page.evaluate(async () => {
		const callbacks: Array<() => void | Promise<void>> = [];
		const host = {
			id: 'host.tend.sites',
			onUnmount(callback: () => void | Promise<void>) {
				callbacks.push(callback);
			}
		};
		const extensionUrl = '/test-extension/index.js';
		const extension = await import(/* @vite-ignore */ extensionUrl);
		const container = document.createElement('div');
		document.body.append(container);

		const first = extension.default(host);
		await first.mount(container);
		const firstMounted = container.textContent?.includes('Sites you own, source and all.') ?? false;
		await Promise.all(callbacks.splice(0).map((callback) => callback()));
		const firstUnmounted = container.childElementCount === 0;

		const second = extension.default(host);
		await second.mount(container);
		const secondMounted =
			container.textContent?.includes('Sites you own, source and all.') ?? false;
		await Promise.all(callbacks.splice(0).map((callback) => callback()));

		return {
			firstMounted,
			firstUnmounted,
			secondMounted,
			secondUnmounted: container.childElementCount === 0,
			stylesheetCount: document.querySelectorAll('#host-tend-sites-styles').length
		};
	});

	expect(lifecycle).toEqual({
		firstMounted: true,
		firstUnmounted: true,
		secondMounted: true,
		secondUnmounted: true,
		stylesheetCount: 1
	});
});
