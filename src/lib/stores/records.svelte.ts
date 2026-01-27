// lib/stores/records.svelte.ts
import { db } from '$lib/db';
import type { ChecklistItem, ChecklistStatus, PreflightRecord } from '$lib/types';
import { getItemStatus, isTerminalStatus, toggleItem as toggleCascade } from '$lib/utils/checkboxTree';
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
			itemsMap[item.id] = { ...item, status: 'unchecked', checked: false, justification: undefined };
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

	async toggleItem(recordId: string, itemId: string, status: ChecklistStatus, justification?: string) {
		const record = await db.records.get(recordId);
		if (!record) return;

		const updatedItems = toggleCascade(itemId, record.items, status, justification);
		const allCompleted = Object.values(updatedItems).every((item) =>
			isTerminalStatus(getItemStatus(item))
		);
		const now = Date.now();
		const completedAt = allCompleted ? record.completedAt ?? now : undefined;
		const updates: Partial<PreflightRecord> = {
			items: updatedItems,
			completedAt,
			updatedAt: now
		};

		if (allCompleted && !record.completedAt) {
			const resumedAt = record.resumedAt ?? record.createdAt;
			const elapsedMs = record.isPaused ? record.elapsedMs : record.elapsedMs + (now - resumedAt);
			updates.elapsedMs = elapsedMs;
			updates.isPaused = true;
			updates.resumedAt = now;
		}

		await db.records.update(recordId, updates);
	}

	async updateJustification(recordId: string, itemId: string, justification: string) {
		const record = await db.records.get(recordId);
		if (!record) return;
		const items = { ...record.items };
		const item = items[itemId];
		if (!item) return;

		items[itemId] = {
			...item,
			justification:
				getItemStatus(item) === 'failed' || getItemStatus(item) === 'notApplicable'
					? justification.trim() || undefined
					: undefined
		};

		await db.records.update(recordId, { items, updatedAt: Date.now() });
	}

	async updateTimer(recordId: string, elapsedMs: number, resumedAt: number, isPaused: boolean) {
		await db.records.update(recordId, { elapsedMs, resumedAt, isPaused });
	}

	async delete(id: string) {
		await db.records.delete(id);
	}
}

export const recordStore = new RecordStore();
