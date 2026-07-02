# mooduck-landing

The public marketing site for MooDuck — a **Next.js (App Router)** app built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and **CSS Modules**.

Every section is a React Server Component, so the app is built as a **static export**
(`output: "export"`) — `pnpm build` writes plain HTML/CSS/JS to `out/`, which nginx
serves directly. There is no Node runtime, no `next start`, and no `sharp` on the box.

## Scripts

| Script | What it does |
|--------|----------------|
| `pnpm dev` | Dev server on [http://localhost:3002](http://localhost:3002) |
| `pnpm build` | Static export → `out/` (`next build`) |
| `pnpm preview` | Serve the built `out/` on port `3002` |
| `pnpm lint` | ESLint (`next/core-web-vitals` + `next/typescript`), `--max-warnings=0` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm codecheck` | `typecheck` + `lint` |

From the repo root: `pnpm dev.landing`.

## Deployment (VPS)

The build is tuned to run on the low-memory VPS:

- **Static export** — no Node server, no `sharp` (`images.unoptimized`), so runtime memory is zero.
- **Build-time lint/type-check are skipped** (`next.config.ts`); correctness is enforced in CI via `pnpm codecheck`, which still lints and type-checks this app in full.
- `deploy.sh` installs with `--config.child-concurrency=1` and skips `sharp`'s native build (`pnpm.neverBuiltDependencies`) to keep install within RAM.

nginx serves `apps/landing/out` — see [`nginx/landing.config`](../../nginx/landing.config) for a ready-to-fill server block.

## Layout

```
src/
├── app/                       # Route shells + global styles
│   ├── layout.tsx             # Fonts (Newsreader / Nunito Sans / Caveat) + <html> shell
│   ├── page.tsx               # Thin route shell → <LandingPage />
│   └── globals.css            # Tailwind entry + design tokens (@theme)
├── components/
│   └── Landing/               # The landing feature
│       ├── LandingPage.tsx    # Composes the sections
│       ├── Definitions.ts     # Types + content data (features, steps, chat, …)
│       ├── Icons.tsx          # Inline SVG icon components
│       ├── Hero/              # One folder per section (.tsx + .module.css)
│       ├── FeatureCards/
│       ├── Conversation/
│       ├── HowItWorks/
│       ├── Privacy/
│       ├── FinalCta/
│       └── Footer/
└── lib/
    └── Cn.ts                  # clsx + tailwind-merge helper
```

## Styling

- **Tailwind CSS v4** — design tokens are declared in `globals.css` via `@theme`, so both utility classes (`text-ink`, `bg-surface`) and CSS Modules (`var(--color-ink)`) read the same palette.
- **CSS Modules** — each section owns a co-located `*.module.css` for its layout and theming; `data-tone` attributes drive the accent-color variants type-safely.

Content and links (Telegram / GitHub URLs) live in `Definitions.ts`.
