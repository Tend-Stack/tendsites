# Roadmap

Status values are evidence-based: completed items have code and proportional tests; planned items do not imply product authority exists.

## 0. Repository foundation — in progress

- [x] Independent `Tend-Stack/tendsites` repository and toolchain.
- [x] Strict v1 project/change/preview/publish/theme/component contracts.
- [x] Portable content, media, `tend.site.json`, and AI-proposal contracts.
- [x] Lockfile-aware package-manager adapter.
- [x] Pure bounded SvelteKit compatibility inspector with canonical path and lockfile rejection.
- [x] Modular, responsive, read-only Studio foundation.
- [x] tend.host extension v2 packaging with generated integrity.
- [ ] Install the produced ZIP in an isolated tend.host fixture and verify mount/unmount cleanup.

## 1. Create and adopt

- [ ] Reviewed starter catalog and immutable template revisions.
- [ ] Friendly five-step creation workflow backed by a durable host operation.
- [ ] Existing-repository analyzer with bounded checkout and compatibility report.
  - [x] Pure snapshot classification and compatibility report.
  - [ ] Authenticated, digest-bound, bounded checkout supplied by the host.
- [ ] Explicit change-set preview before the first commit.
- [ ] Source-snapshot integrity, fork/PR trust policy, and secret denial.

## 2. Content Studio

- [ ] Pages, posts, docs, media, navigation, and localization adapters.
- [ ] Autosave drafts separated from committed source.
- [ ] Accessible block canvas with schema-driven inspector.
- [ ] Responsive/mobile editing model and keyboard navigation.
- [ ] Undo history and clear conflict resolution.

## 3. Isolated previews

- [ ] Separate-origin preview service with no panel credentials.
- [ ] Resource, time, network, and storage limits.
- [ ] Frozen installs and truthful required-check evidence.
- [ ] Preview supersession, expiry, cleanup, and recovery.

## 4. Publishing and domains

- [ ] Reviewable commit plan and durable publish operation.
- [ ] Build-once artifact identity and deployment handoff.
- [ ] Health-gated traffic switch with retained last-good rollback.
- [ ] Assigned-domain flow with TLS and DNS evidence.
- [ ] Recovery matrix for provider, queue, worker, registry, and acknowledgement outages.

## 5. Ecosystem and optional AI

- [ ] Official/community/installed theme and component library.
- [ ] Certification, provenance, compatibility, update, and removal contracts.
- [ ] User-configured AI providers with redaction, cost preview, and diff approval.
- [ ] Content, translation, SEO, accessibility, and block-composition assistance.

## Later

- Optional SQLite-backed sites through an explicit stateful contract.
- Collaborative editorial workflows.
- Advanced custom recipes after the opinionated path is proven.
