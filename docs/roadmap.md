# Roadmap

Status values are evidence-based: completed items have code and proportional tests; planned items do not imply product authority exists.

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
- [ ] Install the produced ZIP in an isolated tend.host fixture and verify mount/unmount cleanup.

## 1. Create and adopt

- [ ] Reviewed starter catalog and immutable template revisions.
  - [x] Strict catalog/revision/file-manifest foundation with four first-party preview entries.
  - [ ] Certify and publish complete starter source archives.
- [ ] Friendly five-step creation workflow backed by a durable host operation.
  - [x] Deterministic review plan shown in the five-step workflow.
  - [ ] Persist and execute the reviewed plan through an assigned host capability.
- [ ] Existing-repository analyzer with bounded checkout and compatibility report.
  - [x] Pure snapshot classification and compatibility report.
  - [ ] Authenticated, digest-bound, bounded checkout supplied by the host.
- [ ] Explicit change-set preview before the first commit.
  - [x] Portable impact counts, canonical file ordering, destructive-review flag, and no-apply boundary.
  - [ ] Render content-aware diffs from host-verified repository evidence.
- [ ] Source-snapshot integrity, fork/PR trust policy, and secret denial.
  - [x] Expiring provider/repository/commit/tree/archive evidence and safe default policy contract.
  - [ ] Host-side acquisition, digest verification, and protected-context enforcement.

## 2. Content Studio

- [ ] Pages, posts, docs, media, navigation, and localization adapters.
  - [x] Pure content/locale/collection/draft/navigation validation and summary indexing.
  - [ ] Host-backed read/write adapters and media lifecycle.
- [ ] Autosave drafts separated from committed source.
  - [x] Monotonic draft revision, exact-retry, stale-base conflict, and bounded undo contracts.
  - [ ] Persist encrypted project-scoped drafts through a durable host capability.
- [x] Accessible block canvas with schema-driven inspector.
- [x] Responsive/mobile editing model and keyboard navigation.
- [ ] Undo history and clear conflict resolution.
- [ ] Repository media lifecycle with accessible variants.
  - [x] Digest-bound asset and deterministic no-upscale variant-plan contracts.
  - [ ] Upload, transform, retain, and remove media through an assigned host capability.
- [ ] Localization coverage and reviewed translation workflow.
  - [x] Locale coverage report and source-bound manual/user-configured-AI proposal contracts.
  - [ ] Persist reviewed translations through repository change operations.

## 3. Isolated previews

- [ ] Separate-origin preview service with no panel credentials.
- [ ] Resource, time, network, and storage limits.
- [ ] Frozen installs and truthful required-check evidence.
  - [x] Separate-origin resource policy and required-check assessment with no deploy authority.
  - [ ] Execute isolated previews and retain bounded evidence through durable host jobs.
- [ ] Preview supersession, expiry, cleanup, and recovery.
  - Portable generation, supersession, expiry, and cleanup-eligibility evidence is complete; host cleanup remains pending.

## 4. Publishing and domains

- [ ] Reviewable commit plan and durable publish operation.
  - The immutable, non-committing review plan is complete; durable host execution remains pending.
- [ ] Build-once artifact identity and deployment handoff.
  - Commit/recipe/platform/SBOM/provenance artifact identity is complete; handoff remains pending.
- [ ] Health-gated traffic switch with retained last-good rollback.
  - The decision contract retains the prior artifact unless all checks pass; host routing remains pending.
- [ ] Assigned-domain flow with TLS and DNS evidence.
  - Canonical hostname, DNS ownership, and TLS evidence contracts are complete; assignment remains pending.
- [x] Recovery matrix for provider, queue, worker, registry, destination, and acknowledgement outages.

## 5. Ecosystem and optional AI

- [x] Official/community/installed theme and component library.
- [x] Certification, provenance, compatibility, update, and removal contracts.
  - [x] Immutable item, adapter compatibility, five-check certification, and no-install assessment contracts.
  - [ ] Add signed catalog publication plus durable install, update, and removal operations.
- [ ] User-configured AI providers with redaction, cost preview, and diff approval.
  - Provider, purpose, browser-credential denial, retention, redaction, input, and cost planning is complete; sending remains pending.
- [ ] Content, translation, SEO, accessibility, and block-composition assistance.
  - All five assistance purposes are represented in review-only proposal/request contracts; provider execution remains pending.

## Later

- Optional SQLite-backed sites through an explicit stateful contract.
- Collaborative editorial workflows.
- Advanced custom recipes after the opinionated path is proven.
