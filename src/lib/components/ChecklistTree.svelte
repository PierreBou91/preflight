<script lang="ts">
	import { itemStore, type ViewItem } from '$lib/stores/items.svelte';
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import EditorItem from './EditorItem.svelte';

	let { items = [], depth = 0, parentId = null } = $props();

	function handleDndConsider(e: CustomEvent<{ items: ViewItem[] }>) {
		items = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<{ items: ViewItem[] }>) {
		items = e.detail.items;
		itemStore.reorder(items, parentId);
	}
</script>

<div
	class="min-h-[8px] space-y-1"
	use:dndzone={{ items, flipDurationMs: 200, type: 'items-' + depth }}
	onconsider={handleDndConsider}
	onfinalize={handleDndFinalize}
>
	{#each items as item (item.id)}
		<div animate:flip={{ duration: 200 }}>
			<EditorItem {item} {depth} />
			{#if item.children && item.children.length > 0}
				<svelte:self items={item.children} depth={depth + 1} parentId={item.id} />
			{/if}
		</div>
	{/each}
</div>
