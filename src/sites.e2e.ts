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
		page.getByRole('heading', { name: 'We map the content. Your framework stays yours.' })
	).toBeVisible();
	await expect(page.getByLabel('Supported framework detectors').getByText('Astro')).toBeVisible();
	await expect(page.getByLabel('Supported framework detectors').getByText('Jekyll')).toBeVisible();
	await expect(page.getByText('Imported content form')).toBeVisible();
	await expect(
		page.getByText('Provider and publishing settings are deliberately discarded.')
	).toBeVisible();
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
	await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled();
	await expect(page.getByText('Session only')).toBeVisible();
	const saveButtonBox = await page.getByRole('button', { name: 'Save changes' }).boundingBox();
	const saveLabelBox = await page.locator('.save-control small').boundingBox();
	expect(saveButtonBox).not.toBeNull();
	expect(saveLabelBox).not.toBeNull();
	expect(saveLabelBox!.y + saveLabelBox!.height).toBeLessThanOrEqual(saveButtonBox!.y);
	await expect(
		page.getByLabel('Filter posts').getByRole('button', { name: /All/ })
	).toHaveAttribute('aria-pressed', 'true');
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
	await expect(page.getByRole('button', { name: 'Undo last edit' })).toBeEnabled();
	await page.getByRole('button', { name: 'Undo last edit' }).click();
	await expect(page.locator('.post-editor > header h2')).toHaveText('A cabin reading list');
	await expect(page.getByRole('button', { name: 'Redo last edit' })).toBeEnabled();
	await page.getByRole('button', { name: 'Redo last edit' }).click();
	await expect(page.locator('.post-editor > header h2')).toHaveText(
		'Books for a rainy cabin weekend'
	);

	const story = page.getByRole('textbox', { name: 'Story' });
	await story.fill('A useful field note');
	await story.evaluate((element: HTMLTextAreaElement) =>
		element.setSelectionRange(0, element.value.length)
	);
	await page
		.getByRole('toolbar', { name: 'Story formatting tools' })
		.getByRole('button', { name: 'Quote' })
		.click();
	await expect(story).toHaveValue('> A useful field note');
	await expect(page.locator('.post-preview blockquote')).toContainText('A useful field note');

	await story.fill('Lake');
	await story.evaluate((element: HTMLTextAreaElement) =>
		element.setSelectionRange(0, element.value.length)
	);
	await page
		.getByRole('toolbar', { name: 'Story formatting tools' })
		.getByRole('button', { name: 'Table' })
		.click();
	await expect(page.locator('.post-preview table')).toContainText('Lake');

	await story.fill('Remember this');
	await story.evaluate((element: HTMLTextAreaElement) =>
		element.setSelectionRange(0, element.value.length)
	);
	await page
		.getByRole('toolbar', { name: 'Story formatting tools' })
		.getByRole('button', { name: 'Callout' })
		.click();
	await expect(page.locator('.post-preview .markdown-callout')).toContainText('Remember this');

	await story.fill('Field observation');
	await story.evaluate((element: HTMLTextAreaElement) =>
		element.setSelectionRange(0, element.value.length)
	);
	await page
		.getByRole('toolbar', { name: 'Story formatting tools' })
		.getByRole('button', { name: 'Footnote' })
		.click();
	await expect(story).toHaveValue(/Field observation\[\^1\]/);
	await expect(page.locator('.post-preview .footnotes')).toContainText('Footnote details');

	await page.getByLabel('Status').selectOption('published');
	await expect(page.locator('.post-list em.published')).toHaveCount(3);
	await page.getByLabel('Status').selectOption('scheduled');
	await expect(page.getByText(/local editorial plan/)).toBeVisible();
	await page.getByLabel('Planned publication time').fill('2030-01-02T10:30');
	await page.getByLabel('Filter posts').getByRole('button', { name: 'Scheduled' }).click();
	await expect(page.locator('.post-list > button')).toHaveCount(1);
	await page.getByLabel('Status').selectOption('archived');
	await expect(page.getByText(/Archived posts stay editable/)).toBeVisible();
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
	await expect(page.getByText('Take your source with you')).toBeVisible();
	const downloadPromise = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Download source archive' }).click();
	const download = await downloadPromise;
	expect(download.suggestedFilename()).toBe('willow-journal-source.zip');
	await expect(page.getByText(/Downloaded \d+ files with 3 portable media items/)).toBeVisible();
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

