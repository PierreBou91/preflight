# Technical Blueprint for Preflight: A Modern Checklist Manager

Building a stateless, tool-based checklist application demands a stack that prioritizes **code simplicity** while delivering a polished, responsive experience. After extensive research across frameworks, libraries, and architectural patterns, this plan provides a complete roadmap optimized for maintainability and developer experience.

## The technology stack recommendation

**Svelte 5 with SvelteKit** emerges as the optimal framework choice for Preflight. The framework's compiler-based approach eliminates runtime overhead while delivering the cleanest code for handling hierarchical checkbox relationships. Variables become reactive by default—checking a nested checkbox simply requires assignment rather than immutable state gymnastics.

The complete recommended stack:

| Layer         | Technology            | Rationale                                                                        |
| ------------- | --------------------- | -------------------------------------------------------------------------------- |
| Framework     | **SvelteKit**         | 72.8% developer satisfaction, ~8KB runtime, deep reactivity built-in             |
| TOML          | **smol-toml**         | Actively maintained (Nov 2025), 2-4x faster than alternatives, native TypeScript |
| Persistence   | **Dexie.js**          | IndexedDB wrapper with reactive queries, schema migrations, ~140KB               |
| Drag-and-Drop | **svelte-dnd-action** | Native Svelte integration, nested sortable support, excellent accessibility      |
| Styling       | **Tailwind CSS**      | Utility-first enables square aesthetic, ~15KB purged                             |
| Icons         | **Lucide Svelte**     | Clean monoline icons matching minimalist aesthetic                               |

Bundle size for the full stack lands around **35-45KB gzipped**—substantially lighter than React equivalents while delivering superior developer experience for this use case.

## Why Svelte wins for hierarchical checkboxes

The parent-child checkbox behavior Preflight requires becomes remarkably elegant in Svelte 5. Where React demands careful state immutability and useReducer patterns, Svelte's fine-grained reactivity handles nested mutations automatically:

```svelte
<script>
	let items = $state([
		{
			id: '1',
			text: 'Preflight',
			checked: false,
			children: [
				{ id: '1a', text: 'Fuel check', checked: false },
				{ id: '1b', text: 'Oil level', checked: false }
			]
		}
	]);

	function toggleParent(item) {
		item.checked = !item.checked;
		item.children?.forEach((child) => (child.checked = item.checked));
	}
</script>

<input type="checkbox" bind:checked={item.checked} />
```

The `bind:checked` directive provides two-way binding without boilerplate. Svelte's reactivity system automatically tracks changes at any nesting depth—no spread operators, no immer, no useCallback dependencies to manage.

## Data architecture using flat normalized structures

Following React's official guidance for complex trees, Preflight should flatten nested data into a normalized structure with ID references. This pattern simplifies updates, enables efficient lookups, and integrates cleanly with IndexedDB:

```typescript
// lib/types/index.ts
interface ChecklistItem {
  id: string;
  parentId: string | null;
  text: string;
  checked: boolean;
  order: number;
  completedAt?: number;  // Timestamp when checked
}

interface PreflightTemplate {
  id: string;
  name: string;
  pilot: string;        // Creator
  description: string;
  createdAt: number;
  updatedAt: number;
  itemIds: string[];    // Root-level item IDs in order
}

interface PreflightRecord {
  id: string;
  templateId: string;
  name: string;         // Template name + timestamp
  createdAt: number;
  completedAt?: number;
  elapsedMs: number;    // Total elapsed time
  isPaused: boolean;
  items: Record<string, ChecklistItem>;  // Snapshot with check states
}

interface Workspace {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}
```

Storing items in a `Record<string, ChecklistItem>` rather than nested arrays enables **O(1) lookups** when toggling checkboxes or reordering via drag-and-drop. Children are retrieved by filtering on `parentId`.

## Persistence layer with Dexie.js

Dexie provides a dramatically simpler API than raw IndexedDB while supporting reactive queries via `liveQuery()`:

```typescript
// lib/db/index.ts
import Dexie, { type Table } from 'dexie';

export class PreflightDB extends Dexie {
  workspaces!: Table<Workspace>;
  templates!: Table<PreflightTemplate>;
  items!: Table<ChecklistItem>;
  records!: Table<PreflightRecord>;

  constructor() {
    super('PreflightDB');
    this.version(1).stores({
      workspaces: '++id, name',
      templates: '++id, workspaceId, name, createdAt',
      items: '++id, templateId, parentId, order',
      records: '++id, templateId, createdAt, completedAt'
    });
  }
}

export const db = new PreflightDB();
```

Auto-saving triggers on every state change using Svelte's `$effect`:

