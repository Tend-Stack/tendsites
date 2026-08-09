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
- `src/lib/sites/` contains a fixture-backed, read-only Studio experience.
- `src/extension/index.ts` mounts the same interface through tend.host extension v2.
- `scripts/package-extension.mjs` emits a ZIP with SHA-256 integrity for every shipped file.

No repository, build, preview, deployment, domain, media, or AI mutation exists yet.

The compatibility inspector accepts provider-supplied file names plus parsed `package.json` and optional `tend.site.json` data. It rejects path traversal, duplicate canonical paths, conflicting lockfiles, missing build scripts, malformed metadata, and non-SvelteKit projects before producing an argv-only install/build plan. The future host remains responsible for authenticated checkout, snapshot integrity, isolation, and execution.

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
