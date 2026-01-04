// lib/utils/checkboxTree.ts
import type { ChecklistItem } from '$lib/types';

/**
 * Toggles an item and propagates the state to descendants and ancestors.
 */
export function toggleItem(
	itemId: string,
	items: Record<string, ChecklistItem>,
	checked: boolean
): Record<string, ChecklistItem> {
	const updated = { ...items };
	const now = Date.now();

	// 1. Set this item
	updated[itemId] = {
		...updated[itemId],
		checked,
		completedAt: checked ? now : undefined
	};

	// 2. Cascade down to all descendants
	const cascadeDown = (parentId: string) => {
		Object.values(updated).forEach((item) => {
			if (item.parentId === parentId) {
				updated[item.id] = {
					...updated[item.id],
					checked,
					completedAt: checked ? now : undefined
				};
				cascadeDown(item.id);
			}
		});
	};
	cascadeDown(itemId);

	// 3. Propagate up through ancestors
	let currentParentId = updated[itemId].parentId;
	while (currentParentId) {
		const siblings = Object.values(updated).filter((i) => i.parentId === currentParentId);
		const allChecked = siblings.every((s) => s.checked);

		// If all siblings are checked, parent is checked.
		// If at least one is unchecked, parent is unchecked.
		updated[currentParentId] = {
			...updated[currentParentId],
			checked: allChecked,
			completedAt: allChecked ? now : undefined
		};
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

	const checkedCount = children.filter((c) => c.checked).length;
	const hasIndeterminateChild = children.some((c) => getIndeterminateState(c.id, items));

	// Indeterminate if:
	// - Some (but not all) direct children are checked
	// - OR any child is indeterminate but not all are fully checked
	const allChecked = children.every((c) => c.checked);
	
	return (checkedCount > 0 && !allChecked) || hasIndeterminateChild;
}
