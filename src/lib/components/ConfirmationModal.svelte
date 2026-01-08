<script lang="ts">
	import { Trash2, TriangleAlert } from 'lucide-svelte';

	let {
		show = $bindable(false),
		title = 'Are you sure?',
		message = '',
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		type = 'warning', // 'warning' | 'danger' | 'success'
		onConfirm
	} = $props();

	function handleConfirm() {
		onConfirm?.();
		show = false;
	}
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
				<div
					class="p-3 {type === 'danger'
						? 'bg-error/20 text-error'
						: type === 'success'
							? 'bg-success/20 text-success'
							: 'bg-warning/20 text-warning'} border-2 border-current"
				>
					{#if type === 'danger'}
						<Trash2 size={24} />
					{:else}
						<TriangleAlert size={24} />
					{/if}
				</div>
				<h3 class="text-xl font-black tracking-tight text-text-primary uppercase">
					{title}
				</h3>
			</div>

			<p class="font-mono text-sm leading-relaxed text-text-secondary">
				{message}
			</p>

			<div class="flex gap-4 pt-2">
				<button onclick={() => (show = false)} class="btn-secondary flex-1 py-3">
					{cancelText}
				</button>
				<button
					onclick={handleConfirm}
					class="{type === 'danger'
						? 'bg-error text-bg-primary'
						: type === 'success'
							? 'bg-success text-bg-primary'
							: 'bg-accent text-bg-primary'} flex-1 py-3 text-sm font-bold tracking-widest uppercase transition-all hover:brightness-110 active:translate-x-1 active:translate-y-1"
				>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}