```svelte
<script>
	import { db } from '$lib/db';

	$effect(() => {
		// Debounced auto-save whenever items change
		db.items.bulkPut(Object.values($items));
	});
</script>
```

**Why Dexie over localStorage**: The **5-10MB localStorage limit** would constrain workspaces with many templates. IndexedDB offers gigabytes of quota-managed storage. Dexie's `liveQuery()` enables reactive UI updates without manual subscription management—critical for real-time checklist interactions.

## TOML export and import implementation

**smol-toml** handles serialization with native TypeScript support and the smallest bundle footprint:

```typescript
// lib/utils/export.ts
import { stringify, parse } from 'smol-toml';

export function exportWorkspace(workspace: Workspace, templates: PreflightTemplate[], records: PreflightRecord[]): string {
  return stringify({
    preflight: { version: '1.0', exportedAt: new Date().toISOString() },
    workspace: {
      id: workspace.id,
      name: workspace.name,
      created: workspace.createdAt,
      updated: workspace.updatedAt
    },
    templates: templates.map(t => ({
      id: t.id,
      name: t.name,
      pilot: t.pilot,
      description: t.description,
      items: buildNestedItems(t.itemIds, t.items)
    })),
    records: records.map(r => ({
      id: r.id,
      template_id: r.templateId,
      name: r.name,
      created: r.createdAt,
      completed: r.completedAt,
      elapsed_ms: r.elapsedMs
    }))
  });
}

export function importWorkspace(tomlContent: string, mergeMode: 'replace' | 'merge' = 'merge') {
  const data = parse(tomlContent);
  // Validate structure, handle ID conflicts for merge mode
  return validateAndTransform(data);
}
```

**TOML structure for Preflight files**:

```toml
[preflight]
version = "1.0"
exported_at = 2026-01-04T15:30:00Z

[workspace]
id = "ws-abc123"
name = "Commercial Flight Ops"
created = 2026-01-01T10:00:00Z

[[templates]]
id = "tmpl-001"
name = "Pre-Departure Checklist"
pilot = "J. Smith"
description = "Standard pre-departure items"

[[templates.items]]
id = "item-001"
text = "Documents and paperwork"
order = 1

[[templates.items.children]]
id = "item-001a"
text = "Flight plan filed"
order = 1

[[records]]
id = "rec-001"
template_id = "tmpl-001"
name = "Pre-Departure Checklist - 2026-01-04 08:30"
created = 2026-01-04T08:30:00Z
completed = 2026-01-04T09:15:00Z
elapsed_ms = 2700000
```

## Drag-and-drop with svelte-dnd-action

The `svelte-dnd-action` library provides production-ready nested sortable support through Svelte's action directive system:

```svelte
<!-- lib/components/ChecklistTree.svelte -->
<script>
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';

	let { items = $bindable(), onReorder } = $props();

	function handleSort(e) {
		items = e.detail.items;
		onReorder?.(items);
	}
</script>

<ul use:dndzone={{ items, flipDurationMs: 200 }} on:consider={handleSort} on:finalize={handleSort}>
	{#each items as item (item.id)}
		<li animate:flip={{ duration: 200 }}>
			<ChecklistItem {item} />
			{#if item.children?.length}
				<svelte:self items={item.children} />
			{/if}
		</li>
	{/each}
</ul>
```

**Indentation via drag target zones**: Implement indent/outdent by detecting horizontal drag position. When an item is dragged right of the preceding item's left edge, it becomes a child. The library's `dropTargetStyle` option enables visual feedback during these operations.

## Hierarchical checkbox cascade logic

The parent-child auto-checking requires bidirectional propagation:

```typescript
// lib/utils/checkboxTree.ts
export function toggleItem(itemId: string, items: Record<string, ChecklistItem>, checked: boolean): Record<string, ChecklistItem> {
  const updated = { ...items };

  // 1. Set this item
  updated[itemId] = { ...updated[itemId], checked, completedAt: checked ? Date.now() : undefined };

  // 2. Cascade down to all descendants
  const descendants = getDescendants(itemId, items);
  descendants.forEach(id => {
    updated[id] = { ...updated[id], checked, completedAt: checked ? Date.now() : undefined };
  });

  // 3. Propagate up through ancestors
  let currentId = items[itemId].parentId;
  while (currentId) {
    const siblings = getSiblings(currentId, updated);
    const allChecked = siblings.every(s => s.checked);
    updated[currentId] = { ...updated[currentId], checked: allChecked };
    currentId = updated[currentId].parentId;
  }

  return updated;
}

export function getIndeterminateState(itemId: string, items: Record<string, ChecklistItem>): boolean {
  const children = Object.values(items).filter(i => i.parentId === itemId);
  if (children.length === 0) return false;
  const checkedCount = children.filter(c => c.checked).length;
  return checkedCount > 0 && checkedCount < children.length;
}
```

