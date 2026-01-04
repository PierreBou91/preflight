# Preflight

**Modern Checklist Manager** for focused execution and data portability.

Live at: [preflight.pbou.dev](https://preflight.pbou.dev/)

## Features

- **Workspace Logic**: Organize templates into custom workspaces with drag-and-drop reordering.
- **Hierarchical Templates**: Build complex checklists with nested items and sub-tasks.
- **Active Execution**: Integrated timer with pause/resume functionality to track performance.
- **Portability**: Full JSON Import/Export support for entire workspaces or individual backups.
- **Local-First**: Powered by IndexedDB (Dexie) for fast, offline-capable persistence.
- **Brutalist Aesthetic**: Premium high-contrast dark mode with sharp, geometric design.

## Tech Stack

- **Framework**: [Svelte 5](https://svelte.dev/) + [SvelteKit](https://kit.svelte.dev/)
- **Runtime/Manager**: [Bun](https://bun.sh/)
- **Database**: [Dexie.js](https://dexie.org/) (IndexedDB)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide Svelte](https://lucide.dev/)
- **Deployment**: [Dokploy](https://dokploy.com/) via Nixpacks & svelte-adapter-bun

## Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Check for types and linting
bun run check
```
