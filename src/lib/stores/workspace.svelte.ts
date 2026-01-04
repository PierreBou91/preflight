// lib/stores/workspace.svelte.ts
import { db } from '$lib/db';
import type { ChecklistItem, PreflightRecord, PreflightTemplate, Workspace } from '$lib/types';
import { liveQuery } from 'dexie';

class WorkspaceStore {
  activeId = $state<string | null>(null);
  workspaces = $state<Workspace[]>([]);

  constructor() {}

  // Svelte 5 safe subscription called from layout
  subscribe() {
    $effect(() => {
      const subscription = liveQuery(async () => {
        try {
          return await db.workspaces.orderBy('order').toArray();
        } catch (err) {
          console.error('Dexie query error:', err);
          return await db.workspaces.toArray(); // Fallback to unsorted if index fails
        }
      }).subscribe((items) => {
        this.workspaces = items;
        if (items.length > 0 && !this.activeId) {
          this.activeId = items[0].id;
        }
      });
      
      return () => subscription.unsubscribe();
    });
  }

  setActive(id: string) {
    this.activeId = id;
  }

  async create(name: string) {
    try {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      const now = Date.now();
      const maxOrder = this.workspaces.reduce((max, w) => Math.max(max, w.order ?? -1), -1);
      
      const newWs: Workspace = {
        id,
        name,
        order: maxOrder + 1,
        createdAt: now,
        updatedAt: now
      };
      
      await db.workspaces.add(newWs);
      console.log('Workspace created:', newWs);
      this.activeId = id;
      return id;
    } catch (err) {
      console.error('Failed to create workspace:', err);
      throw err;
    }
  }

  async update(id: string, updates: Partial<Workspace>) {
    await db.workspaces.update(id, { ...updates, updatedAt: Date.now() });
  }

  async delete(id: string) {
    // Also delete templates and items associated with this workspace
    const templates = await db.templates.where('workspaceId').equals(id).toArray();
    for (const t of templates) {
      await db.items.where('templateId').equals(t.id).delete();
    }
    await db.templates.where('workspaceId').equals(id).delete();
    await db.workspaces.delete(id);
    
    if (this.activeId === id) {
      this.activeId = this.workspaces.find(w => w.id !== id)?.id || null;
    }
  }

  async reorder(orderedIds: string[]) {
    await db.transaction('rw', db.workspaces, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.workspaces.update(orderedIds[i], { order: i });
      }
    });
  }

  async importData(
    data: { workspace: Workspace; templates: PreflightTemplate[]; items: ChecklistItem[]; records: PreflightRecord[] },
    mode: 'merge' | 'replace'
  ) {
    await db.transaction('rw', [db.workspaces, db.templates, db.items, db.records], async () => {
      if (mode === 'replace') {
        // Delete current workspace and its data
        if (this.activeId) {
          await this.delete(this.activeId);
        }
        // Add new workspace
        await db.workspaces.add(data.workspace);
        this.activeId = data.workspace.id;
      }

      // If merge, we keep current workspace but add imported templates/items/records
      // We might need to rebasing template workspaceIds if merging into a different one
      const targetWorkspaceId = mode === 'replace' ? data.workspace.id : this.activeId;
      
      if (!targetWorkspaceId) throw new Error('No active workspace for import');

      for (const t of data.templates) {
        // Add template with linked workspaceId
        await db.templates.put({ ...t, workspaceId: targetWorkspaceId });
      }

      for (const item of data.items) {
        await db.items.put(item);
      }

      for (const rec of data.records) {
        await db.records.put({ ...rec, workspaceId: targetWorkspaceId } as any);
      }
    });
  }
}

export const workspaceStore = new WorkspaceStore();