test('edits search identity, page metadata, sharing previews, and generated files locally', async ({
	page
}) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Search and sharing' }).click();
	await expect(
		page.getByRole('heading', { name: 'Help people find and trust your site.' })
	).toBeVisible();
	await page
		.getByRole('button', { name: /Site identity/ })
		.first()
		.click();
	await page
		.getByLabel('Site description')
		.fill('A thoughtful journal for slow travel and field notes.');
	await page.getByLabel('Regional locale').fill('en-CA');
	await page.getByLabel('Browser icon').fill('https://willow.example/favicon.png');
	await page.getByRole('button', { name: /Pages/ }).click();
	await page.getByRole('button', { name: /About/ }).click();
	await page.getByLabel('Search title').fill('Meet Willow');
	await expect(page.getByText('Meet Willow · Willow Journal')).toBeVisible();
	await page.getByRole('button', { name: /Posts/ }).click();
	await page
		.getByLabel('Posts')
		.getByRole('button', { name: /Morning at the lake/ })
		.click();
	await page.getByLabel('Search title').fill('Sunrise at the lake');
	await expect(page.getByText('Sunrise at the lake · Willow Journal')).toBeVisible();
	await page.getByRole('button', { name: /Sharing preview/ }).click();
	await page.getByLabel('Sharing title').fill('A quieter way to travel');
	await expect(page.getByText('A quieter way to travel')).toBeVisible();
	await page.getByRole('button', { name: /Redirects/ }).click();
	await page.getByRole('button', { name: 'Add redirect' }).click();
	await page.getByLabel('Old address').fill('/journal-old');
	await page.getByLabel('New address').fill('/journal');
	await expect(page.getByText('does not match a page or post')).not.toBeVisible();
	await page.getByRole('button', { name: /Generated files/ }).click();
	await expect(page.getByText('TEND Sites has not written or published them.')).toBeVisible();
	await expect(page.getByText('robots.txt')).toBeVisible();
	await expect(page.getByText('sitemap.xml', { exact: true })).toBeVisible();
	await expect(page.getByText('atom.xml', { exact: true })).toBeVisible();
	await expect(page.getByText('structured-data.json', { exact: true })).toBeVisible();
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
	await page.locator('.topbar').getByRole('button', { name: 'Library', exact: true }).click();

	await page.getByRole('button', { name: 'Preview', exact: true }).first().click();
	const componentPreview = page.getByRole('dialog', { name: 'Split Hero' });
	await expect(
		componentPreview.getByText('Give your idea a memorable first impression.')
	).toBeVisible();
	await componentPreview.getByRole('button', { name: 'Add to Home' }).click();

	await expect(
		page.getByLabel('Selected block settings').getByRole('heading', { name: 'Split Hero' })
	).toBeVisible();
	await page.locator('.topbar').getByRole('button', { name: 'Library', exact: true }).click();
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
	await expect(preview.getByText(/min read/).first()).toBeVisible();
	await expect(preview.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
	await expect(preview.getByRole('region', { name: 'Share this story' })).toBeVisible();
	await expect(preview.getByRole('heading', { name: 'Related stories' })).toBeVisible();
	await preview
		.getByRole('navigation', { name: 'Breadcrumb' })
		.getByRole('button', { name: 'Journal', exact: true })
		.click();
	await expect(preview.getByLabel('Search the journal')).toBeVisible();
	await preview.getByLabel('Search the journal').fill('loons');
	await expect(preview.getByRole('heading', { name: 'Morning at the lake' })).toBeVisible();
	await expect(
		preview.getByRole('heading', { name: 'Field Notes from the long way home' })
	).toHaveCount(0);
	await preview.getByRole('button', { name: 'Clear filters' }).click();
	await preview.getByRole('button', { name: /Slow travel/ }).click();
	await expect(preview.getByLabel('Journal stories').getByRole('article')).toHaveCount(2);
});

