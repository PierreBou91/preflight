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
	}
}

export const db = new PreflightDB();
