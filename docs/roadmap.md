# Roadmap

Completion is measured only from the top-level product milestones below. Nested bullets record evidence and remaining integration without double-counting a milestone. Completed items have code and proportional tests; planned items do not imply product authority exists.

## 0. Repository foundation — in progress

- [x] Independent `Tend-Stack/tendsites` repository and toolchain.
- [x] Strict v1 project/change/preview/publish/theme/component contracts.
- [x] Portable content, media, `tend.site.json`, and AI-proposal contracts.
- [x] Immutable starter metadata and exact revision/file-digest selection.
- [x] Source snapshot, trust-policy, and adoption-report contracts with no secret or production authority.
- [x] Deterministic review-only creation plans and explicit non-applying change previews.
- [x] Portable content, locale, collection, draft, and navigation indexing.
- [x] Lockfile-aware package-manager adapter.
- [x] Pure bounded SvelteKit compatibility inspector with canonical path and lockfile rejection.
- [x] Framework-neutral custom-site and community-starter review contracts.
  - **Complete:** Repository-owned rendering, explicit Markdown/MDX-compatible/JSON/YAML/TOML
    collection mappings, visual-vs-content-only mode, immutable starter commit/tree evidence,
    publisher/license/trust identity, and review gating with no checkout or execution authority.
- [x] Customer-controlled source location, resumable-draft retention, and durability contracts.
  - **Complete:** One canonical adapter distinguishes customer-server repositories, external Git,
    customer repository adapters, and an explicitly consented optional managed vault. Draft leases
    are encrypted, byte/time bounded, noncanonical, and require every terminal purge event.
    Revision-bound evidence derives `protected`, `external_repository`, `versioned_only`, or
    `at_risk` without treating containers, artifacts, successful deploys, or local history as backup.
  - **Complete host persistence foundation:** tend.host now binds one canonical source to an exact
    same-user/project accepted creation operation and persists one current Fernet-encrypted draft
    snapshot with canonical lease evidence, digest/byte validation, 25 MB project quota, seven-day
    retention, monotonic replacement, restart recovery, and terminal ciphertext purge.
  - **Pending integration:** Deliver these route-free capabilities to the mounted extension, connect
    customer-owned backup evidence and restore drills, and expose the truthful durability state in
    the project overview.
- [x] Modular, responsive, read-only Studio foundation.
- [x] tend.host extension v2 packaging with generated integrity.
- [x] Install the produced ZIP in an isolated tend.host fixture and verify mount/unmount cleanup.
  - **Complete:** The exact packaged ZIP passes tend.host schema-2 install, runtime-integrity, scoped-storage, uninstall, and filesystem cleanup checks in a disposable data directory. Browser tests mount/unmount the built module twice and prove application-tree cleanup plus stylesheet deduplication.

## 1. Create and adopt

- [x] Reviewed starter catalog and immutable template revisions.
  - **Complete:** Strict catalog/revision/file manifests and four digest-certified source bundles.
- [ ] Friendly five-step creation workflow backed by a durable host operation.
  - **Complete:** Deterministic review plan shown in the five-step workflow.
  - **Complete:** Exact-plan creation intent and shared canonical/idempotent host-operation request/evidence contracts.
  - **Complete integration seam:** tend.host packages the exact reviewed 0.1.0
    extension and has a route-free durable admission ledger for short-lived,
    user/project/version-bound `site.create` contexts. Canonical requests are
    accepted idempotently; drift, expiry, and modified extension bytes fail
    closed.
  - **Pending:** Deliver the assigned context to the mounted extension and
    execute an accepted plan through a separately reviewed host worker. No
    source creation is currently enabled.
- [ ] Existing-repository analyzer with bounded checkout and compatibility report.
  - **Complete:** Pure snapshot classification and compatibility report.
  - **Complete:** Opaque repository selector, bounded disposable-checkout intent, host-only credential policy, and strict cleanup result.
  - **Pending:** Authenticated, digest-bound, bounded checkout supplied by the host.
  - **Complete product path:** The adoption workspace now explains visual, custom headless, and hybrid
    modes; previews an exact content-only mapping that preserves the site's renderer; and presents
    reviewed versus unavailable community starters without pretending to clone or create them.
