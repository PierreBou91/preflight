<script lang="ts">
	import { workspaceStore } from '$lib/stores/workspace.svelte';
	import { Check, Edit2, Folder, GripVertical, Plus, Trash2, X } from 'lucide-svelte';
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';

	let { isSidebarOpen = $bindable(false) } = $props();

	let newWorkspaceName = $state('');
	let isAdding = $state(false);
	let editingId = $state<string | null>(null);
	let editingName = $state('');

	async function handleAdd() {
		if (!newWorkspaceName.trim()) return;
		await workspaceStore.create(newWorkspaceName);
		newWorkspaceName = '';
		isAdding = false;
	}

	async function handleUpdate(id: string) {
		if (!editingName.trim()) {
			editingId = null;
			return;
		}
		await workspaceStore.update(id, { name: editingName });
		editingId = null;
	}

	async function handleDelete(id: string) {
		if (confirm('Delete this workspace and all its templates?')) {
			await workspaceStore.delete(id);
		}
	}

	function handleDndConsider(e: CustomEvent<{ items: any[] }>) {
		workspaceStore.workspaces = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<{ items: any[] }>) {
		workspaceStore.workspaces = e.detail.items;
		workspaceStore.reorder(workspaceStore.workspaces.map((w) => w.id));
	}

	function startEditing(ws: any) {
		editingId = ws.id;
		editingName = ws.name;
	}
</script>

<!-- Mobile Toggle Overlay -->
{#if isSidebarOpen}
	<div
		class="fixed inset-0 z-40 bg-bg-primary/50 backdrop-blur-sm lg:hidden"
		onclick={() => (isSidebarOpen = false)}
		onkeydown={(e) => e.key === 'Escape' && (isSidebarOpen = false)}
		role="button"
		tabindex="0"
		aria-label="Close sidebar"
	></div>
{/if}

<div
	class="fixed inset-y-0 left-0 transform {isSidebarOpen
		? 'translate-x-0'
		: '-translate-x-full'} z-50 flex h-full w-64 flex-col border-r-2 border-text-secondary bg-bg-secondary shadow-2xl transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:shadow-none"
>
	<div class="flex items-center justify-between border-b-2 border-text-secondary p-4">
		<h1 class="text-xl font-bold tracking-tighter text-accent uppercase">Preflight</h1>
		<button class="text-text-secondary lg:hidden" onclick={() => (isSidebarOpen = false)}>
			<X size={20} />
		</button>
	</div>

	<div
		class="flex-1 space-y-2 overflow-y-auto p-2"
		use:dndzone={{
			items: workspaceStore.workspaces,
			flipDurationMs: 200,
			dragDisabled: editingId !== null
		}}
		onconsider={handleDndConsider}
		onfinalize={handleDndFinalize}
	>
		{#each workspaceStore.workspaces as ws (ws.id)}
			<div animate:flip={{ duration: 200 }} class="group relative flex w-full items-center gap-1">
				<div
					class="cursor-grab p-1 text-text-secondary/50 hover:text-text-secondary active:cursor-grabbing"
				>
					<GripVertical size={14} />
				</div>

				{#if editingId === ws.id}
					<div class="flex flex-1 gap-1 p-1">
						<input
							bind:value={editingName}
							class="flex-1 border border-accent bg-bg-primary p-1 text-sm outline-none"
							onkeydown={(e) => e.key === 'Enter' && handleUpdate(ws.id)}
							autofocus
						/>
						<button onclick={() => handleUpdate(ws.id)} class="p-1 text-success">
							<Check size={14} />
						</button>
					</div>
				{:else}
					<button
						onclick={() => {
							workspaceStore.setActive(ws.id);
							if (typeof window !== 'undefined' && window.innerWidth < 1024) isSidebarOpen = false;
						}}
						class="flex flex-1 items-center gap-2 p-2 text-left transition-colors hover:bg-bg-elevated {workspaceStore.activeId ===
						ws.id
							? 'border-l-4 border-accent bg-bg-elevated'
							: 'ml-1 border-l-4 border-transparent'}"
					>
						<Folder
							size={16}
							class={workspaceStore.activeId === ws.id ? 'text-accent' : 'text-text-secondary'}
						/>
						<span class="truncate text-sm">{ws.name}</span>
					</button>

					<div
						class="absolute right-2 flex gap-1 bg-bg-secondary/80 px-1 opacity-0 backdrop-blur-sm group-hover:opacity-100"
					>
						<button
							onclick={() => startEditing(ws)}
							class="p-1 text-text-secondary hover:text-accent"
							title="Edit"
						>
							<Edit2 size={12} />
						</button>
						<button
							onclick={() => handleDelete(ws.id)}
							class="p-1 text-text-secondary hover:text-error"
							title="Delete"
						>
							<Trash2 size={12} />
						</button>
					</div>
				{/if}
			</div>
		{/each}

		{#if isAdding}
			<div class="animate-in fade-in slide-in-from-top-1 space-y-2 p-2">
				<input
					bind:value={newWorkspaceName}
					placeholder="Workspace name..."
					class="w-full border-2 border-text-secondary bg-bg-primary p-2 text-sm outline-none focus:border-accent"
					onkeydown={(e) => e.key === 'Enter' && handleAdd()}
				/>
				<div class="flex gap-2">
					<button onclick={handleAdd} class="btn-primary flex-1 py-1 text-[10px]">Add</button>
					<button onclick={() => (isAdding = false)} class="btn-secondary flex-1 py-1 text-[10px]"
						>Cancel</button
					>
				</div>
			</div>
		{:else}
			<button
				onclick={() => (isAdding = true)}
				class="flex w-full items-center gap-2 p-2 text-left text-sm text-text-secondary italic transition-colors hover:text-accent"
			>
				<Plus size={16} />
				<span>New Workspace</span>
			</button>
		{/if}
	</div>

	<div
		class="border-t-2 border-text-secondary p-4 text-center text-[10px] tracking-widest text-text-secondary uppercase"
	>
		v0.0.1 ALPHA
	</div>
</div>
