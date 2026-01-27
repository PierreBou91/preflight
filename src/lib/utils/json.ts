import type { ChecklistItem, ChecklistStatus, PreflightRecord, PreflightTemplate, Workspace } from '$lib/types';

export interface PreflightExportJSON {
	preflight: {
		version: string;
		exportedAt: string;
	};
	workspace: Workspace;
	templates: PreflightTemplate[];
	items: ChecklistItem[];
	records: PreflightRecord[];
}

const TERMINAL_STATUSES = new Set<ChecklistStatus>(['validated', 'failed', 'notApplicable']);

function normalizeItem(item: ChecklistItem): ChecklistItem {
	const status = item.status ?? (item.checked ? 'validated' : 'unchecked');
	const normalized: ChecklistItem = {
		...item,
		status,
		checked: status === 'validated',
		justification: TERMINAL_STATUSES.has(status) ? item.justification : undefined,
		completedAt: status === 'unchecked' ? undefined : item.completedAt
	};

	return normalized;
}

function normalizeRecord(record: PreflightRecord): PreflightRecord {
	const items = record.items
		? Object.fromEntries(
				Object.entries(record.items).map(([id, item]) => [id, normalizeItem(item)])
			)
		: {};

	return { ...record, items };
}

/**
 * Serializes workspace data to JSON
 */
export function exportToJson(
	workspace: Workspace,
	templates: PreflightTemplate[],
	items: ChecklistItem[],
	records: PreflightRecord[]
): string {
	const data: PreflightExportJSON = {
		preflight: {
			version: '1.0',
			exportedAt: new Date().toISOString()
		},
		workspace,
		templates,
		items,
		records
	};

	return JSON.stringify(data, null, 2);
}

/**
 * Parses JSON and returns flat data ready for Dexie
 */
export function importFromJson(jsonString: string): {
	workspace: Workspace;
	templates: PreflightTemplate[];
	items: ChecklistItem[];
	records: PreflightRecord[];
} {
	const data = JSON.parse(jsonString) as PreflightExportJSON;

	// Basic validation
	if (!data.preflight || data.preflight.version !== '1.0') {
		throw new Error('Invalid or unsupported Preflight JSON version');
	}

	if (!data.workspace || !data.templates || !data.items) {
		throw new Error('Malformed Preflight data: Missing workspace, templates, or items');
	}

	return {
		workspace: data.workspace,
		templates: data.templates,
		items: (data.items || []).map(normalizeItem),
		records: (data.records || []).map(normalizeRecord)
	};
}
