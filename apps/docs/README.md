# vectorless-docs

Documentation site for **Vectorless** — document retrieval for the reasoning era.
No chunking, no embeddings, no vector DB: Vectorless parses a document into a
tree, an LLM agent navigates it with `treewalk`, and returns answers with
citations.

Built with [Fumadocs](https://fumadocs.dev) on Next.js (App Router). Deploys to
`docs.vectorless.store`.

## Develop

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

## Build

```bash
pnpm build
pnpm start
```

## Content

Docs live in `content/docs/**.mdx`. Sidebar order and section grouping are
controlled by the `meta.json` files. Sections:

- `getting-started` — positioning + quickstart
- `concepts` — tree retrieval, no-chunking model, `treewalk`, citations
- `api` — API reference (placeholder; will render from the engine OpenAPI spec)
- `sdks` — TypeScript, Python, Go
- `self-hosting` — Neon + Cloudflare R2 + Upstash QStash + Docker (placeholder)

## Design

Dark theme primary. Geist Sans (body/UI) + Geist Mono (code) + Instrument Serif
(display headlines). Blue→pink brand gradient (`#1456F0 → #3B82F6 → #EA5EC1`),
subtle grid background texture. Brand tokens live in `src/app/global.css`; fonts
in `src/fonts` wired via `src/lib/fonts.ts`.

## Deploy (next step — needs Vercel + DNS auth)

Not yet deployed. To ship: import the repo into Vercel and point
`docs.vectorless.store` at it (Spaceship DNS).
