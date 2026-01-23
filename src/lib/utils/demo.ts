import { db } from '$lib/db';
import type {
	ChecklistItem,
	PreflightRecord,
	PreflightTemplate,
	Workspace
} from '$lib/types';

type DemoDataset = {
	workspace: Workspace;
	templates: PreflightTemplate[];
	items: ChecklistItem[];
	records: PreflightRecord[];
};

type SeedOptions = {
	force?: boolean;
};

const ID_FALLBACK = () => Math.random().toString(36).substring(2) + Date.now().toString(36);
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const ALL_TABLES = [db.workspaces, db.templates, db.items, db.records];

function createId(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	return ID_FALLBACK();
}

async function isDatabaseEmpty(): Promise<boolean> {
	const counts = await Promise.all(ALL_TABLES.map((table) => table.count()));
	return counts.every((count) => count === 0);
}

function assignRootItemIds(template: PreflightTemplate, items: ChecklistItem[]): PreflightTemplate {
	const rootItemIds = items
		.filter((item) => item.templateId === template.id && !item.parentId)
		.sort((a, b) => a.order - b.order)
		.map((item) => item.id);

	return {
		...template,
		itemIds: rootItemIds
	};
}

function buildTemplateWithItems(options: {
	workspaceId: string;
	name: string;
	description: string;
	order: number;
	pilot: string;
	createdAt: number;
	updatedAt: number;
	sections: { title: string; children: string[] }[];
}): { template: PreflightTemplate; items: ChecklistItem[] } {
	const templateId = createId();
	const items: ChecklistItem[] = [];

	options.sections.forEach((section, sectionIndex) => {
		const parentId = createId();
		items.push({
			id: parentId,
			templateId,
			parentId: null,
			text: section.title,
			checked: false,
			order: sectionIndex
		});

		section.children.forEach((childText, childIndex) => {
			items.push({
				id: createId(),
				templateId,
				parentId,
				text: childText,
				checked: false,
				order: childIndex
			});
		});
	});

	const template: PreflightTemplate = assignRootItemIds(
		{
			id: templateId,
			workspaceId: options.workspaceId,
			name: options.name,
			order: options.order,
			pilot: options.pilot,
			description: options.description,
			createdAt: options.createdAt,
			updatedAt: options.updatedAt,
			itemIds: []
		},
		items
	);

	return { template, items };
}

function pickCheckedIds(items: ChecklistItem[], count: number): Set<string> {
	const candidates = items.filter((item) => item.parentId);
	const pool = candidates.length > 0 ? candidates : items;
	return new Set(pool.slice(0, count).map((item) => item.id));
}

function buildRecordItems(options: {
	items: ChecklistItem[];
	createdAt: number;
	completeAll?: boolean;
	checkedIds?: Set<string>;
	completedAtBase?: number;
}): Record<string, ChecklistItem> {
	const orderedItems = [...options.items].sort((a, b) => a.order - b.order);
	const completedAtBase = options.completedAtBase ?? options.createdAt + 20 * MINUTE;
	const itemMap: Record<string, ChecklistItem> = {};

	orderedItems.forEach((item, index) => {
		const isChecked = options.completeAll
			? true
			: options.checkedIds?.has(item.id) ?? false;
		itemMap[item.id] = {
			...item,
			checked: isChecked,
			completedAt: isChecked ? completedAtBase + index * MINUTE : undefined
		};
	});

	return itemMap;
}

function buildRecord(options: {
	template: PreflightTemplate;
	templateItems: ChecklistItem[];
	pilot: string;
	createdAt: number;
	elapsedMs: number;
	isPaused: boolean;
	updatedAt: number;
	completedAt?: number;
	checkedIds?: Set<string>;
}): PreflightRecord {
	const completeAll = Boolean(options.completedAt);
	const items = buildRecordItems({
		items: options.templateItems,
		createdAt: options.createdAt,
		completeAll,
		checkedIds: options.checkedIds,
		completedAtBase: options.completedAt ?? options.createdAt + options.elapsedMs
	});

	return {
		id: createId(),
		templateId: options.template.id,
		name: `${options.template.name} - ${new Date(options.createdAt).toLocaleString('fr-FR')}`,
		pilot: options.pilot,
		createdAt: options.createdAt,
		elapsedMs: options.elapsedMs,
		isPaused: options.isPaused,
		resumedAt: options.createdAt,
		updatedAt: options.updatedAt,
		completedAt: options.completedAt,
		items
	};
}

