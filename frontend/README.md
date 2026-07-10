# Frontend — portfolio (SPA React)

Interface du portfolio : **React 19 + TypeScript + Vite 8 + Tailwind CSS v4**, esthétique terminal, **bilingue FR/EN** et **thème clair/sombre**. Servi en production par Nginx (voir [`../infra/README.md`](../infra/README.md)).

> Fait partie du monorepo [portfolio](../README.md).

## Stack

- **React 19** + **TypeScript** — SPA
- **Vite 8** — dev server + build
- **Tailwind CSS v4** (via `@tailwindcss/vite`) — thème vert canard, breakpoints custom (`nav:950px`, `xs:370px`)
- **i18n maison** (FR/EN) — `src/i18n/`
- Polices auto-hébergées (`@fontsource-variable` : Inter + JetBrains Mono)
- `react-phone-number-input` (drapeaux self-hostés, pas d'appel tiers)

## Démarrage

```bash
npm install
npm run dev      # http://localhost:5173
```

## Scripts

| Script | Rôle |
| --- | --- |
| `npm run dev` | Serveur de dev (HMR) |
| `npm run build` | Typecheck (`tsc -b`) + build de production (Vite) |
| `npm run preview` | Sert le build local |
| `npm run lint` | ESLint |
| `npm test` | Tests Vitest (ajouter `-- --run` en CI) |

> `predev`/`prebuild` copient d'abord les drapeaux téléphone en local (`scripts/copy-flags.mjs`) → pas de requête vers un CDN tiers.

## Structure

```
src/
├── components/   Sections (Hero, About, Career, Projects, Contact…) + UI (Reveal, Lightbox…)
├── hooks/        useReveal, useActiveSection (scroll-spy), useTypewriter…
├── i18n/         LangContext + traductions FR/EN
├── lib/          helpers (spotlight, etc.)
├── assets/       visuels des projets (SVG générés, cf. branding/)
├── test/         setup Vitest
├── index.css     thème Tailwind (variables clair/sombre, aurora…)
└── main.tsx      point d'entrée
```

## Caractéristiques

- **Accessibilité (WCAG AA)** — structure sémantique, `sr-only`, focus visibles ; smoke test **axe** dans la suite Vitest.
- **SEO** — meta OG/Twitter, données structurées JSON-LD (Person), `sitemap.xml`, `llms.txt`, fallback `<noscript>` (voir [`index.html`](index.html) et [`public/`](public)).
- **Perf** — `Contact` et `Lightbox` chargés en lazy, polices en `font-display: swap`, visuels projets en SVG inline. Compression gzip côté serveur (Nginx).
- **Animations** — apparition au scroll (`Reveal`), machine à écrire, particules canvas, transition de thème (View Transitions). Respecte `prefers-reduced-motion`.
- **CV intégré** — modale plein écran affichant le CV en SVG vectoriel (bi-langue × bi-thème) + téléchargement PDF (`public/cv-*`).

## Visuels des projets

Les captures des projets sont des **SVG inline générés** (ils héritent des webfonts du site), bilingues et bi-thème. Régénérer :

```bash
node branding/generate-projects.mjs   # cwd = frontend/
```

Détails (og-image, projets) dans [`branding/README.md`](branding/README.md).

## Tests

```bash
npm test          # watch
npm test -- --run # une passe (CI)
```

Couvre l'i18n, le formulaire de contact, la lightbox et un contrôle d'accessibilité axe.
