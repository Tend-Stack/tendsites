# TEND Sites contributor guide

TEND Sites is the first-party website studio extension for tend.host. Keep this repository independently buildable and portable.

## Before editing

1. Run `git status --short` and preserve unrelated work.
2. Read the matching document in `docs/`.
3. Inspect only the relevant source and tests.
4. State the scope and proportional validation.

## Product rules

- A normal user should never need Git, Markdown, YAML, shell commands, build tooling, or DNS knowledge.
- Use modular, URL-addressable workspaces rather than one long settings page.
- Keep ordinary workflows finite and guided; reveal expert controls progressively.
- Never claim a source change, preview, deployment, domain assignment, or AI action happened unless durable evidence proves it.
- Generated sites must remain normal projects that build without tend.host.

## Engineering rules

- Svelte 5 runes only; TypeScript and strict schemas at trust boundaries.
- Do not execute target-site, theme, or community code in the tend.host panel origin.
- Do not add raw Git, filesystem, Docker, SSH, shell, deployment, domain, or secret authority to the browser extension.
- Host mutations must use narrow, typed, assigned-project capabilities with durable operations, idempotency, and audit evidence.
- Package only reviewed files and generate SHA-256 integrity entries for every shipped file.
- Never commit credentials, user content, deployment coordinates, local paths, generated artifacts, or private operational data.

## Validation

Before handoff or commit, run:

```bash
npm run check
npm run lint
npm run test:unit -- --run
npm run build
git diff --check
```

Add Playwright coverage for browser-visible behavior and isolated integration tests before enabling a privileged host capability.
