// lib/utils/checkboxTree.ts
import type { ChecklistItem, ChecklistStatus } from '$lib/types';

const TERMINAL_STATUSES = new Set<ChecklistStatus>(['validated', 'failed', 'notApplicable']);

export function getItemStatus(item: ChecklistItem): ChecklistStatus {
	return item.status ?? (item.checked ? 'validated' : 'unchecked');
}

export function isTerminalStatus(status: ChecklistStatus): boolean {
	return TERMINAL_STATUSES.has(status);
}

/**
 * Toggles an item and propagates the state to descendants and ancestors.
 */
export function toggleItem(
	itemId: string,
	items: Record<string, ChecklistItem>,
	status: ChecklistStatus,
	justification?: string
): Record<string, ChecklistItem> {
	const updated = { ...items };
	const now = Date.now();

	const applyStatus = (
		targetId: string,
		nextStatus: ChecklistStatus,
		nextJustification?: string,
		preserveJustification: boolean = false
	) => {
		const existing = updated[targetId];
		const shouldKeep =
			preserveJustification &&
			(nextStatus === 'failed' || nextStatus === 'notApplicable') &&
			nextJustification === undefined;

		updated[targetId] = {
			...existing,
			status: nextStatus,
			checked: nextStatus === 'validated',
			justification:
				nextStatus === 'failed' || nextStatus === 'notApplicable'
					? nextJustification ?? (shouldKeep ? existing.justification : undefined)
					: undefined,
			completedAt: nextStatus === 'unchecked' ? undefined : now
		};
	};

	// 1. Set this item
	applyStatus(itemId, status, justification, true);

	// 2. Cascade down to all descendants
	const cascadeDown = (parentId: string) => {
		Object.values(updated).forEach((item) => {
			if (item.parentId === parentId) {
				applyStatus(item.id, status);
				cascadeDown(item.id);
			}
		});
	};
	cascadeDown(itemId);

	// 3. Propagate up through ancestors
	let currentParentId = updated[itemId].parentId;
	while (currentParentId) {
		const siblings = Object.values(updated).filter((i) => i.parentId === currentParentId);
		const siblingStatuses = siblings.map((s) => getItemStatus(s));
		const hasUnchecked = siblingStatuses.some((status) => status === 'unchecked');
		const hasFailed = siblingStatuses.some((status) => status === 'failed');
		const allNotApplicable = siblingStatuses.every((status) => status === 'notApplicable');
		const allTerminal = siblingStatuses.every((status) => status !== 'unchecked');
		const derivedStatus = hasUnchecked
			? ('unchecked' as ChecklistStatus)
			: allTerminal
				? hasFailed
					? ('failed' as ChecklistStatus)
					: allNotApplicable
						? ('notApplicable' as ChecklistStatus)
						: ('validated' as ChecklistStatus)
				: ('unchecked' as ChecklistStatus);

		// If all siblings share the same status, inherit it. Otherwise, parent becomes unchecked.
		applyStatus(currentParentId, derivedStatus);
		currentParentId = updated[currentParentId].parentId;
	}

	return updated;
}

/**
 * Determines if an item should show an indeterminate state (partially checked children).
 */
export function getIndeterminateState(itemId: string, items: Record<string, ChecklistItem>): boolean {
	const children = Object.values(items).filter((i) => i.parentId === itemId);
	if (children.length === 0) return false;

	const childStatuses = children.map((c) => getItemStatus(c));
	const hasIndeterminateChild = children.some((c) => getIndeterminateState(c.id, items));
	const hasUnchecked = childStatuses.some((status) => status === 'unchecked');

	// Indeterminate if:
	// - Any child is unchecked
	// - OR any child is already indeterminate
	return hasUnchecked || hasIndeterminateChild;
}
