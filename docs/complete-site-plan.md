# Complete website capability plan

TEND Sites is intentionally easy to begin with, but it must produce a complete, useful website—not
a simplified demo. The ordinary workflow asks only the next understandable question. Advanced
structure, metadata, and evidence remain available when a user needs them.

This plan tracks visitor-facing capabilities separately from host integration. A checked local item
means its model and Studio behavior exist; it does not imply repository writes, preview deployment,
email delivery, analytics, or external service authority.

TEND Sites supports two equal source models: Sites-authored visual projects and developer-authored
custom repositories. Custom sites keep their framework and rendering while Sites generates friendly
editors from explicit content schemas. Hybrid sites may additionally use reviewed portable visual
blocks where an adapter proves safe round-tripping.

## Content and site structure

- [x] Pages with friendly names, unique addresses, duplication, ordering, and protected home-page
      behavior.
- [ ] First-class collections for blog posts, documentation, projects, team members, testimonials,
      events, and other repeatable content.
  - **Complete blog foundation:** Posts now live in a bounded, validated collection with stable IDs,
    unique friendly addresses, featured state, tags, publication state, and forward migration for
    existing local drafts. Additional collection types remain pending.
- [ ] A guided post editor with title, summary, author, publish date, cover image, categories, tags,
      draft/scheduled state, body, related content, and SEO. The default view shows only the fields most
      people need.
  - **Complete editing foundation:** A dedicated Content workspace provides post search, draft and
    published filters, title/address/summary/body/author/tag editing, reader preview, featured state,
    explicit publication state, safe local autosave, and named-confirmation deletion. Host
    scheduling execution, cover-media selection, and relationships remain pending.
  - **Complete editorial-state slice:** Posts can be draft, scheduled, published, or archived. A
    scheduled timestamp is bounded and editable, but is explicitly a local plan until a host
    scheduler exists. Scheduled and archived entries never enter visitor collections or routes.
- [ ] Collection relationships so a home page can show latest posts, featured projects, related
      articles, category groups, and “read more” cards without duplicating content.
- [x] Navigation builder for header, footer, nested menus, external links, social links, and a
      visible not-found page.
  - **Complete primary structure slice:** A dedicated workspace controls ordered header/footer page
    links, safe HTTPS/mail external links, labelled social links, and editable 404 recovery. One
    bounded submenu level renders as accessible desktop and purpose-built mobile navigation;
    removing a parent safely promotes its children.
- [ ] Reusable global sections for headers, footers, announcements, calls to action, and contact
      details, with clear “used on these pages” evidence before editing.
  - **Complete global-shell slice:** Header, footer, optional linked announcement, and not-found
    recovery are shared site structure rather than duplicated page sections.
- [ ] Draft, scheduled, published, archived, and redirect states with truthful visitor behavior.
  - **Complete local content-state slice:** All four post states are editable and only published
    entries appear to visitors. Redirects remain review-only until repository publication exists.

## Visual writing and insertable content

- [x] Direct in-canvas title and paragraph editing with a compact dismissible floating toolbar.
- [x] Portable headings, bold, italic, strikethrough, inline code, bullets, and validated links.
- [x] Typed YouTube, Vimeo, X-post, and Twitch insertion from a normal URL—never pasted script or
      iframe code. Video previews load only after an explicit privacy choice.
- [ ] Numbered lists, block quotes, code blocks, dividers, tables, callouts, footnotes, and undo that
      follows logical editing actions.
- [ ] Repository image insertion by upload, paste, drag, or library selection with required alt
      text, optional caption/credit/link, crop/focal point, and responsive variants.
- [ ] Gallery, comparison, carousel, hero, card grid, feature list, statistics, FAQ/accordion,
      timeline, pricing, team, logo cloud, testimonial, button group, and download blocks.
- [ ] Safe maps, audio, podcast, document, form, newsletter, calendar, and reviewed external-content
      blocks. Providers remain typed and allowlisted; arbitrary scripts stay forbidden.
- [ ] Reviewed typography tokens for role, scale, alignment, emphasis, spacing, and color. Normal
      users choose clear presets; advanced users may inspect the portable token values.
- [ ] Optional raw Markdown view and exact generated-source preview without making either necessary
      for ordinary editing.

## Templates and composition

- [x] Digest-certified starter bundles and a reviewed local component/theme library.
- [ ] Goal-based template gallery for blog, portfolio, documentation, business, landing page,
      newsletter, restaurant, event, community, and personal sites.
- [ ] Full-page and section previews at desktop, tablet, and phone widths before selection.
  - **Complete full-page width slice:** The interactive visitor preview switches between bounded
    desktop, tablet, and phone frames and exposes the mobile navigation composition.
- [ ] Template families with coordinated page types, collection schemas, navigation, sample content,
      and empty states—not merely visual skins.
- [ ] Safe template updates that preserve user content, show structural changes, and allow rollback.
- [ ] Theme tokens for typography, color, spacing, radius, motion, and light/dark modes with contrast
      checks and responsive behavior built in.
- [ ] Community starter repositories for multiple frameworks, with visible publisher/license,
      immutable revisions, certification status, preview evidence, safe updates, and no implicit
      trust from popularity or repository ownership.
- [ ] Declarative collection and field schemas for developer-built sites, including friendly forms,
      validation, relationships, conditional fields, lists/objects, media, and reviewed custom editor
      blocks while keeping renderer code under repository ownership.

