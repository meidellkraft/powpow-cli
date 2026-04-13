# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

PowPow CLI is a pro-code development tool for Microsoft Power Pages. It bundles TypeScript/TSX source files into Power Pages portal resources (web-templates and web-files) using Rolldown, and serves them locally via a dev server that works with the PowPow Interceptor browser extension.

## Commands

- `pnpm build` — Compile TypeScript (runs `tsc`)
- `pnpm dev` — Compile TypeScript in watch mode (`tsc --watch`)
- `pnpm install --frozen-lockfile` — Install dependencies

There are no tests or linting configured.

## Architecture

The CLI entry point is `src/cli.ts`, which dispatches to command handlers in `src/commands/`. The public programmatic API is exported from `src/index.ts`.

### Build Pipeline (what powpow does for users)

1. **Config** (`src/config.ts`) — Loads/validates `powpow.config.json`, which maps source files to Power Pages resource GUIDs
2. **Resource scanning** (`src/resources.ts`) — Discovers web-templates and web-files in the portal directory by globbing YAML metadata files
3. **Ownership resolution** (`src/ownership.ts`) — Determines which entry point "owns" each source file (deepest directory wins), controlling whether imports are inlined, externalized as URLs, or shimmed as UMD globals
4. **Bundling** (`src/build.ts` + `src/plugin.ts`) — Rolldown bundles each entry point as an ES module. The custom plugin in `plugin.ts` implements the ownership-based module resolution logic
5. **Output** — Web-template output is wrapped in `<script type="module">` tags; web-file output is plain ES modules. Output is written directly to portal resource content paths
6. **Dev server** (`src/dev-server.ts`) — HTTP server with CORS serving built assets at `/web-templates/:guid`, `/web-files/*`, and `/manifest`

### Key Design Decisions

- **No intermediate dist/ for user builds** — Built code writes directly into the Power Pages portal directory structure
- **Ownership model** — The three-tier resolution (UMD globals → cross-entry externals → inlined) is the core complexity of the bundler plugin. Changes here affect all entry point builds.
- **Per-entry bundling** — Each entry point is bundled independently by Rolldown, not as a single multi-entry build

## Tech Stack

- TypeScript 6, ES modules (`"type": "module"`)
- Node.js >=22, pnpm 10
- Rolldown (Rust-based bundler) for user project bundling
- `tsc` only for compiling this CLI tool itself
