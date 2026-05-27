# Cigar Nexus

**An interactive visual map of the premium cigar industry** — exploring the relationships between brands, families, factories, and corporate owners across Nicaragua, the Dominican Republic, and beyond.

![Cigar Nexus](https://github.com/ameilius/cigars/raw/main/index.html)

## ✨ Features

- **Force-directed graph** — Drag nodes, zoom, and pan to explore the network
- **Rich details drawer** — Click any node to see descriptions, connections, and context
- **Powerful search & filters** — Find brands instantly or filter by ownership type (Family-Owned / Corporate) and country
- **Add your own connections** — Use the "Submit Connection" form to extend the graph. New nodes and links are saved locally in your browser
- **Beautiful, responsive UI** — Built with Tailwind CSS and D3.js

## 🚀 Getting Started

This is a completely self-contained single-file application. No build step, no server required.

### Option 1: Open Locally (Recommended)
1. Download or clone this repository
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari)

### Option 2: View Online
If this repo is hosted via GitHub Pages or similar, you can view it directly in the browser.

## 🧠 The Data

The graph contains curated, real-world relationships between major players in the premium non-Cuban cigar world, including:

- **Family-owned operations**: Padrón, My Father, Espinosa, Arturo Fuente, A.J. Fernandez, and many more
- **Corporate groups**: Davidoff (Oettinger), STG (General Cigar, Forged), Scandinavian Tobacco Group
- **Factories & people**: La Zona, Tabacos Cubanica, Tabafuente, Pepín García, Erik Espinosa, José Orlando Padrón, etc.

The data focuses on ownership, manufacturing partnerships, and historical connections.

> **Note**: This is a living visualization. The "Submit Connection" feature lets you experiment and extend the graph yourself. All additions are stored only in your browser's localStorage.

## 🛠 Tech Stack

- **D3.js v7** — Force simulation, zooming, dragging, and rendering
- **Tailwind CSS** (via CDN) — Modern, responsive styling
- **Vanilla JavaScript** — No frameworks, fully self-contained
- **localStorage** — Persistent user-added nodes and links

## 📝 Adding New Connections

1. Click **"Submit Connection"** in the header
2. Choose between:
   - Adding a new node and connecting it to an existing one
   - Connecting two existing nodes
3. Fill in the relationship type (e.g. "owned by", "manufactures at", "blended by")
4. Submit — the change is immediately visible and saved locally

## 🤝 Contributing

Contributions are welcome! Whether you have corrections to existing relationships, new verified connections, or UI improvements:

- Fork the repo
- Edit `index.html` directly (the entire app lives in one file)
- Submit a pull request

Please keep data changes factual and well-sourced when possible.

## 📜 License

This project is currently unlicensed. All rights reserved by the original author.

## 🙏 Acknowledgments

This visualization was built to help enthusiasts better understand the surprisingly interconnected world of premium cigar manufacturing and ownership. Special thanks to the many cigar makers, blenders, and factory owners who have shaped the modern industry.

---

**Made with ❤️ for cigar lovers and industry historians.**