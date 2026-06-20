# Fluent Icons Viewer

5000+ pixel perfect open source icons from [Microsoft](https://github.com/microsoft/fluentui-system-icons).
![Fluent Icons](https://fluenticons.co/social.png)

This site is not affiliated or connected to Microsoft in any way, this is just a viewer for the open-source icons from them.

Open source Microsoft Fluent icons preview website. Rebuilt from Nuxt/Vue to **Astro + Preact islands** for minimal client JS.

## Stack

- **Astro** — static shell, zero-JS delivery for non-interactive parts (Hero)
- **Preact** — interactive islands (Navbar, IconGrid, FavoritesSidebar, PreviewSidebar)
- **@preact/signals** — shared reactive state across islands without prop drilling
- **Tailwind CSS v4** — CSS-first utility framework
- **Catppuccin** — Latte (light) / Macchiato (dark) palette
- **Prism.js** — syntax highlighting in the code snippet preview

## Features

- 5000+ Fluent SVG icons (filled + outlined), loaded on demand
- Search with debounce, Filled/Outlined tab switcher
- Paginated grid (48/page) with Show More
- **Favorites sidebar** — add/remove individually or bulk, download all as ZIP (lazy-loaded jszip)
- **Preview sidebar** — color picker, live SVG preview, copy SVG/Vue/React snippet with syntax highlighting, download as SVG/PNG/Vue/React via split button
- Dark/light theme toggle, Buy Me a Coffee widget
- Catppuccin-themed UI with adaptive borders and shadows

## Project Structure

```
├── public/
│   ├── icons/
│   │   ├── fluent/          — Cleaned SVG files (filled + outlined)
│   │   └── material/        — Material icon SVGs (if any)
│   ├── data/
│   │   ├── filled.json      — Icon metadata index (filled variant)
│   │   └── outlined.json    — Icon metadata index (outlined variant)
│   └── ...
├── src/
│   ├── components/
│   │   ├── Hero.astro        — Static hero section
│   │   ├── Navbar.tsx        — Search, tabs, theme toggle (Preact)
│   │   ├── IconGrid.tsx      — JSON loading, filtering, pagination (Preact)
│   │   ├── IconCard.tsx      — Single card with fav/selected borders (Preact)
│   │   ├── FavoritesSidebar.tsx — Favorites list, bulk ops, ZIP download (Preact)
│   │   ├── PreviewSidebar.tsx — Preview, color picker, copy/download (Preact)
│   │   └── SvgIcon.tsx       — Async SVG loader with cache (Preact)
│   ├── layouts/
│   │   └── BaseLayout.astro  — Shared page shell (meta, fonts, global styles)
│   ├── lib/
│   │   ├── store.ts          — Signal-based shared state (@preact/signals)
│   │   └── iconManager.ts    — SVG fetch/cache, component converters, download utils
│   ├── styles/
│   │   └── global.css        — Tailwind v4 theme, Catppuccin variables, utilities
│   └── pages/
│       └── index.astro       — Page shell, assembles all islands
├── scripts/
│   └── update-icons.mjs      — Icon pipeline: extract, clean, generate components
├── astro.config.mjs          — Astro + Preact + Tailwind v4 config
├── tsconfig.json             — TypeScript strict config (extends astro/tsconfigs/strict)
└── package.json

## Commands

| Command | Action |
|---------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server at `localhost:4321` |
| `npm run build` | Build to `./dist/` |
| `npm run preview` | Preview production build |

## Performance

- Total client JS (all islands + Preact runtime + signals): ~60KB pre-compression
- SVGs loaded on demand and cached in-memory
- `jszip` lazy-loaded only on download
- Catppuccin CSS variables eliminate `dark:` utility duplication (~40% fewer classes)

### Updating icons from the source

First clone [fluentui-system-icons](https://github.com/microsoft/fluentui-system-icons) alongside this project, then run:

```bash
cd ~/Projects/fluent-icons-viewer && node scripts/update-icons.mjs ~/Projects/fluentui-system-icons --force
```

This will:

- Scan the Microsoft project for all 24px filled/regular SVGs.
- Clean them with SVGO and copy them to `public/icons/fluent/`.
- Generate Vue components in `components/FluentIcon/{Filled,Outlined}/`.
- Update `assets/icons/{filled,outlined}.json` and `assets/icons/fluent/{filled,outlined}.json`.

Omit `--force` to only generate Vue components for new icons (skipping existing ones).

### SVG cleanup reference

The icons are cleaned with SVGO so they're ready for use in your own projects:

```bash
svgo -r ./**/SVG/*.svg -o ../cleaned
```

Only 24px icons are kept — Microsoft provides many sizes but only 24px filled/regular are used here:

```bash
find <FILEPATH> -type f ! -name "*24*"
```

Append `-delete` at the end of the `find` command to remove non-24px files.

### Donation

[![BuyMeACoffee](https://raw.githubusercontent.com/pachadotdev/buymeacoffee-badges/main/bmc-yellow.svg)](https://buymeacoffee.com/michyamrane)

## Attribution

- Icons by [Microsoft](https://github.com/microsoft/fluentui-system-icons)
- Original viewer by [Colton Griffith](https://github.com/coltongriffith/fluenticons)
