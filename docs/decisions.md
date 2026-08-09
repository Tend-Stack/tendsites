# Durable decisions

## D-001 — Canonical repository name

The project lives at `Tend-Stack/tendsites`. Earlier handoff material used `tend-sites`; `tendsites` is canonical for repository URLs and package automation. The extension identity remains `host.tend.sites` and the display name remains TEND Sites.

## D-002 — Independent extension

TEND Sites remains a separate repository and release artifact. Generic host capabilities may be added to tend.host, but site-specific code and branching remain here.

## D-003 — Portable, Git-native output

Generated sites use normal source files, assets, commits, and package scripts. A default static site does not require a runtime connection to tend.host.

## D-004 — Read-only foundation before authority

The first package intentionally requests no privileged permissions. It demonstrates the information architecture and freezes portable contracts before repository, preview, deploy, domain, or AI mutation is wired.

## D-005 — Separate preview origin

Untrusted target code never executes inside the panel origin. Preview isolation is a prerequisite, not a later hardening task.

## D-006 — Canonical repository paths and frozen installs

Portable contracts use relative POSIX paths with no alternate separators, empty segments, dot segments, traversal, drive prefixes, or control characters. Repository inspection may normalize a provider snapshot once, then rejects collisions. Execution plans require exactly one recognized package-manager lockfile and expose argv arrays rather than browser-provided shell strings.

## D-007 — Evidence before authority

Starter selection, source adoption, site creation, content indexing, and change previews are pure portable layers. They may classify and explain immutable evidence, but cannot clone, write, execute, publish, or deploy. Host mutation capabilities will be added as separate durable operations after the review contracts are stable.

The first such host seam accepts exact `site.create` evidence into a durable
route-free ledger only. This is intentionally an admission checkpoint rather
than mutation authority: browser delivery, source execution, and completion
evidence remain separate reviewed milestones.

## D-008 — Focused readiness workspaces

Operational evidence is presented through an at-a-glance overview and task-specific tabs, not one long settings page. Draft, media, localization, library, and preview readiness stay independently addressable in the interface and independently versioned in code. A green assessment communicates evidence quality only; it never implies that the corresponding host mutation capability exists.

## D-009 — Build evidence before execution services

Page composition, content review, previews, publishing, domains, ecosystem changes, and AI requests receive portable evidence contracts before host mutation is enabled. The same contracts will become inputs to narrow tend.host capabilities; they are not temporary UI models and cannot execute by themselves.