- [x] Framework adapter and declarative content-schema catalog.
  - **Complete:** Versioned custom-site profiles and structured field mappings are strict, bounded,
    path-confined, and framework-neutral. A pure bounded detector recognizes SvelteKit, Astro,
    Eleventy, Next.js, Nuxt, Hugo, Jekyll, and explicit custom manifests, fails closed on ambiguity,
    and can neither execute nor acquire repository authority.
  - **Complete:** Declarative field and reviewed editor-block schemas generate bounded forms without
    executable scripts. Common Git-CMS collection configurations can be imported while provider,
    workflow, deployment, and authentication settings are explicitly discarded. The adoption
    workspace previews the detected adapters and resulting friendly content form.
  - **Integration remains under separate milestones:** Authenticated checkout, repository writes,
    build execution, and publish authority remain host capabilities and are not granted here.
- [ ] Community starter repository catalog and certification lane.
  - **Complete foundation:** Immutable repository identity, publisher, license, framework, content
    formats, goals, review status, and fail-closed selection assessment.
  - **Pending:** Provider-backed discovery, maintainer verification, certification evidence, preview,
    version updates, deprecation, reports, and host-authorized creation.
- [x] Explicit change-set preview before the first commit.
  - **Complete:** Impact counts, canonical ordering, readable field diffs, destructive-review flags, and no-apply boundaries.
  - **Pending integration:** Supply the preview from host-verified repository evidence.
- [x] Source-snapshot integrity, fork/PR trust policy, and secret denial.
  - **Complete:** Expiring provider/repository/commit/tree/archive evidence and safe default policy.
  - **Pending integration:** Host-side acquisition, digest verification, and protected-context enforcement.

## 2. Content Studio

- [x] Pages, posts, docs, media, navigation, and localization adapters.
  - **Complete:** Content/locale/collection/draft/navigation indexing plus deterministic Markdown/JSON-frontmatter serialization.
  - **Complete read-only host slice:** With explicit `files.read` consent, the Content workspace can
    browse sanitized owner-scoped tend.host Files images, require alt text, and retain an opaque
    selected reference for the local draft preview.
  - **Pending integration:** Host-backed source read/write adapters plus reviewed copying of selected
    Files images into canonical repository source.
- [x] Autosave drafts separated from committed source.
  - **Complete:** Monotonic draft revision, exact retry, stale-base conflict, and bounded undo contracts.
  - **Complete local preview:** Versioned extension-scoped draft storage migrates
    the earlier bare-site shape and serializes rapid saves so older writes cannot
    replace newer edits.
  - **Complete recovery UX:** Failed or unreadable local saves preserve the visible
    draft and expose explicit retry or local-copy replacement without touching a
    repository or published site.
  - **Complete host persistence foundation:** The route-free host service persists the exact public
    lease and encrypted snapshot under its actor/source/base revision. Browser delivery and source
    commit remain pending and no draft is canonical source.
- [x] Accessible block canvas with schema-driven inspector.
- [x] Safe local page and section management.
  - **Complete:** Friendly unique addresses, page duplication, protected home
    and last-section invariants, named destructive confirmation, and session undo.
- [x] Local site-health guidance with direct remediation.
  - **Complete:** Copy, structure, unique-address, and image-description checks
    link back to the exact page or section without claiming publish authority.
- [x] Responsive/mobile editing model and keyboard navigation.
  - **Complete current slice:** Main navigation and Studio actions use descriptive icons with
    accessible names; labels collapse by extension/canvas container width instead of wrapping into
    unusable controls when a desktop panel is resized.
