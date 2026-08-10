# Architecture

## Boundary

TEND Sites is an independent extension repository. tend.host owns generic infrastructure capabilities; this project owns site-specific workflows, contracts, adapters, and presentation. Product-specific conditionals do not belong in tend.host core.

```text
TEND Sites Studio
        │ typed, scoped host capabilities
        ▼
tend.host durable operations
        │
        ├── assigned Git repository
        ├── isolated preview job
        ├── assigned deployment
        ├── assigned domain
        └── optional user-configured AI

Generated site = ordinary files + assets + Git history
```

## Current foundation

- `src/lib/contracts/sites.ts` defines strict, versioned project and operation schemas.
- `src/lib/adapters/package-manager.ts` derives frozen install commands from one unambiguous committed lockfile.
- `src/lib/adapters/sveltekit.ts` detects and inspects bounded repository snapshots without cloning, reading the filesystem, or executing project code.
- `src/lib/contracts/catalog.ts` pins starter identity to an immutable revision and per-file digests.
- `src/lib/contracts/adoption.ts` separates bounded source evidence from checkout, secret, and production authority.
- `src/lib/planning/` produces deterministic creation and change-review plans that are structurally unable to apply themselves.
- `src/lib/content/index.ts` validates collection, locale, path, and navigation relationships without reading a repository.
- `src/lib/contracts/drafts.ts` separates draft revisions from committed source and detects stale-base conflicts.
- `src/lib/contracts/media.ts` plans bounded, deterministic image variants without transformation authority.
- `src/lib/contracts/localization.ts` measures locale coverage and binds translation proposals to source evidence.
- `src/lib/contracts/library.ts` combines immutable library identity, adapter compatibility, and certification evidence.
- `src/lib/contracts/preview-policy.ts` evaluates separate-origin resource limits and required checks without deployment authority.
- `src/lib/contracts/blocks.ts` validates page documents against script-free, responsive block definitions and supports deterministic ordering.
- `src/lib/planning/content-diff.ts` turns repository evidence into readable field-level changes without apply authority.
- `src/lib/contracts/preview-lifecycle.ts` models supersession, expiry, and cleanup eligibility without performing cleanup.
- `src/lib/contracts/publishing.ts` freezes reviewed commit, artifact, traffic, domain, and outage-recovery evidence.
- `src/lib/contracts/library-state.ts` separates installed provenance from review-only install/update/removal plans.
- `src/lib/contracts/ai.ts` enforces user-configured providers, browser credential denial, purpose, redaction, input, and cost policy before a request can be reviewed.
- `src/lib/starters/archives.ts` ships four complete ordinary SvelteKit source bundles and verifies every file plus the canonical revision digest.
- `src/lib/content/markdown.ts` provides a deterministic Markdown adapter with a deliberately small JSON-frontmatter grammar.
- `src/lib/content/assistance.ts` performs local SEO and accessibility checks without sending content or applying changes.
- `src/lib/sites/` contains a fixture-backed interactive Studio with a complete
  example site, editable pages and sections, an overview-first workspace, and
  tabbed readiness evidence. Its versioned local draft envelope is serialized
  through scoped extension storage so rapid edits cannot be persisted out of
  order. Read or write failures preserve the visible draft and offer an explicit,
  local-only retry or replacement flow. Contextual title and paragraph editing
  serializes a bounded Markdown subset rather than arbitrary browser HTML; raw
  HTML is escaped, links are protocol-validated, and pasted markup becomes plain
  text. `src/lib/sites/embed.ts` canonicalizes only reviewed HTTPS YouTube,
  Vimeo, X, and Twitch URL forms into typed evidence. The Studio accepts no
  caller-supplied iframe or script markup; reviewed player URLs are derived
  locally and loaded on demand. This convenience draft is not repository or
  publishing authority.
- `src/extension/index.ts` mounts the same interface through tend.host extension v2.
- `scripts/package-extension.mjs` emits a ZIP with SHA-256 integrity for every shipped file.

## Host operation bridge

Privileged work is represented by a shared `sites-host-operation-request/v1` envelope. A request is valid only inside a short-lived host-supplied context bound to one project, one capability, and, when applicable, one exact source revision. Canonical intent and idempotency digests make retries comparable without putting a bearer token in extension state.

Creation, repository inspection, isolated preview, and publishing each define a strict intent layered over that envelope. Returned evidence is monotonic and exact-request-bound. These portable contracts do not implement a queue, checkout, commit, build, deployment, route, filesystem write, or provider call; tend.host remains responsible for authorization, persistence, execution, recovery, and audit.

The first host integration now persists `site.create` admission only. tend.host
issues a 60-second context bound to the authenticated user, project, reviewed
bundle version, and optional source revision, then recomputes the intent and
idempotency digests before recording exact accepted evidence. The seam is not
yet exposed to the browser and has no executor, so `accepted` never means the
site, repository, preview, or deployment exists.

No repository-backed draft persistence, build, preview execution, deployment,
traffic routing, domain assignment, media transformation, library installation,
or AI mutation exists yet. The interactive example may persist a bounded local
draft inside tend.host's extension-scoped storage, but it cannot turn that draft
into source or deployment authority. Passing a pure assessment never promotes
it into authority.

The compatibility inspector accepts provider-supplied file names plus parsed `package.json` and optional `tend.site.json` data. It rejects path traversal, duplicate canonical paths, conflicting lockfiles, missing build scripts, malformed metadata, and non-SvelteKit projects before producing an argv-only install/build plan. The future host remains responsible for authenticated checkout, snapshot integrity, isolation, and execution.

Starter selection, adoption assessment, content indexing, change preview, draft evaluation, media planning, localization reporting, library assessment, and preview assessment are portable pure functions. Their outputs carry explicit `review_only`, `canApply: false`, `canTransform: false`, `canInstall: false`, `canDeploy: false`, or unavailable-authority fields where appropriate. A later tend.host capability may consume reviewed evidence, but the extension cannot convert these plans into source or deployment mutations by itself.

## Capability seam

Host capabilities are narrow and assigned to a specific project. `site.create`
has host-side admission but no browser delivery or executor. The remaining
capabilities are contract coordinates only:

- `site.create` — durable admission only
- `repository.inspect`
- `preview.execute`
- `publish.execute`
- `domain.assign`
- `ai.invoke`

Admission does not make a capability an extension permission. A capability is
not declared in `extension.config.json` until tend.host supports and enforces
the complete browser-to-host contract and executor boundary.

## Portability

The repository, not extension storage, is authoritative. The target project uses ordinary SvelteKit source, Markdown or compatible structured content, committed configuration, assets, and standard package scripts. `.tend/` metadata may improve the Studio but cannot be required to serve an otherwise static site.
