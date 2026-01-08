<script lang="ts">
	import { recordStore } from '$lib/stores/records.svelte';
	import type { ChecklistItem } from '$lib/types';
	import { getIndeterminateState } from '$lib/utils/checkboxTree';
	import { Check, ChevronRight } from 'lucide-svelte';

	let {
		item,
		items,
		depth = 0,
		readonly = false
	}: {
		item: ChecklistItem;
		items: Record<string, ChecklistItem>;
		depth?: number;
		readonly?: boolean;
	} = $props();

	let checkboxRef: HTMLInputElement | null = $state(null);
	let isCollapsed = $state(false);

	let children = $derived(
		Object.values(items)
			.filter((i: ChecklistItem) => i.parentId === item.id)
			.sort((a: ChecklistItem, b: ChecklistItem) => a.order - b.order)
	);

	$effect(() => {
		if (checkboxRef) {
			checkboxRef.indeterminate = getIndeterminateState(item.id, items);
		}
	});

	$effect(() => {
		if (item.checked) {
			isCollapsed = true;
		}
	});
</script>

<div
	class="group flex items-center gap-3 border-l-2 p-3 transition-colors {item.checked
		? 'border-success bg-success/5'
		: 'border-text-secondary/20 hover:bg-bg-elevated/50'}"
	style="margin-left: {depth * 20}px"
>
	{#if children.length > 0}
		<button
			onclick={() => (isCollapsed = !isCollapsed)}
			class="text-text-secondary/50 transition-colors hover:text-accent"
		>
			<ChevronRight size={16} class="transition-transform {isCollapsed ? '' : 'rotate-90'}" />
		</button>
	{:else}
		<div class="w-4"></div>
	{/if}

	<div class="relative flex items-center">
		<input
			type="checkbox"
			bind:this={checkboxRef}
			checked={item.checked}
			disabled={readonly}
			onchange={() => recordStore.toggleItem(recordStore.activeRecordId!, item.id)}
			class="h-5 w-5 cursor-pointer appearance-none border-2 border-text-secondary transition-all checked:border-accent checked:bg-accent hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
		/>
		<Check
			class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-bg-primary opacity-0 transition-opacity peer-checked:opacity-100"
			size={14}
			strokeWidth={4}
		/>
	</div>

	<div class="flex-1">
		<span
			class="text-sm {item.checked
				? 'text-text-secondary line-through'
				: 'text-text-primary'} transition-all"
		>
			{item.text}
		</span>
		{#if item.completedAt && item.checked}
			<span class="ml-2 text-[10px] tracking-tighter text-success/50 uppercase">
				{new Date(item.completedAt).toLocaleTimeString([], {
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit'
				})}
			</span>
		{/if}
	</div>
</div>

{#if children.length > 0 && !isCollapsed}
	<div class="space-y-1">
		{#each children as child (child.id)}
			<svelte:self item={child} {items} depth={depth + 1} {readonly} />
		{/each}
	</div>
{/if}