- [x] Resizable desktop Studio panels and direct local canvas editing.
  - **Complete foundation:** Outline and Inspector widths have bounded drag handles, section copy
    can be edited directly on the canvas, and a compact writing toolbar expands only when needed.
  - **Complete local rich-text slice:** Focusing a title or paragraph opens a dismissible contextual
    toolbar for emphasis, strikethrough, inline code, headings, lists, safe web/email/site links,
    typed external-content insertion, and clear formatting. Drafts retain a bounded Markdown subset,
    raw HTML is escaped, and pasted HTML is reduced to plain text.
  - **Complete structured-writing slice:** The focused post composer adds accessible selection-aware
    actions for numbered and bulleted lists, quotes, fenced code, dividers, links, headings, and
    emphasis. The shared renderer safely projects those ordinary Markdown structures in both Studio
    and visitor views while escaping raw HTML.
  - **Complete typed embed slice:** A normal YouTube, Vimeo, X-post, or Twitch link creates a typed
    responsive section. Arbitrary embed code and scripts are rejected; supported video previews use
    reviewed player origins and load only after an explicit privacy choice.
  - **Pending:** Stable rich-text node IDs, tables, callouts, footnotes, repository media, reviewed
    typography tokens, cross-block selection, and selection-aware history in
    [`rich-editor-plan.md`](rich-editor-plan.md).
- [ ] Complete visitor-facing site capability set.
  - **Plan:** Blog collections/post editing, reusable blocks, cross-content previews, templates,
    navigation, media, forms, SEO/share metadata, sitemap/robots/feeds, redirects, structured data,
    accessibility, performance, localization, and editorial workflow are mapped in
    [`complete-site-plan.md`](complete-site-plan.md).
  - **Complete blog foundation:** The local site draft now owns validated post collections, migrates
    older drafts forward, and exposes a focused Content workspace for searching, creating, editing,
    featuring, publishing, previewing, and safely deleting posts.
  - **Complete collection-fed visitor slice:** Studio can place a reusable Latest Posts section,
    choose its collection, order featured/newest posts, and show one to six responsive cards.
    Draft posts are excluded, empty collections explain the next step, and visitor preview opens a
    real article view with a clear return path.
  - **Complete search-and-sharing foundation:** A distinct, responsive workspace now manages
    site identity, canonical HTTPS origin, language and visibility; per-page search titles,
    descriptions and index/follow choices; editable social previews; and deterministic local
    previews of `sitemap.xml`, `robots.txt`, and RSS. Existing v0.8 drafts migrate to safe generated
    defaults, and Readiness issues deep-link to the exact site or page setting. These previews do
    not write files, submit search indexes, or publish a site.
  - **Complete discovery extension:** Locale and favicon identity, per-post search controls, Atom
    and schema.org previews, plus a redirect workspace with duplicate, loop, and missing-target
    diagnostics now live in the Sites component itself. Existing v0.9 drafts migrate forward.
  - **Complete visitor-journal extension:** The real visitor preview now includes local search, tag
    browsing, pagination, breadcrumbs, reading time, encoded share destinations, related stories,
    previous/next navigation, a skip link, and honest empty/not-found recovery.
  - **Complete visitor-form foundation:** Studio owns editable consent and destination-status copy,
    while the responsive visitor preview provides bounded accessible validation, an inert spam
    honeypot, explicit consent, review-before-send, and edit/reset recovery. The current form never
    claims delivery or performs a network request; an assigned delivery capability remains pending.
  - **Complete site-structure foundation:** A distinct Structure workspace manages ordered
    header/footer page links, allowlisted external and social links, an optional linked announcement,
    and editable not-found recovery. Visitor preview renders this shell with desktop, tablet, phone,
    and purpose-built mobile navigation states; Readiness deep-links structure diagnostics.
  - **Complete nested-navigation slice:** Header and footer links support one deliberately bounded
    submenu level with sibling-aware ordering, safe parent removal, desktop disclosure controls,
    mobile indentation, and strict rejection of missing parents, cycles, duplicate IDs, or deeper trees.
  - **Complete visitor-system-state slice:** A focused Structure tab customizes loading, offline,
    maintenance, and error experiences with bounded migration-safe copy, responsive previews,
    reduced-motion handling, and explicit disclosure that host runtime wiring remains separate.
  - **Complete editorial-lifecycle foundation:** Posts now support draft, scheduled, published, and
    archived states with forward migration, bounded planned timestamps, dedicated filters, and
    explicit non-executing schedule guidance. Only published entries reach visitor collections.
  - **Pending:** Scheduling, repository persistence, deployment, and the remaining visitor
    capability plan.
