# Security boundaries

## Trust model

The first-party TEND Sites extension is reviewed native ESM running in the tend.host panel origin. That makes every imported dependency and shipped byte part of the panel trust boundary. Extension packages therefore include generated SHA-256 integrity entries and request no capability they do not use.

Target repositories, site templates, themes, community components, user content, remote media, preview output, and AI responses are untrusted inputs.

## Non-negotiable invariants

1. Never execute target-site or community JavaScript in the panel origin.
2. Preview uses a separate origin with no panel cookies, storage, tokens, or ambient credentials.
3. Repository paths are relative and confined; reject absolute paths, drive paths, traversal, symlink escape, and unexpected submodules before access.
4. Browser code receives no raw Git, filesystem, Docker, SSH, shell, registry, DNS, deployment, or secret authority.
5. Every mutation is project-scoped, short-lived, purpose-bound, idempotent, and durably audited by the host.
6. AI output is data, never authority. Show an understandable change set before committing source changes.
7. Build and preview secrets use explicit purpose-bound delivery and never appear in logs, layers, cache keys, diffs, or AI prompts.
8. Fork and pull-request snapshots are untrusted by default and receive neither protected secrets nor production destination authority.
9. Starter, creation, adoption, content-index, change-preview, draft, media, localization, library, and preview-policy contracts are evidence only; none can apply repository or deployment mutations.
10. Passing compatibility or preview checks never grants installation, publishing, or deployment authority.

Source adoption is bound to provider installation, repository, immutable commit/tree/archive digests, actor, trust class, size limits, and an explicit expiry. The current pure assessor does not fetch or trust browser-provided repository contents. Authenticated checkout and digest verification remain host responsibilities.

11. Publishing never replaces the last healthy site until checks pass and the durable deployment operation commits.

Draft revisions are bound to one project, entry, committed base revision, and monotonic sequence. Media plans reject unsupported formats and upscaling and require localized alternative text. Translation proposals remain data until reviewed. Library certification never enables installation, and preview evidence always remains separate from deployment authority.

## Component and theme trust

- **Official** items are reviewed, versioned, and integrity-bound.
- **Community** items require explicit provenance and certification status.
- **Installed** items stay pinned to an immutable revision until the user reviews an update.

Schema-driven component options are preferred. Arbitrary editor-time scripts, dynamic evaluation, and remote script injection are forbidden.

## Reporting

Do not disclose security vulnerabilities in a public issue. Use the private security-reporting channel configured for the repository or contact `security@tend.host`.
