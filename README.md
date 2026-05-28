# Cigar Nexus

**An interactive visual map of the premium cigar industry** — exploring the relationships between brands, families, factories, and corporate owners across Nicaragua, the Dominican Republic, and beyond.

![Cigar Nexus](https://github.com/ameilius/cigars/raw/main/index.html)

## ✨ Features

- **Force-directed graph** — Drag nodes, zoom, and pan to explore the network
- **Rich details drawer** — Click any node to see descriptions, connections, and context
- **Powerful search & filters** — Find brands instantly or filter by ownership type (Family-Owned / Corporate) and country
- **Curated data** — All relationships are maintained directly in `data.js` for accuracy and control
- **Beautiful, responsive UI** — Built with Tailwind CSS and D3.js

## 🚀 Getting Started

This project is split into clean, maintainable files with **no build step** required. Open directly in any browser.

### Open Locally (Recommended)
1. Download or clone this repository
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari)

The app consists of:
- `index.html` – Light HTML shell + structure
- `styles.css` – All custom cigar-lounge styling
- `data.js` – The core researched graph data (nodes & links)
- `script.js` – Full D3.js visualization, filters, drawers, search, and interactions

### Option 2: View Online
If this repo is hosted via GitHub Pages or similar, you can view it directly in the browser.

## 🧠 The Data

The graph contains curated, real-world relationships between major players in the premium non-Cuban cigar world, including:

- **Family-owned operations**: Padrón, My Father, Espinosa, Arturo Fuente, A.J. Fernandez, and many more
- **Corporate groups**: Davidoff (Oettinger), STG (General Cigar, Forged), Scandinavian Tobacco Group
- **Factories & people**: La Zona, Tabacos Cubanica, Tabafuente, Pepín García, Erik Espinosa, José Orlando Padrón, etc.

The data focuses on ownership, manufacturing partnerships, and historical connections.

> **Note**: This is a curated visualization. All data lives in `data.js`. To add or correct relationships, edit the data file directly.

## 🛠 Tech Stack

- **D3.js v7** — Force simulation, zooming, dragging, and rendering
- **Tailwind CSS** (via CDN) — Modern, responsive styling
- **Vanilla JavaScript** — No frameworks, fully self-contained
- **No persistence** — Data is static in `data.js` for full author control

## 🤝 Contributing

Contributions are welcome! Whether you have corrections to existing relationships, new verified connections, or UI improvements:

- Fork the repo
- Edit `data.js` to expand the graph or correct relationships
- Tweak `script.js` or `styles.css` for behavior / visual changes
- Submit a pull request

The project is intentionally kept as a simple multi-file static site (no bundler) so anyone can open it instantly.

Please keep data changes factual and well-sourced when possible.

## 📜 License

This project is currently unlicensed. All rights reserved by the original author.

## 🙏 Acknowledgments

This visualization was built to help enthusiasts better understand the surprisingly interconnected world of premium cigar manufacturing and ownership. Special thanks to the many cigar makers, blenders, and factory owners who have shaped the modern industry.

---

**Made with ❤️ for cigar lovers and industry historians.**