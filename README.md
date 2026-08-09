# TEND Sites

**A calm, guided website studio for tend.host.**

TEND Sites helps people create, edit, preview, and publish modern websites without making them learn Git, Markdown, routing, build commands, or DNS. Underneath the friendly workflow, every site remains ordinary source code and content that can build without tend.host.

> Foundation status: the repository currently contains the versioned content contracts, strict SvelteKit compatibility inspector, package-manager adapter, extension packaging pipeline, and a read-only Studio experience. It does not yet clone or create repositories, execute previews, deploy sites, configure domains, or call AI services.

## Product principles

- **Grandma-friendly by default.** Ordinary work follows short, plain-language steps.
- **Portable by construction.** Git, Markdown, SvelteKit, and standard package scripts remain the source of truth.
- **Beautiful blocks, not arbitrary pixel dragging.** Pages stay responsive and maintainable.
- **Progressive power.** Advanced users can inspect diffs, source files, schemas, and build evidence.
- **AI proposes; people authorize.** Source-changing actions require an understandable preview and explicit approval.
- **Extension, not core coupling.** TEND Sites ships independently as `host.tend.sites`.

## Local development

Requirements: a current Node.js release and npm.

```bash
npm ci
npm run dev
```

Open the URL printed by Vite. The local app is a development harness for the same Svelte interface mounted by the extension.

## Validation and packaging

```bash
npm run check
npm run lint
npm run test:unit -- --run
npm run build
```

`npm run build` produces:

- `build/` — the static development/demo application;
- `artifacts/tendsites-<version>.zip` — a tend.host extension v2 package;
- `artifacts/extension.json` — the generated integrity manifest for inspection.

The package requests no privileged tend.host permissions in this foundation release. Future repository, preview, publishing, domain, media, and AI work will be added only after each typed host capability exists and is independently reviewed.

## Documentation

- [Product and UX](docs/product.md)
- [Architecture](docs/architecture.md)
- [Security boundaries](docs/security.md)
- [Roadmap](docs/roadmap.md)
- [Durable decisions](docs/decisions.md)
- [Contributing](CONTRIBUTING.md)

## License

TEND Sites uses the [Functional Source License, Version 1.1, ALv2 Future License](LICENSE.md). Each version receives the Apache License 2.0 future license two years after it is made available.

Copyright © 2026 Wilkin Santana.
