// lib/stores/items.svelte.ts
import { db } from '$lib/db';
import type { ChecklistItem } from '$lib/types';
import { liveQuery } from 'dexie';

export interface ViewItem extends ChecklistItem {
  children: ViewItem[];
}

class ItemStore {
  items = $state<Record<string, ChecklistItem>>({});
  templateId = $state<string | null>(null);

  // Computed tree structure
  tree = $derived.by(() => {
    const flatItems = Object.values(this.items);
    const itemMap: Record<string, ViewItem> = {};
    const rootItems: ViewItem[] = [];

    // First pass: create ViewItems
    flatItems.forEach(item => {
      itemMap[item.id] = { ...item, children: [] };
    });

    // Second pass: build hierarchy
    flatItems.sort((a, b) => a.order - b.order).forEach(item => {
      const viewItem = itemMap[item.id];
      if (item.parentId && itemMap[item.parentId]) {
        itemMap[item.parentId].children.push(viewItem);
      } else {
        rootItems.push(viewItem);
      }
    });

    return rootItems;
  });

  subscribe(templateId: string) {
    this.templateId = templateId;
    $effect(() => {
      const subscription = liveQuery(() => 
        db.items.where('templateId').equals(templateId).sortBy('order')
      ).subscribe((items) => {
        const nextItems: Record<string, ChecklistItem> = {};
        items.forEach(item => {
          nextItems[item.id] = item;
        });
        this.items = nextItems;
      });

      return () => subscription.unsubscribe();
    });
  }

  async add(text: string = '', parentId: string | null = null) {
    if (!this.templateId) return;

    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    // Find max order among siblings
    const siblings = Object.values(this.items).filter(i => i.parentId === parentId);
    const maxOrder = siblings.reduce((max, i) => Math.max(max, i.order), -1);

    const newItem: ChecklistItem = {
      id,
      templateId: this.templateId,
      parentId,
      text,
      checked: false,
      order: maxOrder + 1
    };

    await db.items.add(newItem);
    return id;
  }

  async update(id: string, updates: Partial<ChecklistItem>) {
    await db.items.update(id, updates);
  }

  async delete(id: string) {
    // Recursive delete children
    const toDelete = [id];
    const findChildren = (pid: string) => {
      Object.values(this.items).forEach(item => {
        if (item.parentId === pid) {
          toDelete.push(item.id);
          findChildren(item.id);
        }
      });
    };
    findChildren(id);
    await db.items.bulkDelete(toDelete);
  }

  async reorder(orderedItems: ViewItem[], parentId: string | null = null) {
    await db.transaction('rw', db.items, async () => {
      for (let i = 0; i < orderedItems.length; i++) {
        const item = orderedItems[i];
        await db.items.update(item.id, { 
          order: i,
          parentId
        });
      }
    });
  }
}

export const itemStore = new ItemStore();
