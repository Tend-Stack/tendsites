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
- `src/lib/contracts/source-storage.ts` names one canonical source adapter, keeps resumable drafts
  structurally noncanonical, and derives honest durability states only from exact revision-bound
  source, history, backup, and restore evidence.
  The companion tend.host service now persists this source binding behind an accepted creation
  operation and retains one encrypted, bounded current draft snapshot. That seam is route-free and
  does not clone, write, publish, build, or deploy source.
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
  publishing authority. Collection-fed page sections project only published
  items from the same validated draft, use deterministic newest/featured
  ordering, and open an in-preview article view; draft content never enters the
  visitor projection.
  The post composer applies deterministic selection edits directly to portable Markdown. Its shared
  renderer recognizes headings, inline emphasis, safe links, ordered and unordered lists, block
  quotes, fenced code, and dividers; raw HTML remains escaped and code content never executes.
  `src/lib/sites/visitor-form.ts` normalizes and validates bounded visitor input, detects the inert
  honeypot, and can only return a non-delivered plan. `VisitorForm.svelte` provides accessible
  field errors, consent, review, edit, and reset states without issuing a network request; a future
  host capability must separately authorize any delivery destination.
  `src/lib/sites/site-structure.ts` owns bounded header/footer navigation with one submenu level,
  safe external and social destinations, the optional announcement, and missing-page recovery.
  `StructureWorkspace.svelte` edits only this local draft; removing a parent promotes its children.
  The visitor preview resolves internal links from current page IDs, renders accessible desktop and
  mobile submenu compositions, and exposes desktop/tablet/phone frames. Structure diagnostics join the
  existing local Readiness report and deep-link to the relevant workspace. Post scheduling is
  similarly editorial evidence only: scheduled and archived entries are excluded from visitor
  projections and no timer or publishing request exists in the extension.
  Installed builds may receive a permission-gated `HostMediaBridge` from tend.host. It lists only
  authenticated, owner-scoped image libraries and sanitized opaque item references. Selecting an
  image records its panel content URL, accessible description, and opaque Files identity in the
  local draft. No source/provider path is disclosed and the bridge has no upload, copy, delete,
  transform, repository-read, or repository-write method. Consequently this is a connected draft
  preview, not a portable repository asset; source copying remains a separate reviewed operation.
  The same structure model owns bounded loading, offline, maintenance, and error copy. Older drafts
  receive deterministic defaults, while Studio previews every state without claiming that a host
  network, maintenance, or runtime-error boundary has been connected.
  `src/lib/sites/seo.ts` derives page metadata plus escaped sitemap, robots, and RSS previews from
  the same bounded draft. `SeoWorkspace.svelte` edits only that draft and deliberately has no
  repository, search-index submission, filesystem, or publish authority. Legacy drafts receive
  deterministic safe defaults before strict validation.
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

The repository, not extension storage, is authoritative. A visual starter may use ordinary SvelteKit
source, while an adopted custom site may retain Astro, Eleventy, Next.js, Nuxt, Hugo, Jekyll, or
another reviewed build adapter. Content mappings may describe bounded Markdown, MDX-compatible,
JSON, YAML, or TOML collections without transferring ownership of templates or rendering to Sites.
Committed configuration, assets, and standard package scripts remain portable. `.tend/` metadata may
improve the Studio but cannot be required to serve an otherwise static site.

`src/lib/contracts/custom-site.ts` defines the framework-neutral review boundary. A custom-site
profile names exact content directories and structured fields, declares whether portable visual
blocks are supported, and always preserves repository renderer ownership. Starter-repository entries
carry an immutable commit and tree digest plus explicit publisher, license, community/official
identity, and review state. These contracts select no code and grant no checkout or execution
authority.

`src/lib/adapters/framework-catalog.ts` detects only from a bounded canonical file listing and
optional parsed package metadata. Multiple framework signals are an ambiguity, not a guess, unless
an explicit reviewed manifest selects one of the detected adapters. `src/lib/content/schema-catalog.ts`
normalizes collection fields into non-executable form and editor-block definitions. Its compatibility
import intentionally drops provider backend, workflow, URL, media-library, authentication, checkout,
and deployment settings; importing a familiar configuration never imports its authority model.

The canonical repository may be a protected local Git repository outside every application
container on a selected customer server, an external Git provider, or another customer-controlled
adapter. tend.host may retain encrypted, quota- and expiry-bounded working drafts plus immutable
revision, artifact, and operation metadata, but those drafts are never source authority. A future
tend.host-managed vault implements the same adapter contract only after explicit consent and must
remain optional and exportable. Builds and previews consume immutable snapshots in disposable
workspaces; running containers, build caches, and artifacts are not repository backups.

## Local discovery draft

The interactive Sites draft owns bounded site identity, page and post SEO, and at most 50 internal
redirect intents. Older drafts are upgraded with `en-US`, generated entry metadata, and an empty
redirect list. Sitemap, robots, RSS, Atom, schema.org, and redirect diagnostics are deterministic
local projections only; they neither write repository files nor claim publish evidence.

The visitor journal is another pure projection over published draft entries. Search, tags,
pagination, reading time, related ranking, navigation, and share destinations are computed locally;
they create no analytics event, external request, repository write, or delivery claim on their own.
