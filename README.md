# TEND Sites

**A calm, guided website studio for tend.host.**

TEND Sites helps people create, edit, preview, and publish modern websites without making them learn Git, Markdown, routing, build commands, or DNS. Underneath the friendly workflow, every site remains ordinary source code and content that can build without tend.host.

Use the visual Studio when you want the simplest path, or connect a custom developer-built site and
keep its framework, templates, components, and styling. In custom mode, Sites acts as a Git-native
content workspace over explicitly mapped Markdown and structured files. Hybrid adapters can offer
both content forms and safe visual sections without taking ownership of the site's renderer.

> Foundation status: the repository now includes schema-driven page blocks, keyboard/mobile Studio navigation, content-aware diffs, preview lifecycle evidence, reviewed commit and immutable artifact contracts, health-gated traffic decisions, domain/TLS evidence, outage recovery policy, library lifecycle plans, and privacy/cost-bounded AI request plans. These layers remain deliberately non-authoritative: the extension does not yet persist source, execute previews, route traffic, assign domains, install library code, or call AI services.

Four complete starter source bundles are now included and digest-certified. Content can be parsed and serialized through the bounded Markdown/JSON-frontmatter adapter, while local SEO and accessibility assistance works without sending user content anywhere. The interactive example also includes a first-class post collection and a focused Content workspace, so its journal entries can be created and edited as real reusable content rather than decorative placeholder cards. A collection-fed Latest Posts section now projects only published entries into responsive visitor cards and opens real article previews. A separate Search & Sharing workspace manages locale and favicon identity, page and post search metadata, social previews, redirects with loop/conflict checks, and deterministic local sitemap, robots, RSS, Atom, and schema.org previews without claiming to write or publish them.

The packaged extension is exercised against tend.host's real schema-2 installer in a disposable fixture, including integrity, scoped-storage, uninstall, and file cleanup. Its browser lifecycle is also mounted and unmounted twice. Portable operation intents are ready for creation, repository inspection, isolated preview, and publishing, but remain non-executing until tend.host supplies narrow assigned capabilities.

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
