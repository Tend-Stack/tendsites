import type { DemoSite } from './demo-site';
import { normalizeCanonicalUrl } from './seo';

export type SiteHealthIssue = {
	code:
		| 'duplicate_address'
		| 'empty_page'
		| 'missing_title'
		| 'missing_body'
		| 'missing_image_alt'
		| 'invalid_canonical_url'
		| 'missing_site_description'
		| 'missing_page_description';
	severity: 'blocker' | 'attention';
	pageId: string;
	sectionId?: string;
	target?: 'studio' | 'site-seo' | 'page-seo';
	title: string;
	guidance: string;
};

export type SiteHealthReport = {
	status: 'ready' | 'needs_attention';
	blockers: number;
	attention: number;
	issues: SiteHealthIssue[];
};

export function assessDemoSiteHealth(site: DemoSite): SiteHealthReport {
	const issues: SiteHealthIssue[] = [];
	const slugOwners = new Map<string, string>();

	if (!normalizeCanonicalUrl(site.seo.canonicalUrl)) {
		issues.push({
			code: 'invalid_canonical_url',
			severity: 'attention',
			pageId: site.pages[0]?.id ?? 'home',
			target: 'site-seo',
			title: 'Website address needs review',
			guidance: 'Add the complete secure https:// address visitors will use.'
		});
	}
	if (!site.seo.description.trim()) {
		issues.push({
			code: 'missing_site_description',
			severity: 'attention',
			pageId: site.pages[0]?.id ?? 'home',
			target: 'site-seo',
			title: 'Site description is empty',
			guidance: 'Explain the site in one clear sentence for search and sharing.'
		});
	}

	for (const page of site.pages) {
		if (page.seo.index && !page.seo.description.trim()) {
			issues.push({
				code: 'missing_page_description',
				severity: 'attention',
				pageId: page.id,
				target: 'page-seo',
				title: `${page.name} needs a search description`,
				guidance: 'Add a short preview that helps someone decide to visit this page.'
			});
		}
		const existingOwner = slugOwners.get(page.slug);
		if (existingOwner && existingOwner !== page.id) {
			issues.push({
				code: 'duplicate_address',
				severity: 'blocker',
				pageId: page.id,
				title: `${page.name} shares an address`,
				guidance: 'Give every page a unique address before publishing.'
			});
		} else {
			slugOwners.set(page.slug, page.id);
		}

		if (page.sections.length === 0) {
			issues.push({
				code: 'empty_page',
				severity: 'blocker',
				pageId: page.id,
				title: `${page.name} has no sections`,
				guidance: 'Add at least one section so visitors have something to see.'
			});
		}

		for (const section of page.sections) {
			if (!section.title.trim()) {
				issues.push({
					code: 'missing_title',
					severity: 'blocker',
					pageId: page.id,
					sectionId: section.id,
					title: `${section.label} needs a title`,
					guidance: 'Write a short heading that explains this section.'
				});
			}
			if (!section.body.trim()) {
				issues.push({
					code: 'missing_body',
					severity: 'attention',
					pageId: page.id,
					sectionId: section.id,
					title: `${section.label} needs supporting text`,
					guidance: 'Add one or two sentences so the section is understandable.'
				});
			}
			if (section.image && !section.imageAlt?.trim()) {
				issues.push({
					code: 'missing_image_alt',
					severity: 'attention',
					pageId: page.id,
					sectionId: section.id,
					title: `${section.label} needs an image description`,
					guidance: 'Describe the meaningful content of the image for screen-reader users.'
				});
			}
		}
	}

	const blockers = issues.filter((issue) => issue.severity === 'blocker').length;
	const attention = issues.length - blockers;
	return {
		status: issues.length === 0 ? 'ready' : 'needs_attention',
		blockers,
		attention,
		issues
	};
}
