<script lang="ts">
	import { itemStore } from '$lib/stores/items.svelte';
	import { templateStore } from '$lib/stores/templates.svelte';
	import { ArrowLeft, Plus } from 'lucide-svelte';
	import ChecklistTree from './ChecklistTree.svelte';

	let { templateId } = $props();

	let template = $derived(templateStore.templates.find((t) => t.id === templateId));

	// Initialize itemStore for this template
	$effect(() => {
		if (templateId) {
			itemStore.subscribe(templateId);
		}
	});

	async function handleAddItem() {
		await itemStore.add('New checklist item');
	}
</script>

{#if template}
	<div class="mx-auto max-w-4xl space-y-6">
		<header class="flex items-center justify-between border-b-2 border-text-secondary pb-4">
			<div class="flex items-center gap-4">
				<a href="/" class="p-2 text-text-secondary transition-colors hover:bg-bg-secondary">
					<ArrowLeft size={20} />
				</a>
				<div>
					<h2 class="text-2xl font-black tracking-tighter text-text-primary uppercase">
						{template.name}
					</h2>
					<p class="text-sm text-text-secondary italic">Template Editor</p>
				</div>
			</div>

			<div class="flex items-center gap-4">
				<button onclick={handleAddItem} class="btn-primary flex items-center gap-2 px-4 py-2">
					<Plus size={18} />
					Add Item
				</button>
			</div>
		</header>

		<div class="card space-y-4 p-6">
			<div class="grid grid-cols-1 gap-4 border-b border-text-secondary/20 pb-4 md:grid-cols-2">
				<div>
					<label
						for="tmpl-pilot"
						class="mb-1 block text-[10px] tracking-widest text-text-secondary uppercase"
						>Created By</label
					>
					<input
						id="tmpl-pilot"
						type="text"
						bind:value={template.pilot}
						class="w-full border border-text-secondary/30 bg-bg-primary p-2 text-sm outline-none focus:border-accent"
					/>
				</div>
				<div>
					<label
						for="tmpl-desc"
						class="mb-1 block text-[10px] tracking-widest text-text-secondary uppercase"
						>Description</label
					>
					<input
						id="tmpl-desc"
						type="text"
						bind:value={template.description}
						class="w-full border border-text-secondary/30 bg-bg-primary p-2 text-sm outline-none focus:border-accent"
					/>
				</div>
			</div>

			<div class="space-y-4">
				<h3 class="text-xs font-bold tracking-widest text-accent uppercase">Checklist Items</h3>

				{#if itemStore.tree.length > 0}
					<div class="border-2 border-text-secondary/10 bg-bg-primary/30 p-4">
						<ChecklistTree items={itemStore.tree} />
					</div>
				{:else}
					<div
						class="border-2 border-dashed border-text-secondary/20 py-12 text-center text-text-secondary italic"
					>
						Your checklist is empty. Add your first item above.
					</div>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<div class="flex h-full items-center justify-center text-text-secondary italic">
		Loading template...
	</div>
{/if}
