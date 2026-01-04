<script lang="ts">
	import { goto } from '$app/navigation';
	import { recordStore } from '$lib/stores/records.svelte';
	import { ArrowLeft, CheckCircle, User } from 'lucide-svelte';
	import ConfirmationModal from './ConfirmationModal.svelte';
	import RunTimer from './RunTimer.svelte';
	import RunTree from './RunTree.svelte';

	let { recordId, readonly = false } = $props();

	// Initialize active record ID for the store
	$effect(() => {
		if (recordId && !readonly) {
			recordStore.activeRecordId = recordId;
		}
	});

	let showFinishModal = $state(false);

	let record = $derived(recordStore.records.find((r) => r.id === recordId));

	let progress = $derived.by(() => {
		if (!record) return 0;
		const total = Object.values(record.items).length;
		if (total === 0) return 0;
		const checked = Object.values(record.items).filter((i) => i.checked).length;
		return Math.round((checked / total) * 100);
	});

	let isComplete = $derived(progress === 100);

	async function handleFinish() {
		goto('/');
	}
</script>

{#if record}
	<div class="mx-auto max-w-4xl space-y-6">
		<header class="flex items-start justify-between border-b-2 border-text-secondary pb-4">
			<div class="flex items-center gap-4">
				<a href="/" class="p-2 text-text-secondary transition-colors hover:bg-bg-secondary">
					<ArrowLeft size={20} />
				</a>
				<div>
					<h2 class="text-2xl font-black tracking-tighter text-text-primary uppercase">
						{record.name}
					</h2>
					<div class="flex items-center gap-4 text-sm font-medium text-text-secondary italic">
						<div class="flex items-center gap-2">
							<span
								class="non-italic rounded border border-text-secondary/20 bg-bg-secondary px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase"
							>
								{readonly ? 'View Record' : 'Record Execution'}
							</span>
						</div>
						<div class="flex items-center gap-1.5 opacity-80">
							<User size={14} />
							<span
								>Pilot: <span class="non-italic font-bold text-text-primary">{record.pilot}</span
								></span
							>
						</div>
						{#if isComplete}
							<span class="non-italic flex items-center gap-1 font-bold text-success">
								<CheckCircle size={14} />
								COMPLETE
							</span>
						{/if}
					</div>
				</div>
			</div>

			<RunTimer {record} {readonly} />
		</header>

		<div class="space-y-6">
			<!-- Progress Bar -->
			<div class="space-y-2">
				<div
					class="flex justify-between text-[10px] font-bold tracking-widest text-text-secondary uppercase"
				>
					<span>Completion Progress</span>
					<span>{progress}%</span>
				</div>
				<div class="h-4 overflow-hidden border-2 border-text-secondary bg-bg-secondary">
					<div
						class="h-full bg-success transition-all duration-500 ease-out"
						style="width: {progress}%"
					></div>
				</div>
			</div>

			<div class="card space-y-4 p-6">
				<h3 class="text-xs font-bold tracking-widest text-accent uppercase">Checklist</h3>
				<div class="border-2 border-text-secondary/10 bg-bg-primary/30 p-2">
					<RunTree allItems={record.items} {readonly} />
				</div>
			</div>

			{#if isComplete && !readonly}
				<button
					onclick={() => (showFinishModal = true)}
					class="btn-primary flex w-full animate-bounce items-center justify-center gap-3 py-4 text-lg font-black tracking-widest uppercase"
				>
					<CheckCircle size={24} />
					Finish Checklist
				</button>
			{/if}
		</div>
	</div>

	<ConfirmationModal
		bind:show={showFinishModal}
		title="Finish Checklist?"
		message="Are you sure you want to finish this checklist run? The completion time will be recorded."
		confirmText="Finish"
		type="success"
		onConfirm={handleFinish}
	/>
{:else}
	<div class="flex h-full items-center justify-center text-text-secondary italic">
		Loading record...
	</div>
{/if}
