// lib/db/index.ts
import Dexie, { type Table } from 'dexie';
import type { ChecklistItem, PreflightRecord, PreflightTemplate, Workspace } from '../types';

export class PreflightDB extends Dexie {
	workspaces!: Table<Workspace>;
	templates!: Table<PreflightTemplate>;
	items!: Table<ChecklistItem>;
	records!: Table<PreflightRecord>;

	constructor() {
		super('PreflightDB');
		
		// Version 1: Using UUIDs as IDs, indexed order
		this.version(1).stores({
			workspaces: 'id, name, order',
			templates: 'id, workspaceId, name, order, createdAt',
			items: 'id, templateId, parentId, order',
			records: 'id, templateId, createdAt, completedAt'
		});

		// Version 2: Add checklist status/justification (no index changes)
		this.version(2)
			.stores({
				workspaces: 'id, name, order',
				templates: 'id, workspaceId, name, order, createdAt',
				items: 'id, templateId, parentId, order',
				records: 'id, templateId, createdAt, completedAt'
			})
			.upgrade(async (tx) => {
				const normalizeItem = (item: ChecklistItem) => {
					const status = item.status ?? (item.checked ? 'validated' : 'unchecked');
					item.status = status;
					item.checked = status === 'validated';
					if (status !== 'failed' && status !== 'notApplicable') {
						item.justification = undefined;
					}
					if (status === 'unchecked') {
						item.completedAt = undefined;
					}
				};

				await tx.table('items').toCollection().modify((item) => {
					normalizeItem(item as ChecklistItem);
				});

				await tx.table('records').toCollection().modify((record) => {
					if (!record.items) return;
					Object.values(record.items).forEach((item) => {
						normalizeItem(item as ChecklistItem);
					});
				});
			});
	}
}

export const db = new PreflightDB();
