<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import WorkspaceNav from '$lib/components/WorkspaceNav.svelte';
	import { templateStore } from '$lib/stores/templates.svelte';
	import { workspaceStore } from '$lib/stores/workspace.svelte';
	import { Menu } from 'lucide-svelte';
	import './layout.css';

	let { children } = $props();
	let isSidebarOpen = $state(false);

	// Initialize global store subscriptions in a valid effect context
	workspaceStore.subscribe();
	templateStore.subscribe();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex h-screen overflow-hidden bg-bg-primary text-text-primary">
	<WorkspaceNav bind:isSidebarOpen />

	<main class="flex min-w-0 flex-1 flex-col overflow-hidden">
		<!-- Mobile Header -->
		<header
			class="flex items-center gap-4 border-b-2 border-text-secondary bg-bg-secondary p-4 lg:hidden"
		>
			<button class="text-text-secondary hover:text-accent" onclick={() => (isSidebarOpen = true)}>
				<Menu size={24} />
			</button>
			<span class="text-lg font-bold tracking-tighter text-accent uppercase">Preflight</span>
		</header>

		<div class="flex-1 overflow-y-auto p-4 lg:p-6">
			{@render children()}
		</div>
	</main>
</div>
