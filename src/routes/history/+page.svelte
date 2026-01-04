<script lang="ts">
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import { recordStore } from '$lib/stores/records.svelte';
	import { templateStore } from '$lib/stores/templates.svelte';
	import { workspaceStore } from '$lib/stores/workspace.svelte';
	import { formatDuration } from '$lib/utils/time';
	import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Trash2 } from 'lucide-svelte';

	let activeWorkspace = $derived(
		workspaceStore.workspaces.find((w) => w.id === workspaceStore.activeId)
	);

	// Filter records for active workspace
	let filteredRecords = $derived.by(() => {
		if (!workspaceStore.activeId) return [];

		// Find templates in active workspace
		const workspaceTemplateIds = new Set(templateStore.templates.map((t) => t.id));

		return recordStore.records.filter((r) => workspaceTemplateIds.has(r.templateId));
	});

	let showDeleteModal = $state(false);
	let recordToDelete = $state<{ id: string; name: string } | null>(null);

	function confirmDelete(id: string, name: string) {
		recordToDelete = { id, name };
		showDeleteModal = true;
	}

	async function handleDelete() {
		if (recordToDelete) {
			await recordStore.delete(recordToDelete.id);
			recordToDelete = null;
		}
	}
</script>

<div class="mx-auto max-w-5xl space-y-8">
	<header class="flex items-center gap-4 border-b-2 border-text-secondary pb-4">
		<a href="/" class="p-2 text-text-secondary transition-colors hover:bg-bg-secondary">
			<ArrowLeft size={20} />
		</a>
		<div>
			<h2 class="text-3xl font-black tracking-tighter text-text-primary uppercase">
				Record History
			</h2>
			<p class="text-sm text-text-secondary italic">
				{activeWorkspace
					? `Past checklists in ${activeWorkspace.name}`
					: 'Select a workspace to view history'}
			</p>
		</div>
	</header>

	{#if !workspaceStore.activeId}
		<div
			class="border-2 border-dashed border-text-secondary/20 py-20 text-center text-text-secondary italic"
		>
			Select a workspace to view its record history.
		</div>
	{:else if filteredRecords.length === 0}
		<div
			class="border-2 border-dashed border-text-secondary/20 py-20 text-center text-text-secondary italic"
		>
			No records found for this workspace. Use a template to start a new checklist.
		</div>
	{:else}
		<div class="space-y-4">
			{#each filteredRecords as record (record.id)}
				<div
					class="card group flex items-center justify-between p-6 transition-colors hover:border-accent"
				>
					<div class="space-y-1">
						<div class="flex items-center gap-2">
							<h3 class="text-lg font-bold text-text-primary">
								{record.name}
							</h3>
							{#if record.completedAt}
								<span
									class="flex items-center gap-1 border border-success/30 bg-success/20 px-2 py-0.5 text-[10px] font-bold tracking-widest text-success uppercase"
								>
									<CheckCircle2 size={10} />
									Complete
								</span>
							{:else}
								<span
									class="flex items-center gap-1 border border-warning/30 bg-warning/20 px-2 py-0.5 text-[10px] font-bold tracking-widest text-warning uppercase"
								>
									<AlertCircle size={10} />
									In Progress
								</span>
							{/if}
						</div>

						<div class="flex items-center gap-4 font-mono text-xs text-text-secondary">
							<div class="flex items-center gap-1">
								<Clock size={12} />
								<span>{new Date(record.createdAt).toLocaleString()}</span>
							</div>
							<div>
								Duration: {formatDuration(record.elapsedMs)}
							</div>
						</div>
					</div>

					<div class="flex gap-4">
						{#if !record.completedAt}
							<a
								href="/run/{record.id}"
								class="btn-primary px-4 py-2 text-xs font-bold tracking-widest uppercase"
							>
								Resume
							</a>
						{:else}
							<a
								href="/run/{record.id}?readonly=true"
								class="btn-secondary px-4 py-2 text-xs font-bold tracking-widest uppercase"
							>
								View
							</a>
						{/if}
						<button
							onclick={() => confirmDelete(record.id, record.name)}
							class="p-2 text-text-secondary transition-colors hover:text-error"
							title="Delete Record"
						>
							<Trash2 size={20} />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<ConfirmationModal
	bind:show={showDeleteModal}
	title="Delete Record?"
	message="Are you sure you want to delete the record '{recordToDelete?.name}'? This data will be permanently lost."
	confirmText="Delete Record"
	type="danger"
	onConfirm={handleDelete}
/>
