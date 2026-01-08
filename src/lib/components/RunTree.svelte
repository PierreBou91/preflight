<script lang="ts">
	import RunItem from './RunItem.svelte';

	let { items = [], allItems = {}, depth = 0, readonly = false } = $props();

	// Convert items (which can be ViewItem or just items with children property)
	// In the execution view, we use the record's flat items map to determine structure.

	function getChildren(parentId: string | null) {
		return Object.values(allItems)
			.filter((i) => i.parentId === parentId)
			.sort((a, b) => a.order - b.order);
	}

	let rootItems = $derived(getChildren(null));
</script>

<div class="space-y-1">
	{#each rootItems as item (item.id)}
		<RunItem {item} items={allItems} depth={0} {readonly} />
	{/each}
</div>
