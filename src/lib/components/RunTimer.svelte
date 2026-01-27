<script lang="ts">
	import { recordStore } from '$lib/stores/records.svelte';
	import { formatDuration, getDisplayElapsedMs } from '$lib/utils/time';
	import { Pause, Play } from 'lucide-svelte';

	let { record, readonly = false } = $props();

	let elapsedMs = $state(getDisplayElapsedMs(record));
	let intervalId: any;

	function tick() {
		if (readonly || record.isPaused || record.completedAt) {
			elapsedMs = getDisplayElapsedMs(record);
		} else {
			const resumedAt = record.resumedAt ?? record.createdAt;
			elapsedMs = record.elapsedMs + (Date.now() - resumedAt);
		}
	}

	async function togglePause() {
		if (readonly || record.completedAt) return;
		const now = Date.now();
		if (record.isPaused) {
			// Resuming
			await recordStore.updateTimer(record.id, record.elapsedMs, now, false);
		} else {
			// Pausing
			const newElapsed = record.elapsedMs + (now - record.resumedAt);
			await recordStore.updateTimer(record.id, newElapsed, now, true);
		}
	}

	$effect(() => {
		if (!record.isPaused && !readonly && !record.completedAt) {
			intervalId = setInterval(tick, 100);
		} else {
			tick(); // Static update
		}
		return () => {
			if (intervalId) clearInterval(intervalId);
		};
	});
</script>

<div
	class="flex items-center gap-4 border-2 border-text-secondary bg-bg-elevated p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
>
	<div class="flex flex-col">
		<span class="text-[10px] font-black tracking-widest text-text-secondary uppercase opacity-70"
			>Elapsed Time</span
		>
		<span class="text-2xl font-black tracking-tighter text-accent tabular-nums">
			{formatDuration(elapsedMs)}
		</span>
	</div>

	{#if !readonly}
		<button
			onclick={togglePause}
			class="btn-secondary flex h-12 w-12 items-center justify-center transition-all hover:scale-110 active:scale-90"
			title={record.isPaused ? 'Resume' : 'Pause'}
		>
			{#if record.isPaused}
				<Play size={20} fill="currentColor" />
			{:else}
				<Pause size={20} fill="currentColor" />
			{/if}
		</button>
	{/if}
</div>
