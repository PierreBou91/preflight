# Preflight

**A modern, local-first checklist manager** built for focused execution and complete data portability. Organize complex workflows into hierarchical templates, track execution with integrated timers, and maintain full control over your data.

🌐 **Live**: [preflight.pbou.dev](https://preflight.pbou.dev/)

## ✨ Features

### Workspace Management

- **Multiple Workspaces**: Organize templates into separate workspaces for different contexts
- **Drag-and-Drop Reordering**: Intuitive workspace and template organization
- **Quick Search**: Filter templates by name or description

### Hierarchical Templates

- **Nested Items**: Build complex checklists with unlimited nesting depth
- **Visual Hierarchy**: Clear indentation and parent-child relationships
- **Inline Editing**: Edit item text directly in the tree
- **Smart Checkbox Logic**: Parent checkboxes automatically reflect child states (checked, unchecked, indeterminate)

### Active Execution

- **Integrated Timer**: Track elapsed time with pause/resume functionality
- **Pilot Attribution**: Assign checklist runs to specific pilots/operators
- **Completion Tracking**: Automatic timestamps for each completed item
- **Run History**: View and analyze past checklist executions

### Data Portability

- **Full Export**: Export entire workspaces including templates, items, and execution records
- **JSON Format**: Human-readable, versioned export format
- **Import Options**: Merge or replace when importing data
- **Local-First**: All data stored in browser IndexedDB, no cloud required

### Design

- **Brutalist Aesthetic**: High-contrast dark theme with sharp, geometric design
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile
- **Keyboard Navigation**: Full keyboard support for power users
- **Accessible**: Built with accessibility best practices

## 🛠️ Tech Stack

| Layer           | Technology                                                             | Purpose                                     |
| --------------- | ---------------------------------------------------------------------- | ------------------------------------------- |
| **Framework**   | [Svelte 5](https://svelte.dev/) + [SvelteKit](https://kit.svelte.dev/) | Reactive UI with minimal runtime overhead   |
| **Runtime**     | [Bun](https://bun.sh/)                                                 | Fast JavaScript runtime and package manager |
| **Database**    | [Dexie.js](https://dexie.org/)                                         | IndexedDB wrapper with reactive queries     |
| **Styling**     | [Tailwind CSS 4](https://tailwindcss.com/)                             | Utility-first CSS framework                 |
| **Icons**       | [Lucide Svelte](https://lucide.dev/)                                   | Beautiful, consistent icon set              |
| **Drag & Drop** | [svelte-dnd-action](https://github.com/isaacHagoel/svelte-dnd-action)  | Native Svelte drag-and-drop                 |
| **Testing**     | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/)  | Unit and E2E testing                        |
| **Deployment**  | [Dokploy](https://dokploy.com/) + [Nixpacks](https://nixpacks.com/)    | Containerized deployment                    |

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20 (or [Bun](https://bun.sh/) >= 1.0)
- **Package Manager**: Bun (recommended) or npm/pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/PierreBou91/preflight
cd preflight

# Install dependencies
bun install
```

### Development

```bash
# Start development server (default: http://localhost:5173)
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Type checking
bun run check

# Linting and formatting
bun run lint
bun run format

# Run tests
bun run test          # Run all tests
bun run test:unit     # Unit tests only
bun run test:e2e      # E2E tests only
```

### Production

```bash
# Build the application
bun run build

# Start production server
bun start
```

## 📁 Project Structure

```
preflight/
├── src/
│   ├── lib/
│   │   ├── components/          # Reusable Svelte components
│   │   │   ├── ChecklistTree.svelte
│   │   │   ├── ConfirmationModal.svelte
│   │   │   ├── ImportModal.svelte
│   │   │   ├── PilotModal.svelte
│   │   │   ├── RunTimer.svelte
│   │   │   ├── RunView.svelte
│   │   │   ├── TemplateEditor.svelte
│   │   │   └── WorkspaceNav.svelte
│   │   ├── db/                  # Database layer
│   │   │   └── index.ts         # Dexie schema and setup
│   │   ├── stores/              # Svelte 5 runes-based stores
│   │   │   ├── items.svelte.ts
│   │   │   ├── records.svelte.ts
│   │   │   ├── templates.svelte.ts
│   │   │   └── workspace.svelte.ts
│   │   ├── types/               # TypeScript definitions
│   │   │   └── index.ts
│   │   └── utils/               # Utility functions
│   │       ├── checkboxTree.ts  # Hierarchical checkbox logic
│   │       ├── fileActions.ts   # File download helpers
│   │       ├── json.ts          # Import/export serialization
│   │       └── time.ts           # Time formatting utilities
│   ├── routes/                  # SvelteKit routes
│   │   ├── +layout.svelte       # App shell
│   │   ├── +page.svelte         # Dashboard
│   │   ├── history/             # Execution history
│   │   ├── run/[id]/            # Active checklist execution
│   │   └── templates/[id]/      # Template editor
│   ├── app.html                 # HTML template
│   └── app.d.ts                 # Type definitions
├── static/                      # Static assets
├── build/                        # Production build output
├── e2e/                         # Playwright E2E tests
├── svelte.config.js             # SvelteKit configuration
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── package.json
```

## 💡 Usage

### Creating a Workspace

1. Click the workspace switcher in the sidebar
2. Click "New Workspace" or the "+" button
3. Enter a workspace name
4. The workspace becomes active automatically

### Building a Template

1. From the dashboard, click "New Template"
2. Enter template name, description, and pilot name
3. Add items using the "+" button
4. Create nested items by dragging items to the right (indent)
5. Reorder items by dragging them up or down
6. Changes are auto-saved to IndexedDB

### Running a Checklist

1. From the dashboard, click the play button on a template
2. Enter the pilot name for this execution
3. The timer starts automatically
4. Check items as you complete them
5. Parent items automatically reflect child completion states
6. Pause/resume the timer as needed
7. When all items are checked, the run is marked complete

### Importing/Exporting Data

**Export:**

1. Open the workspace navigation sidebar
2. Click the export button
3. A JSON file is downloaded with all workspace data

**Import:**

1. Open the workspace navigation sidebar
2. Click the import button
3. Choose "Merge" (add to existing) or "Replace" (overwrite)
4. Select a Preflight JSON export file
5. Data is imported and validated automatically

## 🧪 Testing

No testing yet

## 🚢 Deployment

Preflight is configured for deployment with:

- **Adapter**: `svelte-adapter-bun` for Bun runtime
- **Build**: Standard SvelteKit production build
- **Container**: Nixpacks configuration for containerized deployment

The application runs as a standalone server using Bun, serving both the API routes and static assets.

## 🏗️ Architecture

### Data Model

Preflight uses a **flat, normalized data structure** for efficient lookups and updates:

- **Workspaces**: Top-level organization containers
- **Templates**: Reusable checklist definitions
- **Items**: Individual checklist items (stored flat with `parentId` references)
- **Records**: Execution snapshots with completion states and timing

### State Management

- **Svelte 5 Runes**: `$state()` and `$derived()` for reactive state
- **Dexie Live Queries**: Reactive database queries that update UI automatically
- **Single Source of Truth**: IndexedDB is the canonical data store

### Checkbox Cascade Logic

The hierarchical checkbox behavior implements:

- **Downward Cascade**: Checking a parent checks all descendants
- **Upward Propagation**: All children checked → parent auto-checks
- **Indeterminate State**: Partially checked parents show indeterminate state
