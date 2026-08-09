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
- `src/lib/sites/` contains a fixture-backed, read-only Studio experience with an overview-first, tabbed readiness workspace.
- `src/extension/index.ts` mounts the same interface through tend.host extension v2.
- `scripts/package-extension.mjs` emits a ZIP with SHA-256 integrity for every shipped file.

No repository, draft persistence, build, preview execution, deployment, traffic routing, domain assignment, media transformation, library installation, or AI mutation exists yet. Passing a pure assessment never promotes it into authority.

The compatibility inspector accepts provider-supplied file names plus parsed `package.json` and optional `tend.site.json` data. It rejects path traversal, duplicate canonical paths, conflicting lockfiles, missing build scripts, malformed metadata, and non-SvelteKit projects before producing an argv-only install/build plan. The future host remains responsible for authenticated checkout, snapshot integrity, isolation, and execution.

Starter selection, adoption assessment, content indexing, change preview, draft evaluation, media planning, localization reporting, library assessment, and preview assessment are portable pure functions. Their outputs carry explicit `review_only`, `canApply: false`, `canTransform: false`, `canInstall: false`, `canDeploy: false`, or unavailable-authority fields where appropriate. A later tend.host capability may consume reviewed evidence, but the extension cannot convert these plans into source or deployment mutations by itself.

## Planned capability seam

Future host capabilities are narrow and assigned to a specific project:

- `repo:assigned`
- `preview:isolated`
- `jobs:sites`
- `deploy:assigned`
- `domains:assigned`
- `media:transform`
- `ai:user-configured`

Capability names are roadmap coordinates, not currently implemented permissions. A capability is not declared in `extension.config.json` until tend.host supports and enforces its contract.

## Portability

The repository, not extension storage, is authoritative. The target project uses ordinary SvelteKit source, Markdown or compatible structured content, committed configuration, assets, and standard package scripts. `.tend/` metadata may improve the Studio but cannot be required to serve an otherwise static site.
