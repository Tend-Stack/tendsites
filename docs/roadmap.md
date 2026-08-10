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
- [x] Explicit change-set preview before the first commit.
  - **Complete:** Impact counts, canonical ordering, readable field diffs, destructive-review flags, and no-apply boundaries.
  - **Pending integration:** Supply the preview from host-verified repository evidence.
- [x] Source-snapshot integrity, fork/PR trust policy, and secret denial.
  - **Complete:** Expiring provider/repository/commit/tree/archive evidence and safe default policy.
  - **Pending integration:** Host-side acquisition, digest verification, and protected-context enforcement.

## 2. Content Studio

- [x] Pages, posts, docs, media, navigation, and localization adapters.
  - **Complete:** Content/locale/collection/draft/navigation indexing plus deterministic Markdown/JSON-frontmatter serialization.
  - **Pending integration:** Host-backed read/write adapters and media I/O.
- [x] Autosave drafts separated from committed source.
  - **Complete:** Monotonic draft revision, exact retry, stale-base conflict, and bounded undo contracts.
  - **Complete local preview:** Versioned extension-scoped draft storage migrates
    the earlier bare-site shape and serializes rapid saves so older writes cannot
    replace newer edits.
  - **Complete recovery UX:** Failed or unreadable local saves preserve the visible
    draft and expose explicit retry or local-copy replacement without touching a
    repository or published site.
  - **Pending integration:** Persist project-scoped drafts through a durable host capability.
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
  - **Complete typed embed slice:** A normal YouTube, Vimeo, X-post, or Twitch link creates a typed
    responsive section. Arbitrary embed code and scripts are rejected; supported video previews use
    reviewed player origins and load only after an explicit privacy choice.
  - **Pending:** The full portable rich-text node model, repository media picker, reviewed typography
    tokens, cross-block selection, and selection-aware history in
    [`rich-editor-plan.md`](rich-editor-plan.md).
- [ ] Complete visitor-facing site capability set.
  - **Plan:** Blog collections/post editing, reusable blocks, cross-content previews, templates,
    navigation, media, forms, SEO/share metadata, sitemap/robots/feeds, redirects, structured data,
    accessibility, performance, localization, and editorial workflow are mapped in
    [`complete-site-plan.md`](complete-site-plan.md).
- [x] Undo history and clear conflict resolution.
- [x] Repository media lifecycle with accessible variants.
  - **Complete:** Digest-bound assets, localized alt text, deterministic variants, and review-only upload/retain/transform/remove plans.
  - **Pending integration:** Execute lifecycle plans through an assigned host capability.
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
