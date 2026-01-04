import type { ChecklistItem, PreflightRecord, PreflightTemplate, Workspace } from '$lib/types';

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
		items: data.items,
		records: data.records || []
	};
}
