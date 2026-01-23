<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import DemoBanner from '$lib/components/DemoBanner.svelte';
	import WorkspaceNav from '$lib/components/WorkspaceNav.svelte';
	import { recordStore } from '$lib/stores/records.svelte';
	import { templateStore } from '$lib/stores/templates.svelte';
	import { workspaceStore } from '$lib/stores/workspace.svelte';
	import { seedDemoData } from '$lib/utils/demo';
	import { page } from '$app/stores';
	import { Menu } from 'lucide-svelte';
	import './layout.css';

	let { children } = $props();
	let isSidebarOpen = $state(false);
	let demoMode = $state(false);
	let hasAttemptedSeed = $state(false);
	let isSeeding = $state(false);
	let demoParam = $derived($page.url.searchParams.get('demo') === 'true');

	const DEMO_MODE_KEY = 'preflight.demoMode';

	// Initialize global store subscriptions in a valid effect context
	workspaceStore.subscribe();
	templateStore.subscribe();
	recordStore.subscribe();

	$effect(() => {
		const hasStorage = typeof sessionStorage !== 'undefined';
		if (demoParam && hasStorage) {
			sessionStorage.setItem(DEMO_MODE_KEY, 'true');
		}
		const persisted = hasStorage && sessionStorage.getItem(DEMO_MODE_KEY) === 'true';
		demoMode = demoParam || persisted;
	});

	async function runSeed(force: boolean) {
		if (isSeeding) return;
		isSeeding = true;
		try {
			if (force) {
				workspaceStore.activeId = null;
			}
			const seeded = await seedDemoData({ force });
			if (seeded) {
				workspaceStore.activeId = null;
			}
		} finally {
			isSeeding = false;
		}
	}

	function handleReset() {
		void runSeed(true);
	}

	$effect(() => {
		if (!demoMode || hasAttemptedSeed) return;
		hasAttemptedSeed = true;
		void runSeed(false);
	});
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
			{#if demoMode}
				<div class="mb-4">
					<DemoBanner onReset={handleReset} isBusy={isSeeding} />
				</div>
			{/if}
			{@render children()}
		</div>
	</main>
</div>
