<script lang="ts">
	import { goto } from '$app/navigation';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import PilotModal from '$lib/components/PilotModal.svelte';
	import { recordStore } from '$lib/stores/records.svelte';
	import { templateStore } from '$lib/stores/templates.svelte';
	import { workspaceStore } from '$lib/stores/workspace.svelte';
	import type { PreflightTemplate } from '$lib/types';
	import { Clock, FileText, Play, Plus, Trash2 } from 'lucide-svelte';

	let activeWorkspace = $derived(
		workspaceStore.workspaces.find((w) => w.id === workspaceStore.activeId)
	);

	let isCreating = $state(false);

	async function handleCreateTemplate() {
		isCreating = true;
		const templateId = await templateStore.create('Untitled Template');
		await goto(`/templates/${templateId}`);
		isCreating = false;
	}

	let showPilotModal = $state(false);
	let selectedTemplate = $state<PreflightTemplate | null>(null);

	function openPilotModal(template: PreflightTemplate) {
		selectedTemplate = template;
		showPilotModal = true;
	}

	async function startRun(pilot: string) {
		if (selectedTemplate) {
			const recordId = await recordStore.start(selectedTemplate.id, pilot);
			goto(`/run/${recordId}`);
		}
	}

	let showDeleteModal = $state(false);
	let templateToDelete = $state<{ id: string; name: string } | null>(null);

	function confirmDelete(id: string, name: string) {
		templateToDelete = { id, name };
		showDeleteModal = true;
	}

	async function handleDelete() {
		if (templateToDelete) {
			await templateStore.delete(templateToDelete.id);
			templateToDelete = null;
			showDeleteModal = false; // Close modal after deletion
		}
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
			<button onclick={handleCreateTemplate} class="btn-primary flex items-center gap-2">
				<Plus size={18} />
				New Template
			</button>
		</header>

		{#if isCreating}
			<div class="flex h-64 animate-pulse flex-col items-center justify-center space-y-4">
				<div class="h-8 w-48 border-2 border-text-secondary bg-bg-secondary"></div>
				<p class="text-sm text-text-secondary italic">Preparing your template...</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each templateStore.templates as template}
					<div class="card group flex flex-col justify-between p-6">
						<div>
							<div class="mb-2 flex items-start justify-between">
								<a
									href="/templates/{template.id}"
									class="text-xl font-bold text-accent decoration-2 underline-offset-4 hover:underline"
								>
									{template.name}
								</a>
								<button
									onclick={() => confirmDelete(template.id, template.name)}
									class="text-text-secondary transition-colors hover:text-error"
									title="Delete Template"
								>
									<Trash2 size={16} />
								</button>
							</div>
							<p class="mb-4 line-clamp-2 text-xs leading-relaxed font-medium text-text-secondary">
								{template.description || 'No description provided.'}
							</p>
						</div>

						<div
							class="mt-auto flex items-center justify-between border-t border-text-secondary/30 pt-4"
						>
							<div class="flex items-center gap-1 font-mono text-[10px] text-text-secondary">
								<Clock size={12} />
								<span>{new Date(template.createdAt).toLocaleDateString()}</span>
							</div>
							<div class="flex gap-2">
								<button
									onclick={() => openPilotModal(template)}
									class="btn-primary flex items-center justify-center p-2 shadow-sm transition-transform hover:scale-110 active:scale-95"
									title="Start Run"
								>
									<Play size={14} fill="currentColor" />
								</button>
							</div>
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
		{/if}
	</div>
{/if}

<ConfirmationModal
	bind:show={showDeleteModal}
	title="Delete Template?"
	message="Are you sure you want to delete '{templateToDelete?.name}'? All its items will be lost."
	confirmText="Delete"
	type="danger"
	onConfirm={handleDelete}
/>

<PilotModal
	bind:show={showPilotModal}
	defaultPilot={selectedTemplate?.pilot || ''}
	onConfirm={startRun}
/>
