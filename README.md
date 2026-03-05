# gitrail

Interactive 3D visualization of git repository commit graphs. Paste any public GitHub repo URL and explore its history as a navigable 3D scene — like a subway map for your codebase.

## How it works

- **X-axis** — Time: commits flow left to right chronologically
- **Y-axis** — Elevation: feature branches arc upward, main stays at ground level
- **Z-axis** — Branches: each branch gets its own depth lane

Commit nodes are colored by contributor and sized by number of files changed. Edges connect parent-child commits, with merge commits shown as curved arcs between branches.

## Getting started

```bash
git clone https://github.com/vviggyy/gitrail.git
cd gitrail
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), paste a public GitHub repo URL (e.g. `github.com/expressjs/express`), and explore.

## Interactions

- **Orbit** — click and drag to rotate the scene
- **Zoom** — scroll to zoom in/out
- **Pan** — right-click drag to pan
- **Hover** — hover over a commit node to see details (hash, author, message, date)
- **Click** — click a node to pin its details
- **Branch filter** — toggle branches on/off in the sidebar

## Tech stack

- Next.js (React, TypeScript)
- React Three Fiber + drei (Three.js)
- Octokit (GitHub API)
- Tailwind CSS

## License

MIT
