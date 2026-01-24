# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

This document is split into:

- **Project Facts**: Repository-specific facts (how it’s built, tested, and structured).
- **Working Rules**: Repository-specific working rules (only if there are any).

## AI Behavior Rules

- Keep explanations **concise and technically accurate**.
- Follow **Astro v5**, **TypeScript**, **Tailwind CSS**, and **pnpm** conventions.
- Respect the **directory layout** and **naming rules** in this repo.
- Default to **static generation**; avoid unnecessary client JS.
- Prefer **type-safe, content-driven design** (Content Collections + Zod).
- Output **copy-ready commands** and absolute paths if they reduce ambiguity.
- **Use Jujutsu (`jj`)** for version control (do not use `git` commands).

## Project Facts

### Project Overview

remark-link-card-plus is a [remark](https://github.com/remarkjs/remark) plugin that converts standalone text links in Markdown to styled link cards with Open Graph metadata (title, description, favicon, thumbnail).

### Development Commands

```bash
npm run build       # Build with TypeScript (tsconfig.build.json)
npm run dev         # Watch mode for development
npm test            # Run tests with vitest
npm run check       # Lint with Biome
npm run check:fix   # Auto-fix lint issues
npm run typecheck   # Type check without emitting
```

To run a single test:

```bash
npx vitest run -t "test name pattern"
```

### Architecture

The plugin is a single-file implementation (`src/index.ts`) following the unified/remark plugin pattern:

1. **AST Traversal**: Uses `unist-util-visit` to find paragraph nodes containing standalone links
2. **Link Detection**: Identifies links where the text matches the URL (bare URLs, autolinks `<url>`, or `[url](url)` format)
3. **OG Fetching**: Uses `open-graph-scraper` to fetch metadata from target URLs
4. **HTML Generation**: Transforms matched nodes into HTML with BEM-style classes (`remark-link-card-plus__*`)

Key behaviors:

- Links inside list items are NOT converted
- Links with different text and URL (e.g., `[Example](https://example.com)`) are NOT converted
- Title/description are sanitized with `sanitize-html` to prevent XSS
- Favicons fall back to Google's favicon service
- Optional caching saves images to `public/remark-link-card-plus/`

### Testing

Tests use vitest with MSW for HTTP mocking. The `open-graph-scraper` and `file-type` modules are mocked globally in the test file.

### Code Style

- Biome for linting/formatting (2-space indent, double quotes)
- TypeScript strict mode
- ESM modules (`"type": "module"`)

## Working Rules

No additional repository-specific working rules are currently defined here.
