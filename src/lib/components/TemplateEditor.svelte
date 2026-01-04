<script lang="ts">
	import { goto } from '$app/navigation';
	import { itemStore } from '$lib/stores/items.svelte';
	import { templateStore } from '$lib/stores/templates.svelte';
	import { ArrowLeft, Plus, Trash2 } from 'lucide-svelte';
	import ChecklistTree from './ChecklistTree.svelte';
	import ConfirmationModal from './ConfirmationModal.svelte';

	let { templateId } = $props();

	let template = $derived(templateStore.templates.find((t) => t.id === templateId));

	// Auto-save template changes with basic debouncing/tracking
	$effect(() => {
		if (template) {
			// Trigger on property changes
			const { name, pilot, description } = template;
			templateStore.update(template.id, { name, pilot, description });
		}
	});

	// Initialize itemStore for this template
	$effect(() => {
		if (templateId) {
			itemStore.subscribe(templateId);
		}
	});

	let showDeleteModal = $state(false);

	async function handleAddItem() {
		await itemStore.add('New checklist item');
	}

	async function handleDelete() {
		await templateStore.delete(templateId);
		goto('/');
	}
</script>

{#if template}
	<div class="mx-auto max-w-4xl space-y-6">
		<header class="flex items-center justify-between border-b-2 border-text-secondary pb-4">
			<div class="flex items-center gap-4">
				<a href="/" class="p-2 text-text-secondary transition-colors hover:bg-bg-secondary">
					<ArrowLeft size={20} />
				</a>
				<div class="flex flex-col">
					<input
						type="text"
						bind:value={template.name}
						class="w-full max-w-lg border-b-2 border-transparent bg-transparent text-2xl font-black tracking-tighter text-text-primary uppercase transition-all outline-none focus:border-accent focus:text-accent"
						placeholder="Untitled Template"
					/>
					<p class="mt-1 text-xs font-medium tracking-wide text-text-secondary italic">
						Template Editor
					</p>
				</div>
			</div>

			<div class="flex items-center gap-4">
				<button
					onclick={() => (showDeleteModal = true)}
					class="p-2 text-text-secondary transition-colors hover:text-error"
					title="Delete Template"
				>
					<Trash2 size={20} />
				</button>
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

	<ConfirmationModal
		bind:show={showDeleteModal}
		title="Delete Template?"
		message="This will permanently delete the template '{template.name}' and its items. This cannot be undone."
		confirmText="Delete"
		type="danger"
		onConfirm={handleDelete}
	/>
{:else}
	<div class="flex h-full items-center justify-center text-text-secondary italic">
		Loading template...
	</div>
{/if}
