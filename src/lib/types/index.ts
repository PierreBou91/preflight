// lib/types/index.ts

export interface ChecklistItem {
	id: string;
	templateId: string;
	parentId: string | null;
	text: string;
	checked: boolean;
	order: number;
	completedAt?: number; // Timestamp when checked
}

export interface PreflightTemplate {
	id: string;
	workspaceId: string;
	name: string;
	order: number;
	pilot: string; // Creator
	description: string;
	createdAt: number;
	updatedAt: number;
	itemIds: string[]; // Root-level item IDs in order
}

export interface PreflightRecord {
	id: string;
	templateId: string;
	name: string; // Template name + timestamp
	pilot: string; // Person executing the checklist
	createdAt: number;
	completedAt?: number;
	elapsedMs: number; // Total elapsed time
	isPaused: boolean;
	resumedAt?: number; // Timestamp for timer calculation
	updatedAt?: number; // Last update timestamp
	items: Record<string, ChecklistItem>; // Snapshot with check states
}

export interface Workspace {
	id: string;
	name: string;
	order: number;
	createdAt: number;
	updatedAt: number;
}
