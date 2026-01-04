<script lang="ts">
	import { templateStore } from '$lib/stores/templates.svelte';
	import { workspaceStore } from '$lib/stores/workspace.svelte';
	import { Clock, FileText, Plus, Trash2 } from 'lucide-svelte';

	let activeWorkspace = $derived(
		workspaceStore.workspaces.find((w) => w.id === workspaceStore.activeId)
	);

	let showNewTemplateModal = $state(false);
	let newTemplateName = $state('');

	async function handleCreateTemplate() {
		if (!newTemplateName.trim()) return;
		await templateStore.create(newTemplateName);
		newTemplateName = '';
		showNewTemplateModal = false;
	}
</script>

{#if !workspaceStore.activeId}
	<div class="flex h-full flex-col items-center justify-center space-y-4 text-text-secondary">
		<FileText size={48} strokeWidth={1} />
		<p class="text-xl italic">Select or create a workspace to begin.</p>
	</div>
{:else}
	<div class="mx-auto max-w-5xl space-y-8">
		<header class="flex items-end justify-between border-b-2 border-text-secondary pb-4">
			<div>
				<h2 class="text-3xl font-black tracking-tighter text-text-primary uppercase">
					{activeWorkspace?.name}
				</h2>
				<p class="text-sm text-text-secondary italic">Workspace Dashboard</p>
			</div>
			<button
				onclick={() => (showNewTemplateModal = true)}
				class="btn-primary flex items-center gap-2"
			>
				<Plus size={18} />
				New Template
			</button>
		</header>

		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each templateStore.templates as template}
				<div class="card group flex flex-col justify-between p-6">
					<div>
						<div class="mb-2 flex items-start justify-between">
							<h3 class="cursor-pointer text-xl font-bold text-accent group-hover:underline">
								{template.name}
							</h3>
							<button
								onclick={() => templateStore.delete(template.id)}
								class="text-text-secondary transition-colors hover:text-error"
								title="Delete Template"
							>
								<Trash2 size={16} />
							</button>
						</div>
						<p class="mb-4 truncate text-xs text-text-secondary">
							{template.description || 'No description provided.'}
						</p>
					</div>

					<div
						class="mt-auto flex items-center justify-between border-t border-text-secondary/30 pt-4"
					>
						<div class="flex items-center gap-1 text-[10px] text-text-secondary">
							<Clock size={12} />
							<span>{new Date(template.createdAt).toLocaleDateString()}</span>
						</div>
						<button class="btn-secondary px-3 py-1 text-[10px] tracking-widest uppercase">
							Open
						</button>
					</div>
				</div>
			{/each}

			{#if templateStore.templates.length === 0}
				<div
					class="col-span-full border-2 border-dashed border-text-secondary/30 py-12 text-center text-text-secondary italic"
				>
					No templates found in this workspace. Create your first one above.
				</div>
			{/if}
		</div>
	</div>
{/if}

{#if showNewTemplateModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/80 p-4 backdrop-blur-sm"
	>
		<div class="card w-full max-w-md space-y-6 p-8">
			<h3 class="text-2xl font-black tracking-tight text-accent uppercase">New Template</h3>
			<div class="space-y-4">
				<div>
					<label
						for="tmpl-name"
						class="mb-1 block text-xs tracking-widest text-text-secondary uppercase"
					>
						Template Name
					</label>
					<input
						id="tmpl-name"
						bind:value={newTemplateName}
						class="w-full border-2 border-text-secondary bg-bg-primary p-3 outline-none focus:border-accent"
						placeholder="Pre-flight checklist..."
						onkeydown={(e) => e.key === 'Enter' && handleCreateTemplate()}
						autofocus
					/>
				</div>
			</div>
			<div class="flex gap-4">
				<button onclick={handleCreateTemplate} class="btn-primary flex-1 py-3">Create</button>
				<button onclick={() => (showNewTemplateModal = false)} class="btn-secondary flex-1 py-3"
					>Cancel</button
				>
			</div>
		</div>
	</div>
{/if}
