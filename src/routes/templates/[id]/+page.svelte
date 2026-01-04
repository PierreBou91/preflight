<script lang="ts">
	import { page } from '$app/state';
	import TemplateEditor from '$lib/components/TemplateEditor.svelte';

	let id = $derived(page.params.id);
</script>

<TemplateEditor templateId={id} />
