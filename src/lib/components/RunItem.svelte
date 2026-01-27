<script lang="ts">
	import { recordStore } from '$lib/stores/records.svelte';
	import type { ChecklistItem, ChecklistStatus } from '$lib/types';
	import { getIndeterminateState, getItemStatus } from '$lib/utils/checkboxTree';
	import { Check, ChevronRight, Minus, X } from 'lucide-svelte';

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

	let isCollapsed = $state(false);
	let justificationDraft = $state(item.justification ?? '');
	let isJustificationFocused = $state(false);

	let status = $derived(getItemStatus(item));
	let isIndeterminate = $derived(getIndeterminateState(item.id, items));

	let children = $derived(
		Object.values(items)
			.filter((i: ChecklistItem) => i.parentId === item.id)
			.sort((a: ChecklistItem, b: ChecklistItem) => a.order - b.order)
	);

	$effect(() => {
		if (status !== 'unchecked') {
			isCollapsed = true;
		}
	});

	$effect(() => {
		if (!isJustificationFocused) {
			justificationDraft = item.justification ?? '';
		}
	});

	$effect(() => {
		if (status !== 'failed' && status !== 'notApplicable') {
			justificationDraft = '';
		}
	});

	function handleStatusClick(nextStatus: ChecklistStatus) {
		if (readonly) return;
		const current = getItemStatus(item);
		const updatedStatus = current === nextStatus ? 'unchecked' : nextStatus;
		recordStore.toggleItem(recordStore.activeRecordId!, item.id, updatedStatus);
	}

	async function handleJustificationBlur() {
		if (readonly) return;
		isJustificationFocused = false;
		await recordStore.updateJustification(recordStore.activeRecordId!, item.id, justificationDraft);
	}
</script>

<div
	class="group flex items-start gap-3 border-l-2 p-3 transition-colors {isIndeterminate
		? 'border-accent/40 bg-accent/5'
		: status === 'validated'
			? 'border-success bg-success/5'
			: status === 'failed'
				? 'border-error bg-error/5'
				: status === 'notApplicable'
					? 'border-warning/50 bg-warning/10'
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

	<div class="flex items-center gap-1">
		<button
			onclick={() => handleStatusClick('validated')}
			disabled={readonly}
			title="Validate"
			class="flex h-7 w-7 items-center justify-center border-2 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 {status ===
			'validated'
				? 'border-success bg-success text-bg-primary'
				: 'border-text-secondary/40 text-text-secondary hover:border-success'}"
		>
			<Check size={14} />
		</button>
		<button
			onclick={() => handleStatusClick('failed')}
			disabled={readonly}
			title="Fail"
			class="flex h-7 w-7 items-center justify-center border-2 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 {status ===
			'failed'
				? 'border-error bg-error text-bg-primary'
				: 'border-text-secondary/40 text-text-secondary hover:border-error'}"
		>
			<X size={14} />
		</button>
		<button
			onclick={() => handleStatusClick('notApplicable')}
			disabled={readonly}
			title="Not applicable"
			class="flex h-7 w-7 items-center justify-center border-2 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 {status ===
			'notApplicable'
				? 'border-warning bg-warning text-bg-primary'
				: 'border-text-secondary/40 text-text-secondary hover:border-warning'}"
		>
			<Minus size={14} />
		</button>
	</div>

	<div class="flex-1 space-y-1">
		<div class="flex flex-wrap items-center gap-2">
			<span
				class="text-sm {status === 'validated'
					? 'text-text-secondary line-through'
					: status === 'failed'
						? 'text-error'
						: status === 'notApplicable'
							? 'text-warning'
							: 'text-text-primary'} transition-all"
			>
				{item.text}
			</span>
			{#if isIndeterminate}
				<span class="text-[10px] tracking-widest text-accent/80 uppercase">Mixed</span>
			{/if}
			{#if item.completedAt && status !== 'unchecked'}
				<span
					class="text-[10px] tracking-tighter uppercase {status === 'failed'
						? 'text-error/70'
						: status === 'notApplicable'
							? 'text-warning/70'
							: 'text-success/70'}"
				>
					{new Date(item.completedAt).toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit',
						second: '2-digit'
					})}
				</span>
			{/if}
		</div>
		{#if status === 'failed' || status === 'notApplicable'}
			{#if readonly}
				{#if item.justification}
					<div class="text-xs text-text-secondary">
						<span class="font-bold">Justification:</span> {item.justification}
					</div>
				{/if}
			{:else}
				<input
					type="text"
					bind:value={justificationDraft}
					onfocus={() => (isJustificationFocused = true)}
					onblur={handleJustificationBlur}
					placeholder="Optional justification..."
					class="w-full border border-text-secondary/30 bg-bg-primary px-2 py-1 text-xs outline-none focus:border-accent"
				/>
			{/if}
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
