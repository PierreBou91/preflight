<script lang="ts">
	import { page } from '$app/stores';
	import RunView from '$lib/components/RunView.svelte';

	let recordId = $derived($page.params.id);
	let readonly = $derived($page.url.searchParams.get('readonly') === 'true');
</script>

<RunView {recordId} {readonly} />