Setting the indeterminate visual state requires JavaScript since HTML has no attribute for it:

```svelte
<script>
	let checkboxRef;
	$effect(() => {
		if (checkboxRef) {
			checkboxRef.indeterminate = getIndeterminateState(item.id, $items);
		}
	});
</script>

<input type="checkbox" bind:this={checkboxRef} bind:checked={item.checked} />
```

## Timer with pause and resume

```svelte
<!-- lib/components/RecordTimer.svelte -->
<script>
	let { record = $bindable() } = $props();

	let intervalId = $state(null);
	let displayTime = $state('00:00:00');

	function tick() {
		const total = record.elapsedMs + (record.isPaused ? 0 : Date.now() - record.resumedAt);
		displayTime = formatDuration(total);
	}

	function togglePause() {
		if (record.isPaused) {
			record.resumedAt = Date.now();
			record.isPaused = false;
			intervalId = setInterval(tick, 100);
		} else {
			record.elapsedMs += Date.now() - record.resumedAt;
			record.isPaused = true;
			clearInterval(intervalId);
		}
	}

	$effect(() => {
		if (!record.isPaused) {
			intervalId = setInterval(tick, 100);
		}
		return () => clearInterval(intervalId);
	});
</script>

<div class="timer font-mono text-lg">
	{displayTime}
	<button onclick={togglePause}>
		{record.isPaused ? 'Resume' : 'Pause'}
	</button>
</div>
```

**Key implementation detail**: Store `resumedAt` timestamp rather than continuously incrementing. This approach survives page refreshes and provides accurate elapsed time calculation.

## Visual design system: Square brutalist aesthetic

The specified minimalist, nerdy aesthetic maps well to a **Dracula-inspired** palette with sharp corners:

```css
/* app.css */
:root {
	/* Dracula-based dark palette */
	--bg-primary: #1e1e2e;
	--bg-secondary: #282a36;
	--bg-elevated: #343746;
	--text-primary: #f8f8f2;
	--text-secondary: #6272a4;

	/* Eccentric accent: Electric purple */
	--accent: #bd93f9;
	--accent-hover: #caa8ff;

	/* Semantic colors */
	--success: #50fa7b;
	--warning: #ffb86c;
	--error: #ff5555;

	/* No rounded corners */
	--radius: 0;
}

* {
	border-radius: 0;
}

/* Neo-brutalist card shadows */
.card {
	background: var(--bg-secondary);
	border: 2px solid var(--text-secondary);
	box-shadow: 4px 4px 0 var(--accent);
}

/* Monospace for nerdy feel */
body {
	font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}
```

**Tailwind configuration** to enforce the aesthetic:

```javascript
// tailwind.config.js
export default {
	theme: {
		borderRadius: {
			none: '0',
			DEFAULT: '0',
			sm: '0',
			md: '0',
			lg: '0'
		},
		extend: {
			colors: {
				bg: { primary: '#1e1e2e', secondary: '#282a36', elevated: '#343746' },
				accent: { DEFAULT: '#bd93f9', hover: '#caa8ff' },
				success: '#50fa7b'
			},
			fontFamily: {
				mono: ['JetBrains Mono', 'Fira Code', 'monospace']
			}
		}
	}
};
```

## Recommended file structure

```
preflight/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ChecklistItem.svelte    # Single item with checkbox
│   │   │   ├── ChecklistTree.svelte    # Recursive tree with drag-drop
│   │   │   ├── TemplateEditor.svelte   # Create/edit templates
│   │   │   ├── RecordView.svelte       # Active checklist execution
│   │   │   ├── Timer.svelte            # Elapsed time display
│   │   │   ├── ImportModal.svelte      # File drop / URL import
│   │   │   └── WorkspaceNav.svelte     # Workspace switching
│   │   ├── stores/
│   │   │   ├── workspace.svelte.ts     # Active workspace state
│   │   │   ├── templates.svelte.ts     # Template CRUD operations
│   │   │   └── records.svelte.ts       # Record state and timer
│   │   ├── db/
│   │   │   └── index.ts                # Dexie database setup
│   │   ├── utils/
│   │   │   ├── checkboxTree.ts         # Cascade logic
│   │   │   ├── export.ts               # TOML export
│   │   │   ├── import.ts               # TOML import and merge
│   │   │   └── time.ts                 # Duration formatting
│   │   └── types/
│   │       └── index.ts                # TypeScript interfaces
│   ├── routes/
│   │   ├── +page.svelte                # Main dashboard
│   │   ├── +layout.svelte              # App shell with nav
│   │   ├── templates/
│   │   │   ├── +page.svelte            # Template list
│   │   │   ├── [id]/+page.svelte       # Edit template
│   │   │   └── new/+page.svelte        # Create template
│   │   └── records/
│   │       ├── +page.svelte            # Record history
│   │       └── [id]/+page.svelte       # Active record view
│   ├── app.css
│   └── app.html
├── static/
│   └── default-templates/              # Bundled starter templates
├── tailwind.config.js
├── svelte.config.js
└── package.json
```

