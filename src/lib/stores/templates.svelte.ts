// lib/stores/templates.svelte.ts
import { db } from '$lib/db';
import type { PreflightTemplate } from '$lib/types';
import { liveQuery } from 'dexie';
import { workspaceStore } from './workspace.svelte';

class TemplateStore {
  templates = $state<PreflightTemplate[]>([]);

  constructor() {}

  // Svelte 5 safe subscription called from layout
  subscribe() {
    $effect(() => {
      if (!workspaceStore.activeId) {
        this.templates = [];
        return;
      }

      const subscription = liveQuery(() => 
        db.templates
          .where('workspaceId')
          .equals(workspaceStore.activeId!)
          .sortBy('order')
      ).subscribe((items) => {
        this.templates = items;
      });

      return () => subscription.unsubscribe();
    });
  }

  async create(name: string, description: string = '') {
    if (!workspaceStore.activeId) return;

    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    const now = Date.now();
    const maxOrder = this.templates.reduce((max, t) => Math.max(max, t.order ?? -1), -1);

    const newTemplate: PreflightTemplate = {
      id,
      workspaceId: workspaceStore.activeId,
      name,
      order: maxOrder + 1,
      pilot: 'Anonymous',
      description,
      createdAt: now,
      updatedAt: now,
      itemIds: []
    };
    
    await db.templates.add(newTemplate);
    return id;
  }

  async delete(id: string) {
    await db.templates.delete(id);
    // Also delete associated items (Phase 2 will handle this more robustly)
    await db.items.where('templateId').equals(id).delete();
  }
}

export const templateStore = new TemplateStore();
