// lib/stores/records.svelte.ts
import { db } from '$lib/db';
import type { ChecklistItem, PreflightRecord } from '$lib/types';
import { toggleItem as toggleCascade } from '$lib/utils/checkboxTree';
import { liveQuery } from 'dexie';

class RecordStore {
	records = $state<PreflightRecord[]>([]);
	activeRecordId = $state<string | null>(null);

	constructor() {}

	subscribe() {
		$effect(() => {
			const subscription = liveQuery(() =>
				db.records.orderBy('createdAt').reverse().toArray()
			).subscribe((items) => {
				this.records = items;
			});

			return () => subscription.unsubscribe();
		});
	}

	async start(templateId: string, pilot?: string) {
		const template = await db.templates.get(templateId);
		if (!template) throw new Error('Template not found');

		const templateItems = await db.items.where('templateId').equals(templateId).toArray();
		const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
		const now = Date.now();

		const itemsMap: Record<string, ChecklistItem> = {};
		templateItems.forEach((item) => {
			itemsMap[item.id] = { ...item, checked: false };
		});

		const newRecord: PreflightRecord = {
			id,
			templateId,
			name: `${template.name} - ${new Date().toLocaleString()}`,
			pilot: pilot || template.pilot || 'Anonymous',
			createdAt: now,
			elapsedMs: 0,
			isPaused: false,
			resumedAt: now,
			items: itemsMap
		};

		await db.records.add(newRecord);
		this.activeRecordId = id;
		return id;
	}

	async toggleItem(recordId: string, itemId: string) {
		const record = await db.records.get(recordId);
		if (!record) return;

		const isChecked = !record.items[itemId].checked;
		const updatedItems = toggleCascade(itemId, record.items, isChecked);
		
		const allCompleted = Object.values(updatedItems).every((item) => item.checked);
		const completedAt = allCompleted ? Date.now() : undefined;

		await db.records.update(recordId, { 
			items: updatedItems,
			completedAt,
			updatedAt: Date.now() // Optional, but good for tracking
		});
	}

	async updateTimer(recordId: string, elapsedMs: number, resumedAt: number, isPaused: boolean) {
		await db.records.update(recordId, { elapsedMs, resumedAt, isPaused });
	}

	async delete(id: string) {
		await db.records.delete(id);
	}
}

export const recordStore = new RecordStore();