function buildFrenchWorkspace(now: number): DemoDataset {
	const workspaceId = createId();
	const workspace: Workspace = {
		id: workspaceId,
		name: 'Atelier demo',
		order: 0,
		createdAt: now - 20 * DAY,
		updatedAt: now - 2 * DAY
	};

	const preflight = buildTemplateWithItems({
		workspaceId,
		name: 'Checklist pre-vol',
		description: 'Verification rapide avant depart.',
		order: 0,
		pilot: 'Equipe demo',
		createdAt: now - 18 * DAY,
		updatedAt: now - 2 * DAY,
		sections: [
			{
				title: 'Preparation',
				children: ['Verifier carburant', 'Controler instruments', 'Verifier documents']
			},
			{
				title: 'Decollage',
				children: ['Volets position', 'Communication tour']
			},
			{
				title: 'Croisiere',
				children: ['Vitesse stable', 'Frequence radio']
			},
			{
				title: 'Approche',
				children: ['Briefing approche', 'Checklist finale']
			}
		]
	});

	const postflight = buildTemplateWithItems({
		workspaceId,
		name: 'Checklist post-vol',
		description: 'Rappels apres vol et suivi.',
		order: 1,
		pilot: 'Equipe demo',
		createdAt: now - 12 * DAY,
		updatedAt: now - DAY,
		sections: [
			{
				title: 'Apres vol',
				children: ['Couper moteur', 'Consigner incident']
			},
			{
				title: 'Cloture',
				children: ['Nettoyer cockpit', 'Envoyer rapport']
			}
		]
	});

	const templates = [preflight.template, postflight.template];
	const items = [...preflight.items, ...postflight.items];

	const preflightItems = items.filter((item) => item.templateId === preflight.template.id);
	const preflightCheckedIds = pickCheckedIds(preflightItems, 3);
	const recordPreflight = buildRecord({
		template: preflight.template,
		templateItems: preflightItems,
		pilot: 'Equipe demo',
		createdAt: now - 3 * HOUR,
		elapsedMs: 12 * MINUTE,
		isPaused: true,
		updatedAt: now - 3 * HOUR + 12 * MINUTE,
		checkedIds: preflightCheckedIds
	});

	return {
		workspace,
		templates,
		items,
		records: [recordPreflight]
	};
}

function buildEnglishWorkspace(now: number): DemoDataset {
	const workspaceId = createId();
	const workspace: Workspace = {
		id: workspaceId,
		name: 'Demo Workspace',
		order: 1,
		createdAt: now - 30 * DAY,
		updatedAt: now - 3 * DAY
	};

	const release = buildTemplateWithItems({
		workspaceId,
		name: 'Launch checklist',
		description: 'Core steps before and after a release.',
		order: 0,
		pilot: 'Demo Team',
		createdAt: now - 28 * DAY,
		updatedAt: now - 4 * DAY,
		sections: [
			{
				title: 'Preparation',
				children: ['Confirm scope', 'Review changelog', 'Notify stakeholders']
			},
			{
				title: 'Deploy',
				children: ['Run migrations', 'Deploy application', 'Verify health checks']
			},
			{
				title: 'Post-release',
				children: ['Monitor dashboards', 'Confirm alerts', 'Share release note']
			}
		]
	});

	const incident = buildTemplateWithItems({
		workspaceId,
		name: 'Incident response',
		description: 'Steps for triage and mitigation.',
		order: 1,
		pilot: 'Demo Team',
		createdAt: now - 20 * DAY,
		updatedAt: now - 2 * DAY,
		sections: [
			{
				title: 'Triage',
				children: ['Confirm impact', 'Assign incident lead', 'Set comms channel']
			},
			{
				title: 'Mitigation',
				children: ['Apply hotfix', 'Validate recovery', 'Monitor rollback']
			},
			{
				title: 'Follow-up',
				children: ['Post-incident review', 'Document action items']
			}
		]
	});

	const templates = [release.template, incident.template];
	const items = [...release.items, ...incident.items];

	const releaseItems = items.filter((item) => item.templateId === release.template.id);
	const recordRelease = buildRecord({
		template: release.template,
		templateItems: releaseItems,
		pilot: 'Demo Team',
		createdAt: now - 2 * DAY,
		elapsedMs: 45 * MINUTE,
		isPaused: true,
		updatedAt: now - 2 * DAY + 45 * MINUTE,
		completedAt: now - 2 * DAY + 45 * MINUTE
	});

	const incidentItems = items.filter((item) => item.templateId === incident.template.id);
	const incidentCheckedIds = pickCheckedIds(incidentItems, 4);
	const recordIncident = buildRecord({
		template: incident.template,
		templateItems: incidentItems,
		pilot: 'Demo Team',
		createdAt: now - 6 * HOUR,
		elapsedMs: 20 * MINUTE,
		isPaused: true,
		updatedAt: now - 6 * HOUR + 20 * MINUTE,
		checkedIds: incidentCheckedIds
	});

	return {
		workspace,
		templates,
		items,
		records: [recordRelease, recordIncident]
	};
}

export async function seedDemoData({ force = false }: SeedOptions = {}): Promise<boolean> {
	if (!force) {
		const empty = await isDatabaseEmpty();
		if (!empty) return false;
	}

	const now = Date.now();
	const french = buildFrenchWorkspace(now);
	const english = buildEnglishWorkspace(now);

	await db.transaction('rw', db.workspaces, db.templates, db.items, db.records, async () => {
		if (force) {
			await Promise.all(ALL_TABLES.map((table) => table.clear()));
		}

		await db.workspaces.bulkAdd([french.workspace, english.workspace]);
		await db.templates.bulkAdd([...french.templates, ...english.templates]);
		await db.items.bulkAdd([...french.items, ...english.items]);
		await db.records.bulkAdd([...french.records, ...english.records]);
	});

	return true;
}
