# Cigar Nexus

**An interactive visual map of the premium cigar industry** — ownership, factories, families, and corporate groups across Nicaragua, the Dominican Republic, Honduras, Costa Rica, and beyond.

**Live:** [cigarnexus.app](https://cigarnexus.app/)

## Features

- Force-directed graph (D3.js) — drag, zoom, pan, filters, search
- Details drawer + shareable map permalinks (`/?node=…`)
- SEO pages for every node at `/node/[id]/`
- Curated graph data in `data.js` (no backend)

## Local development

```bash
# Optional: rebuild Tailwind + regenerate node pages + sitemap
npm run build:site

# Or open the map without a build
# open index.html in a modern browser (local file or any static server)
```

| Path | Role |
|------|------|
| `index.html` / `about.html` | Map shell + about |
| `data.js` | Nodes & links |
| `descriptions.js` | Short drawer copy (also SEO fallback) |
| `content/expanded/*.js` | Long-form SEO body overrides |
| `websites.js` | Official URLs for node pages |
| `affiliates.js` | Shop CTA shared by map + generator |
| `script.js` / `styles.css` | Map UI |
| `scripts/generate-node-pages.js` | Builds `/node/*` + `sitemap.xml` |
| `tailwind.css` | Built from `styles/tailwind-source.css` |

## Data & content

Edit `data.js` for relationships. Add drawer text in `descriptions.js` and long-form SEO in the matching file under `content/expanded/` (`brands.js`, `people.js`, `factories.js`, `corporate.js`). Then run `npm run build:site` before deploy.

Keep facts sourced when possible. This is a curated non-Cuban industry map, not an exhaustive directory.

## Tech

- D3.js v7, vanilla JS, Tailwind CSS (built, not CDN)
- Static site — GitHub Pages / any static host
- No bundler for the map runtime; Node only for CSS + page generation

## License

Unlicensed. All rights reserved by the original author.