test('reviews an accessible visitor form without claiming delivery', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await page.getByRole('button', { name: 'Open interactive demo' }).click();
	await page.getByRole('button', { name: 'Preview site' }).click();

	const preview = page.getByRole('dialog', { name: 'Full example website preview' });
	await preview.getByRole('button', { name: 'About', exact: true }).click();
	const form = preview.getByRole('form', { name: 'Contact Willow' });
	await expect(form).toBeVisible();

	await form.getByRole('button', { name: 'Review message' }).click();
	await expect(form.getByRole('alert')).toContainText('nothing was sent');
	await expect(form.getByLabel('Name')).toHaveAttribute('aria-invalid', 'true');

	await form.getByLabel('Name').fill('Willow Hart');
	await form.getByLabel('Email').fill('willow@example.com');
	await form
		.locator('textarea[name="message"]')
		.fill('Could you share the route from your latest journal?');
	await form.getByRole('checkbox').check();
	await form.getByRole('button', { name: 'Review message' }).click();

	await expect(preview.getByText('Delivery destination not connected')).toBeVisible();
	await expect(preview.getByText(/No message was sent/)).toBeVisible();
	await preview.getByRole('button', { name: 'Edit message' }).click();
	await expect(form.getByLabel('Name')).toHaveValue('Willow Hart');
	await form.getByRole('button', { name: 'Review message' }).click();
	await preview.getByRole('button', { name: 'Start over' }).click();
	await expect(form.getByLabel('Name')).toHaveValue('');

	const overflows = await preview
		.locator('.full-demo-site')
		.evaluate((element) => element.scrollWidth > element.clientWidth);
	expect(overflows).toBe(false);
});

test('builds responsive site navigation, announcements, footer links, and 404 recovery', async ({
	page
}) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto('/');
	await page.getByRole('button', { name: 'Open interactive demo' }).click();
	await page.getByLabel('Sites navigation').getByRole('button', { name: 'Structure' }).click();

	const structureNav = page.getByRole('navigation', { name: 'Site structure settings' });
	await structureNav.getByRole('button', { name: 'Header' }).click();
	await page
		.getByLabel('Available pages')
		.getByRole('button', { name: 'About', exact: true })
		.click();
	const headerExternal = page.locator('.add-link-card').first();
	await headerExternal.getByLabel('Label').fill('Field guide');
	await headerExternal.getByLabel('Destination').fill('http://unsafe.example');
	await headerExternal.getByRole('button', { name: 'Add link' }).click();
	await expect(headerExternal.getByRole('alert')).toContainText('secure HTTPS');
	await headerExternal.getByLabel('Destination').fill('https://example.com/field-guide');
	await headerExternal.getByRole('button', { name: 'Add link' }).click();
	await page.getByLabel('Menu level for Field guide').selectOption({ label: 'Under Journal' });

	await structureNav.getByRole('button', { name: 'Footer' }).click();
	const social = page.locator('.settings-card').last().locator('.add-link-card');
	await social.getByLabel('Label').fill('Bluesky');
	await social.getByLabel('Destination').fill('https://bsky.app/profile/example.com');
	await social.getByRole('button', { name: 'Add profile' }).click();

	await structureNav.getByRole('button', { name: 'Announcement' }).click();
	await page.getByRole('checkbox', { name: /Show announcement/ }).check();
	await page.getByLabel('Message').fill('A new field guide is ready.');
	await page.getByLabel('Optional destination').fill('/journal');
	await page.getByLabel('Optional destination').press('Tab');

	await structureNav.getByRole('button', { name: 'Not found' }).click();
	await page.getByLabel('Heading').fill('This trail ends here.');
	await page.getByLabel('Button label').fill('Back to the journal');

	await page.getByLabel('Sites navigation').getByRole('button', { name: 'Studio' }).click();
	await page.getByRole('button', { name: 'Preview site' }).click();
	const preview = page.getByRole('dialog', { name: 'Full example website preview' });
	await expect(preview.getByText('A new field guide is ready.')).toBeVisible();
	await expect(
		preview.locator('.visitor-desktop-nav').getByRole('button', { name: 'About', exact: true })
	).toHaveCount(0);
	await preview.getByLabel('Open Journal submenu').click();
	await expect(preview.getByRole('link', { name: 'Field guide' })).toHaveAttribute(
		'href',
		'https://example.com/field-guide'
	);
	await expect(preview.getByRole('link', { name: 'Field guide' })).toBeVisible();
	await expect(preview.getByRole('link', { name: 'Bluesky' })).toHaveAttribute(
		'href',
		'https://bsky.app/profile/example.com'
	);

	await preview.getByRole('button', { name: 'phone preview' }).click();
	await expect(preview.locator('.visitor-mobile-nav')).toBeVisible();
	await preview.locator('.visitor-mobile-nav').getByText('Menu', { exact: true }).click();
	await expect(preview.locator('.visitor-mobile-submenu').getByText('Field guide')).toBeVisible();
	await preview.getByLabel('Preview experience').selectOption('not-found');
	await expect(preview.getByRole('heading', { name: 'This trail ends here.' })).toBeVisible();
	await preview.getByRole('button', { name: 'Back to the journal' }).click();
	await expect(
		preview.getByRole('heading', { name: 'Stories, sound & places worth remembering.' })
	).toBeVisible();
});

