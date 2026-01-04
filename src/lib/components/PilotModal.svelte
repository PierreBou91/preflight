<script lang="ts">
	import { User } from 'lucide-svelte';

	let { show = $bindable(false), defaultPilot = '', onConfirm } = $props();

	let pilotName = $state(defaultPilot);

	function handleConfirm() {
		onConfirm(pilotName);
		show = false;
	}

	// Reset pilot name when modal opens
	$effect(() => {
		if (show) {
			pilotName = defaultPilot;
		}
	});
</script>

{#if show}
	<div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
		<!-- Backdrop -->
		<div
			class="absolute inset-0 bg-bg-primary/90 backdrop-blur-sm"
			onclick={() => (show = false)}
		></div>

		<!-- Modal body -->
		<div
			class="card animate-in zoom-in relative w-full max-w-sm space-y-6 bg-bg-secondary p-8 duration-200"
		>
			<div class="flex items-center gap-4">
				<div class="border-2 border-current bg-accent/20 p-3 text-accent">
					<User size={24} />
				</div>
				<h3 class="text-xl font-black tracking-tight text-text-primary uppercase">
					Who's the Pilot?
				</h3>
			</div>

			<div class="space-y-2">
				<label
					for="pilot-name"
					class="text-[10px] font-bold tracking-widest text-text-secondary uppercase"
				>
					Pilot Name
				</label>
				<input
					id="pilot-name"
					type="text"
					bind:value={pilotName}
					placeholder="Enter your name..."
					class="w-full border-2 border-text-secondary bg-bg-primary p-3 text-sm outline-none focus:border-accent"
					autofocus
					onkeydown={(e) => e.key === 'Enter' && handleConfirm()}
				/>
			</div>

			<div class="flex gap-4 pt-2">
				<button
					onclick={() => (show = false)}
					class="btn-secondary flex-1 py-3 text-xs tracking-widest uppercase"
				>
					Cancel
				</button>
				<button
					onclick={handleConfirm}
					class="flex-1 bg-accent py-3 text-sm font-bold tracking-widest text-bg-primary uppercase transition-all hover:brightness-110 active:translate-x-1 active:translate-y-1"
				>
					Start Run
				</button>
			</div>
		</div>
	</div>
{/if}