## Phased implementation strategy

### Phase 1: Foundation (Week 1)

Set up SvelteKit project, Tailwind configuration with square aesthetic, Dexie database schema, and TypeScript types. Implement basic CRUD for workspaces and templates without nesting.

**Prompt for Claude:**

> "Create a SvelteKit project with Tailwind CSS configured for a square, brutalist dark theme using the Dracula color palette. Set up Dexie.js with tables for workspaces, templates, items, and records. Include TypeScript interfaces matching this schema: [paste types]. Create a basic layout with workspace navigation and template list view. No drag-and-drop yet—focus on the data layer and styling foundation."

### Phase 2: Template Editor with Hierarchy (Week 2)

Build the template creation UI with nested items, drag-and-drop reordering via svelte-dnd-action, and indentation support.

**Prompt for Claude:**

> "Add a template editor component to Preflight. Use svelte-dnd-action for drag-and-drop reordering of checklist items. Implement nested items with visual indentation (use padding-left based on depth). Include: add item button, delete item, edit item text inline, drag to reorder, drag right to indent (make child of above item), drag left to outdent. Store items in flat structure with parentId references. Auto-save to Dexie on every change."

### Phase 3: Record Execution and Timer (Week 3)

Implement template instantiation into records, hierarchical checkbox behavior, timer with pause/resume, and completion tracking.

**Prompt for Claude:**

> "Create the record execution view for Preflight. When starting a new record from a template: clone template items into record, generate name as 'Template Name - YYYY-MM-DD HH:mm', start elapsed timer. Implement checkbox cascade: checking parent checks all children, checking all children auto-checks parent, show indeterminate state when partially checked. Add per-item completion timestamps. Include pause/resume timer button. Mark record complete when all items checked."

### Phase 4: Import/Export (Week 4)

Add TOML serialization with smol-toml, file drop zone, URL import, and merge logic for partial imports.

**Prompt for Claude:**

> "Implement TOML import/export for Preflight using smol-toml. Export should create a file with [preflight] version header, [workspace] metadata, [[templates]] array with nested items, and [[records]] array. Import via file drop zone or URL input. Support three import modes: full workspace replacement, merge (add new items, skip existing IDs), and single template import. Handle orphaned records (template deleted) by moving to 'Orphaned' workspace. Validate TOML structure before importing."

### Phase 5: Polish and Edge Cases (Week 5)

Handle orphaned data, multiple workspace navigation, keyboard accessibility, and performance optimization for large checklists.

**Prompt for Claude:**

> "Add finishing touches to Preflight: keyboard navigation (Tab through items, Space to toggle, Arrow keys to move between items), workspace switcher dropdown, 'Orphaned' workspace for records whose templates were deleted, confirmation dialogs for destructive actions, loading states, and error handling. Optimize svelte-dnd-action for templates with 100+ items using virtualization if needed."

## Code simplicity patterns to follow

**1. Colocate related code**: Keep component logic, template, and styles in single `.svelte` files. Avoid premature abstraction—extract utilities only when used in 3+ places.

**2. Use Svelte 5 runes over stores for local state**: `$state()` and `$derived()` provide cleaner syntax than writable/readable stores for component-local state.

**3. Prefer computed over imperative**: Use `$derived()` for values calculated from state rather than manually syncing in effects.

**4. Type everything at boundaries**: Define TypeScript interfaces for database entities and component props, but avoid over-typing internal implementation details.

**5. Single source of truth**: The Dexie database is the canonical state. UI state derives from database queries via `liveQuery()`. Never duplicate data in multiple stores.

This architecture delivers Preflight's full feature set in approximately **2,000-3,000 lines of application code**—a testament to Svelte's expressiveness and the careful selection of purpose-built libraries. The flat data model with ID references, combined with Dexie's reactive queries and svelte-dnd-action's native integration, creates an implementation that remains understandable as it scales.
