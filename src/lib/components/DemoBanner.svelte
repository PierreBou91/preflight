<script lang="ts">
	let { onReset, isBusy = false } = $props<{
		onReset: () => void | Promise<void>;
		isBusy?: boolean;
	}>();
</script>

<div
	class="flex items-center justify-between gap-3 border-2 border-warning/40 bg-bg-secondary/80 px-3 py-2 text-[11px] font-bold tracking-widest text-warning uppercase"
>
	<span>Demo mode</span>
	<button
		class="btn-secondary px-3 py-1 text-[10px] font-bold tracking-widest uppercase"
		disabled={isBusy}
		onclick={onReset}
	>
		{isBusy ? 'Resetting...' : 'Reset demo data to today'}
	</button>
</div>