test('customizes truthful loading, offline, maintenance, and error experiences', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/');
	await page.getByRole('button', { name: 'Open interactive demo' }).click();
	await page.getByLabel('Sites navigation').getByRole('button', { name: 'Structure' }).click();
	await page
		.getByRole('navigation', { name: 'Site structure settings' })
		.getByRole('button', { name: 'System pages' })
		.click();

	await page.getByLabel('Offline heading').fill('This trail is temporarily offline.');
	await page.getByLabel('Offline action').fill('Check again');
	await expect(page.getByLabel('Offline page preview')).toContainText(
		'This trail is temporarily offline.'
	);

	await page.getByLabel('Sites navigation').getByRole('button', { name: 'Studio' }).click();
	await page.getByRole('button', { name: 'Preview site' }).click();
	const preview = page.getByRole('dialog', { name: 'Full example website preview' });
	const experience = preview.getByLabel('Preview experience');
	await experience.selectOption('offline');
	await expect(
		preview.getByRole('heading', { name: 'This trail is temporarily offline.' })
	).toBeVisible();
	await preview.getByRole('button', { name: 'Check again' }).click();
	await expect(
		preview.getByRole('heading', { name: 'Stories, sound & places worth remembering.' })
	).toBeVisible();

	await experience.selectOption('loading');
	await expect(preview.getByRole('heading', { name: 'Gathering the next page…' })).toBeVisible();
	await experience.selectOption('maintenance');
	await expect(preview.getByText('Please check back soon.')).toBeVisible();
	await experience.selectOption('error');
	await expect(preview.getByRole('button', { name: 'Reload page' })).toBeVisible();
	await preview.getByRole('button', { name: 'phone preview' }).click();
	await expect(preview.locator('.visitor-system-page.error')).toBeVisible();
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
		(window as Window & { __tendDraftWrites?: number }).__tendDraftWrites = 0;
		const host = {
			id: 'host.tend.sites',
			storage: {
				get: async () => stored,
				set: async (_key: string, value: unknown) => {
					stored = value;
					const testWindow = window as Window & { __tendDraftWrites?: number };
					testWindow.__tendDraftWrites = (testWindow.__tendDraftWrites ?? 0) + 1;
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
	await page.getByRole('button', { name: 'Content', exact: true }).click();
	const writesBeforeManualSave = await page.evaluate(
		() => (window as Window & { __tendDraftWrites?: number }).__tendDraftWrites ?? 0
	);
	await page.getByRole('button', { name: 'Save changes' }).click();
	await expect
		.poll(async () =>
			page.evaluate(
				() => (window as Window & { __tendDraftWrites?: number }).__tendDraftWrites ?? 0
			)
		)
		.toBeGreaterThan(writesBeforeManualSave);
	await expect(page.getByText('Autosaved')).toBeVisible();
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
	await expect(page.locator('.project-card .sites-badge--positive')).toHaveCount(2);
	await expect(page.locator('.project-card .sites-badge:not(.sites-badge--positive)')).toHaveCount(
		1
	);

	const homeLayout = await page.evaluate(() => {
		const shellRect = document.querySelector('.sites-shell.embedded')?.getBoundingClientRect();
		const pageRect = document.querySelector('.sites-shell.embedded .page')?.getBoundingClientRect();
		const labelsFit = [...document.querySelectorAll('.project-card .sites-badge')].every(
			(label) => {
				const labelRect = label.getBoundingClientRect();
				const cardRect = label.closest('.project-card')?.getBoundingClientRect();
				return Boolean(
					cardRect && labelRect.left >= cardRect.left && labelRect.right <= cardRect.right
				);
			}
		);
		return {
			contentInset:
				shellRect && pageRect ? pageRect.left - shellRect.left : Number.POSITIVE_INFINITY,
			labelsFit
		};
	});
	expect(homeLayout.contentInset).toBeLessThanOrEqual(20);
	expect(homeLayout.labelsFit).toBe(true);
	await page.setViewportSize({ width: 1100, height: 900 });
	await expect(page.locator('.project-card .sites-badge')).toHaveCount(3);
	expect(
		await page.evaluate(() =>
			[...document.querySelectorAll('.project-card .sites-badge')].every((label) => {
				const labelRect = label.getBoundingClientRect();
				const cardRect = label.closest('.project-card')?.getBoundingClientRect();
				return Boolean(
					cardRect && labelRect.left >= cardRect.left && labelRect.right <= cardRect.right
				);
			})
		)
	).toBe(true);

	await page.getByRole('button', { name: 'Readiness', exact: true }).click();
	await expect(page.getByText('5 verified checks')).toBeVisible();
	expect(
		await page.evaluate(() => {
			const shell = document.querySelector('.sites-shell.embedded')?.getBoundingClientRect();
			const pageRect = document.querySelector('.readiness-page')?.getBoundingClientRect();
			const badge = document.querySelector('.foundation-count')?.getBoundingClientRect();
			const tabs = [...document.querySelectorAll('.readiness-tabs button')];
			return Boolean(
				shell &&
				pageRect &&
				badge &&
				pageRect.left >= shell.left &&
				pageRect.right <= shell.right &&
				badge.left >= pageRect.left &&
				badge.right <= pageRect.right &&
				tabs.every((tab) => {
					const rect = tab.getBoundingClientRect();
					return rect.left >= pageRect.left && rect.right <= pageRect.right;
				})
			);
		})
	).toBe(true);

	await page.locator('.topbar').getByRole('button', { name: 'Library', exact: true }).click();
	await expect(page.locator('.component-grid .sites-badge--positive')).toHaveCount(7);
	const libraryLabelsFit = await page.evaluate(() =>
		[...document.querySelectorAll('.component-grid .sites-badge')].every((label) => {
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

test('selects an accessible cover image through the packaged tend.host Files bridge', async ({
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
	await page.evaluate(async () => {
		let stored: unknown = null;
		const image =
			'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="640" height="480"%3E%3Crect width="640" height="480" fill="%23215d49"/%3E%3C/svg%3E';
		const extensionUrl = '/test-extension/index.js?v=media';
		const extension = await import(/* @vite-ignore */ extensionUrl);
		const container = document.createElement('div');
		document.body.replaceChildren(container);
		await extension
			.default({
				id: 'host.tend.sites',
				onUnmount() {},
				storage: {
					async get() {
						return stored;
					},
					async set(_key: string, value: unknown) {
						stored = value;
						(window as Window & { __tendSitesDraft?: unknown }).__tendSitesDraft = value;
					},
					async delete() {
						stored = null;
					}
				},
				files: {
					async listImageLibraries() {
						return [{ id: 'photos', name: 'Photos', itemCount: 1 }];
					},
					async listImages() {
						return {
							items: [
								{
									id: 'lake',
									libraryId: 'photos',
									name: 'quiet-lake.jpg',
									mimeType: 'image/jpeg',
									size: 2048,
									modifiedAt: 1,
									description: '',
									thumbnailUrl: image,
									contentUrl: image
								}
							],
							total: 1,
							nextCursor: null
						};
					}
				},
				media: {
					async prepareImage(file: File) {
						return {
							dataUrl: image,
							mimeType: 'image/webp' as const,
							size: 1024,
							width: 1600,
							height: 900,
							originalName: file.name,
							originalSize: file.size
						};
					}
				}
			})
			.mount(container);
	});

	await page.getByRole('button', { name: 'Content', exact: true }).click();
	await page.getByRole('button', { name: 'Replace image' }).click();
	await expect(page.getByRole('heading', { name: 'Prepare a cover image' })).toBeVisible();
	const mediaDialog = page.getByRole('dialog', { name: 'Prepare a cover image' });
	const libraryControlBox = await mediaDialog.getByLabel('Library').boundingBox();
	const searchControlBox = await mediaDialog.getByLabel('Search').boundingBox();
	expect(libraryControlBox).not.toBeNull();
	expect(searchControlBox).not.toBeNull();
	expect(Math.abs(libraryControlBox!.y - searchControlBox!.y)).toBeLessThanOrEqual(1);
	await page.getByRole('button', { name: 'quiet-lake.jpg' }).click();
	await expect(page.getByRole('heading', { name: 'Frame the cover' })).toBeVisible();
	await expect(page.locator('.large-canvas .thirds')).toHaveCount(0);
	await page.getByRole('button', { name: 'Show crop guide' }).click();
	await expect(page.locator('.large-canvas .thirds')).toHaveCount(1);
	expect(
		await page.evaluate(() => {
			const preview = document.querySelector('.large-canvas')?.getBoundingClientRect();
			const guide = document.querySelector('.large-canvas .thirds')?.getBoundingClientRect();
			return Boolean(
				preview &&
				guide &&
				preview.width >= 700 &&
				guide.left >= preview.left &&
				guide.top >= preview.top &&
				guide.right <= preview.right &&
				guide.bottom <= preview.bottom
			);
		})
	).toBe(true);
	await page.getByLabel('Zoom').fill('1.5');
	await expect(page.locator('.large-canvas img')).toHaveCSS('transform', /matrix\(1\.5/);
	await page.getByLabel('Horizontal focal point').fill('75');
	await expect(page.locator('.large-canvas img')).toHaveCSS('object-position', '75% 50%');
	const cropCanvas = await page.locator('.large-canvas').boundingBox();
	expect(cropCanvas).not.toBeNull();
	await page.mouse.move(
		cropCanvas!.x + cropCanvas!.width / 2,
		cropCanvas!.y + cropCanvas!.height / 2
	);
	await page.mouse.down();
	await page.mouse.move(
		cropCanvas!.x + cropCanvas!.width / 2 - 80,
		cropCanvas!.y + cropCanvas!.height / 2
	);
	await page.mouse.up();
	await expect(page.getByLabel('Horizontal focal point')).not.toHaveValue('75');
	await page.getByLabel('Horizontal focal point').fill('75');
	await page.getByRole('button', { name: /Square · 1:1/ }).click();
	await expect(page.getByRole('button', { name: 'Use image' })).toBeDisabled();
	await page.getByLabel('Image description').fill('A quiet green lake at dawn');
	await page.getByRole('button', { name: 'Use image' }).click();
	await expect(page.getByText('Connected preview · repository copy pending')).toBeVisible();
	await expect(page.getByAltText('A quiet green lake at dawn')).toBeVisible();
	await expect(page.getByText('Autosaved')).toBeVisible();
	await expect
		.poll(() =>
			page.evaluate(() => {
				const envelope = (window as Window & { __tendSitesDraft?: unknown }).__tendSitesDraft as {
					site?: { collections?: Array<{ items?: Array<{ coverImagePresentation?: unknown }> }> };
				};
				return envelope?.site?.collections?.[0]?.items?.[0]?.coverImagePresentation;
			})
		)
		.toMatchObject({ aspect: 'square', fit: 'cover', focalX: 75, focalY: 50, zoom: 1.5 });

	await page.getByRole('button', { name: 'Replace image' }).click();
	await page.getByRole('button', { name: /Upload new/ }).click();
	await page
		.locator('input[type="file"]')
		.last()
		.setInputFiles({
			name: 'new-cover.png',
			mimeType: 'image/png',
			buffer: Buffer.from('safe-image-fixture')
		});
	await page.getByLabel('Image description').fill('A newly uploaded editorial cover');
	await page.getByRole('button', { name: 'Use image' }).click();
	await expect(page.getByText('Optimized upload · saved with this draft')).toBeVisible();
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
