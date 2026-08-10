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
	await expect(page.getByLabel('Content overview')).toContainText('1 entries');
});

test('publishing clearly remains non-authoritative', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Studio', exact: true }).click();
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

	const title = page.getByLabel('Title');
	await title.fill('Places that made us slow down');
	await expect(page.getByRole('button', { name: /Places that made us slow down/ })).toBeVisible();
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
