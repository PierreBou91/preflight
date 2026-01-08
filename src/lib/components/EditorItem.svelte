<script lang="ts">
	import { itemStore } from '$lib/stores/items.svelte';
	import { GripVertical, Plus, Trash2 } from 'lucide-svelte';

	let { item, depth = 0 } = $props();

	let isEditing = $state(false);
	let text = $state(item.text);

	async function handleBlur() {
		isEditing = false;
		if (text !== item.text) {
			await itemStore.update(item.id, { text });
		}
	}

	async function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			await handleBlur();
		}
	}
</script>

<div
	class="group flex items-center gap-2 border-l-2 border-text-secondary/20 bg-bg-secondary p-2 transition-colors hover:bg-bg-elevated"
	style="margin-left: {depth * 20}px"
>
	<div
		onmousedown={handleBlur}
		class="cursor-grab p-1 text-text-secondary/30 hover:text-text-secondary active:cursor-grabbing"
	>
		<GripVertical size={16} />
	</div>

	<div class="flex flex-1 items-center gap-2">
		{#if isEditing}
			<input
				bind:value={text}
				onblur={handleBlur}
				onkeydown={handleKeydown}
				onfocus={(e) => e.currentTarget.select()}
				class="flex-1 border border-accent bg-bg-primary p-1 text-sm outline-none"
				autofocus
			/>
		{:else}
			<button
				onclick={() => (isEditing = true)}
				class="flex-1 px-1 py-1 text-left text-sm transition-colors hover:bg-bg-primary/50"
			>
				{item.text || 'Empty item...'}
			</button>
		{/if}
	</div>

	<div
		class="flex items-center gap-1 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100"
	>
		<button
			onclick={() => itemStore.add('', item.id)}
			class="p-1 text-text-secondary hover:text-accent"
			title="Add sub-item"
		>
			<Plus size={14} />
		</button>
		<button
			onclick={() => itemStore.delete(item.id)}
			class="p-1 text-text-secondary hover:text-error"
			title="Delete item"
		>
			<Trash2 size={14} />
		</button>
	</div>
</div>
