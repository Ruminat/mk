# mooduck-landing

The public marketing site for MooDuck — a **Next.js (App Router)** app built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and **CSS Modules**.

It is a fully static, server-rendered page (no client-side JavaScript beyond Next's runtime): every section is a React Server Component.

## Scripts

| Script | What it does |
|--------|----------------|
| `pnpm dev` | Dev server on [http://localhost:3001](http://localhost:3001) |
| `pnpm build` | Production build (`next build`) |
| `pnpm start` | Serve the production build on port `3001` |
| `pnpm lint` | ESLint (`next/core-web-vitals` + `next/typescript`), `--max-warnings=0` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm codecheck` | `typecheck` + `lint` |

From the repo root: `pnpm dev.landing`.

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
