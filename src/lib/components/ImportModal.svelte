<script lang="ts">
	import { workspaceStore } from '$lib/stores/workspace.svelte';
	import { importFromJson } from '$lib/utils/json';
	import { AlertCircle, CheckCircle2, FileUp } from 'lucide-svelte';

	let { show = $bindable(false) } = $props();

	let error = $state<string | null>(null);
	let success = $state<string | null>(null);
	let importMode = $state<'merge' | 'replace'>('merge');
	let isImporting = $state(false);

	async function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		await processFile(file);
	}

	async function processFile(file: File) {
		error = null;
		success = null;
		isImporting = true;

		try {
			const text = await file.text();
			const data = importFromJson(text);

			await workspaceStore.importData(data, importMode);

			success = `Successfully imported workspace "${data.workspace.name}"`;
			setTimeout(() => {
				show = false;
				success = null;
			}, 2000);
		} catch (err: any) {
			console.error('Import failed:', err);
			error = err.message || 'Failed to parse JSON file. Ensure it follows the Preflight format.';
		} finally {
			isImporting = false;
		}
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
			class="card animate-in zoom-in relative w-full max-w-md space-y-6 bg-bg-secondary p-8 duration-200"
		>
			<header class="flex items-center gap-4">
				<div class="border-2 border-current bg-accent/20 p-3 text-accent">
					<FileUp size={24} />
				</div>
				<div>
					<h3 class="text-xl font-black tracking-tight text-text-primary uppercase">Import Data</h3>
					<p class="text-xs text-text-secondary italic">JSON Format (.json)</p>
				</div>
			</header>

			{#if error}
				<div
					class="animate-in fade-in slide-in-from-top-2 flex items-start gap-3 border-2 border-error bg-error/10 p-4 text-error"
				>
					<AlertCircle size={18} class="mt-0.5 shrink-0" />
					<p class="font-mono text-xs leading-relaxed">{error}</p>
				</div>
			{/if}

			{#if success}
				<div
					class="animate-in fade-in slide-in-from-top-2 flex items-start gap-3 border-2 border-success bg-success/10 p-4 text-success"
				>
					<CheckCircle2 size={18} class="mt-0.5 shrink-0" />
					<p class="font-mono text-xs leading-relaxed">{success}</p>
				</div>
			{/if}

			<div class="space-y-4">
				<div class="space-y-2">
					<p class="text-[10px] font-bold tracking-widest text-text-secondary uppercase">
						Import Mode
					</p>
					<div class="grid grid-cols-2 gap-4">
						<button
							onclick={() => (importMode = 'merge')}
							class="flex flex-col gap-1 border-2 p-3 transition-all transition-colors {importMode ===
							'merge'
								? 'border-accent bg-accent/10'
								: 'border-text-secondary/30 hover:border-text-secondary'}"
						>
							<span class="text-xs font-bold tracking-wider uppercase">Merge</span>
							<span class="text-[9px] text-text-secondary">Keep current data, add new items</span>
						</button>
						<button
							onclick={() => (importMode = 'replace')}
							class="flex flex-col gap-1 border-2 p-3 transition-all transition-colors {importMode ===
							'replace'
								? 'border-error bg-error/10'
								: 'border-text-secondary/30 hover:border-text-secondary'}"
						>
							<span class="text-xs font-bold tracking-wider uppercase">Replace</span>
							<span class="text-[9px] text-error/80 text-text-secondary"
								>Delete current workspace first</span
							>
						</button>
					</div>
				</div>

				<div class="pt-2">
					<label
						class="btn-primary flex w-full cursor-pointer items-center justify-center gap-2 py-4 {isImporting
							? 'cursor-not-allowed opacity-50'
							: ''}"
					>
						{isImporting ? 'Processing...' : 'Select JSON File'}
						<input
							type="file"
							accept=".json"
							class="hidden"
							onchange={handleFileSelect}
							disabled={isImporting}
						/>
					</label>
				</div>
			</div>

			<footer class="flex justify-end pt-2">
				<button
					onclick={() => (show = false)}
					class="px-4 py-2 text-xs font-bold tracking-widest text-text-secondary uppercase hover:text-text-primary"
				>
					Cancel
				</button>
			</footer>
		</div>
	</div>
{/if}