- [x] Undo history and clear conflict resolution.
- [x] Repository media lifecycle with accessible variants.
  - **Complete:** Digest-bound assets, localized alt text, deterministic variants, and review-only upload/retain/transform/remove plans.
  - **Complete connected picker:** A sealed, read-only tend.host Files bridge exposes sanitized image
    choices without provider paths or mutation authority and blocks cover selection until alt text exists.
  - **Pending integration:** Copy a selected item into repository source and execute lifecycle plans
    through a separately assigned mutation capability.
- [x] Localization coverage and reviewed translation workflow.
  - **Complete:** Coverage reports and source-bound manual/user-configured-AI proposals.
  - **Pending integration:** Persist approved translations through repository change operations.

## 3. Isolated previews

- [ ] Separate-origin preview service with no panel credentials.
  - **Complete:** Exact source/change/policy execution intent with project/revision binding and structurally absent panel/deployment authority.
  - **Pending:** Durable host queue, isolated execution, separate-origin routing, and retained evidence.
- [x] Resource, time, network, and storage limits.
- [x] Frozen installs and truthful required-check evidence.
  - **Complete:** Separate-origin resource policy and required-check assessment with no deploy authority.
  - **Pending integration:** Execute isolated previews and retain bounded evidence through durable host jobs.
- [x] Preview supersession, expiry, cleanup, and recovery.
  - **Complete:** Generation, supersession, expiry, and cleanup-eligibility evidence.
  - **Pending integration:** Perform reference-aware cleanup through the host.

## 4. Publishing and domains

- [ ] Reviewable commit plan and durable publish operation.
  - **Complete:** The immutable non-committing plan plus an assigned-deployment execution intent bound to explicit review and health-gated prior-artifact retention.
  - **Pending:** Durable host execution and evidence persistence.
- [ ] Build-once artifact identity and deployment handoff.
  - Commit/recipe/platform/SBOM/provenance artifact identity is complete; handoff remains pending.
- [ ] Health-gated traffic switch with retained last-good rollback.
  - The decision contract retains the prior artifact unless all checks pass; host routing remains pending.
- [ ] Assigned-domain flow with TLS and DNS evidence.
  - Canonical hostname, DNS ownership, and TLS evidence contracts are complete; assignment remains pending.
- [x] Recovery matrix for provider, queue, worker, registry, destination, and acknowledgement outages.

## 5. Ecosystem and optional AI

- [x] Official/community/installed theme and component library.
  - **Complete local workflow:** Reviewed components can be previewed and added to the exact
    selected page, and four reviewed themes visibly update the local draft and persist through
    the extension-scoped draft store. No repository or deployment authority is implied.
- [x] Certification, provenance, compatibility, update, and removal contracts.
  - **Complete:** Immutable identity, compatibility, five-check certification, and review-only lifecycle plans.
  - **Pending integration:** Signed catalog publication and durable install/update/removal operations.
- [ ] User-configured AI providers with redaction, cost preview, and diff approval.
  - Provider, purpose, browser-credential denial, retention, redaction, input, and cost planning is complete; sending remains pending.
- [x] Content, translation, SEO, accessibility, and block-composition assistance.
  - All five assistance purposes are represented in review-only proposal/request contracts; provider execution remains pending.

## Later

- Optional SQLite-backed sites through an explicit stateful contract.
- Collaborative editorial workflows.
- Advanced custom recipes after the opinionated path is proven.