## Discovery, SEO, and sharing

- [ ] Site-wide identity: title pattern, description, language, locale, canonical host, social image,
      organization/person identity, favicon, and search-engine visibility.
  - **Complete foundation:** Title pattern, description, primary language, canonical HTTPS origin,
    public identity, and visibility are editable in a focused workspace with old-draft migration.
    Locale and reviewed favicon references are now editable. A repository-backed favicon lifecycle
    and site-wide media picker remain pending.
- [ ] Per-page and per-entry SEO with sensible generated defaults, editable title/description,
      canonical URL, index/follow control, social image, and preview cards.
  - **Complete page and post slice:** Every page and journal entry owns bounded title, description,
    index/follow, social copy, and image settings with live search previews. Repository media
    selection remains pending.
- [ ] Generated `sitemap.xml`, `robots.txt`, RSS/Atom feeds, canonical tags, pagination links, and a
      human-readable search page where the chosen site type needs them.
  - **Complete local generation slice:** Sitemap, robots, and RSS previews are deterministic,
    escaped, exclude hidden pages and draft posts, and remain explicitly non-writing. Repository
    Atom previews now share the same published-entry policy. Repository output, pagination,
    canonical markup, and site search remain pending.
- [ ] Structured data for WebSite, Organization/Person, Article, BreadcrumbList, FAQ, Event,
      Product, and other reviewed page types without unsupported claims.
  - **Complete safe preview slice:** Deterministic JSON-LD previews emit only WebSite, the selected
    Person/Organization identity, and published Article facts already present in the draft.
- [ ] Redirect manager and broken-link report with loop/conflict detection and imported URL history.
  - **Complete local manager slice:** Up to 50 bounded permanent or temporary redirects can be
    edited locally with duplicate-source, loop, and missing internal-target diagnostics. Imported
    URL history and publish execution remain pending.
- [ ] Publish-time checks for missing titles, duplicate descriptions, inaccessible headings, missing
      image descriptions, broken internal links, oversized media, and share-card quality.
  - **Complete local SEO guidance slice:** Invalid canonical origins plus missing site/page
    descriptions appear in Readiness and open the exact SEO setting. Publish-time enforcement and
    the remaining quality checks remain pending.

## Visitor experience

- [ ] Responsive header/navigation, skip links, keyboard focus, reduced motion, high contrast, and
      readable type/spacing across the complete template library.
  - **Complete journal navigation slice:** The visitor journal includes a keyboard-visible skip
    link, semantic breadcrumbs, responsive controls, and explicit focus targets. Complete template
    library coverage, reduced-motion review, and high-contrast certification remain pending.
  - **Complete site-shell navigation slice:** Header/footer links, mobile menu, announcement, and
    missing-page recovery use semantic controls, visible focus, and the component's reduced-motion
    policy. Complete template-library certification remains pending.
- [ ] Fast image delivery, lazy loading, stable layouts, route prefetch policy, and honest Core Web
      Vitals guidance.
- [ ] Site search, category/tag browsing, pagination, breadcrumbs, related content, previous/next
      navigation, share links, and reading-time metadata where appropriate.
  - **Complete journal discovery slice:** Published journal entries now have bounded local search,
    tag counts and filtering, six-item pagination, breadcrumbs, reading time, encoded share
    destinations, related-story ranking, and chronological previous/next navigation.
- [ ] Forms with accessible validation, consent, spam controls, success/failure recovery, and a
      separately authorized delivery destination. Never pretend a message was delivered.
  - **Complete local review slice:** Contact sections expose bounded name, email, message, consent,
    and honeypot inputs; validation is announced accessibly; visitors can review, edit, or reset;
    and mobile preview remains unclipped. Delivery stays explicitly unconnected and performs no
    network request until tend.host grants a separate destination capability.
- [ ] Cookie-free defaults. Analytics, embeds, maps, and marketing integrations disclose external
      requests and require explicit configuration or visitor consent when policy requires it.
- [ ] Purpose-built empty, loading, offline, not-found, maintenance, and error experiences.
  - **Complete journal recovery slice:** Empty filters and missing/unpublished story identities show
    honest recovery actions. Loading, offline, maintenance, and site-wide error states remain
    pending.

## Localization and editorial workflow

- [ ] Side-by-side or focused language editing, fallback visibility, locale-specific addresses,
      alternate-language links, and per-locale SEO/share previews.
- [ ] Author and reviewer roles, assignments, comments, approval, scheduled publication, and an
      understandable revision comparison before repository mutation.
- [ ] Content import for bounded Markdown/MDX and common structured exports with a dry-run report,
      asset inventory, URL mapping, and unresolved-field questions.
- [ ] Export remains ordinary source and assets with no TEND Sites runtime requirement.

## Delivery order

1. Finish the portable rich-text/block model and round-trip tests.
2. Add first-class blog collections and a real post editor.
3. Add post-list/featured-content blocks so the example home page consumes real collection data.
4. Complete repository media selection and accessible image workflows.
5. Build modular site/page SEO workspaces plus sitemap, robots, feeds, redirects, and checks.
6. Expand reviewed templates and component blocks around the stable content contracts.
7. Connect drafts, source changes, isolated previews, and publishing through the existing typed host
   operations, retaining exact review and recovery evidence.

Every stage requires keyboard, screen-reader, mobile/container-width, round-trip, unsafe-input, and
recovery tests before its capability is presented as production-ready.
