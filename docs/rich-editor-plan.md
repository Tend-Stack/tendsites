# Visual writing editor plan

TEND Sites will make ordinary Markdown content feel like editing the finished page. The default
experience stays approachable: click the words, type, and use a small floating toolbar only when
needed. Expert structure and source evidence remain available without becoming prerequisites.

## Interaction model

- Clicking a heading, paragraph, caption, button label, or list enters direct editing in place.
- A compact floating toolbar stays collapsed by default and can be expanded, moved out of the way,
  or dismissed for the session.
- Desktop outline and inspector edges are resizable within safe limits. Mobile continues to use the
  dedicated Outline, Canvas, and Inspector workspaces rather than squeezed desktop columns.
- Formatting actions apply to a current selection when one exists and otherwise to the current
  block. Every action remains keyboard accessible and announces its result.

## Portable content model

Rich content will not persist arbitrary panel HTML. A versioned portable document model will cover:

- paragraphs, headings, lists, quotes, code, dividers, and callouts;
- bold, italic, emphasis, inline code, and reviewed typography tokens;
- internal page links, safe `https` links, email links, and explicit new-window behavior;
- digest-bound repository images with alt text, captions, focal point, and responsive variants;
- stable node IDs for undo, conflict resolution, translations, and readable diffs.

The adapter will serialize that model deterministically to normal Markdown/MDX plus bounded
frontmatter. Unsupported HTML, scripts, event handlers, unsafe URLs, inline secrets, and arbitrary
CSS are rejected. Font and size controls select reviewed theme tokens instead of producing fragile
per-span styling.

## Toolbar progression

1. **Foundation:** direct plain-text editing, collapsible writing tools, safe panel resizing.
2. **Structure:** paragraph/heading/list/quote changes and portable inline emphasis.
3. **Links:** page picker first, validated external links second, clear unlink action.
4. **Media:** select an existing repository asset, add alt text/caption, then request a separately
   authorized upload or transform through the existing media lifecycle contract.
5. **Review:** selection-aware undo, accessibility checks, translation coverage, Markdown preview,
   and exact source diff before commit.

## Safety and recovery

- Edits first enter the versioned extension-scoped draft and never imply a repository commit.
- History groups typing into meaningful undo steps rather than one entry per keystroke.
- Pasting is normalized to the portable model; scripts, hidden formatting, tracking URLs, and data
  URLs are stripped or rejected.
- Repository writes, uploads, previews, and publishing remain separate typed host operations with
  idempotency and durable evidence.
- Conflicts are resolved at stable block/node boundaries with a clear mine/theirs comparison.

## Completion gate

The rich editor is production-ready only after round-trip Markdown fixtures, paste sanitization,
keyboard and screen-reader coverage, mobile selection behavior, long-document performance,
autosave recovery, translation mapping, and source-diff browser tests all pass.
