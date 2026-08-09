import { expect, test } from '@playwright/test';

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
	await expect(page.getByText('Saved fixture')).toBeVisible();
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
