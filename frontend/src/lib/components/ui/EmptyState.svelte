<script lang="ts">
	import { Inbox } from 'lucide-svelte';

	export let title = 'No data';
	export let description = '';
	export let icon: typeof Inbox = Inbox;
</script>

<div class="flex flex-col items-center justify-center py-12 text-center {$$props.class || ''}">
	<div class="p-4 rounded-full bg-surface-800/50 mb-4">
		<svelte:component this={icon} size={32} class="text-surface-500" />
	</div>
	<h3 class="text-lg font-medium text-surface-300 mb-1">{title}</h3>
	{#if description}
		<p class="text-sm text-surface-500 max-w-sm">{description}</p>
	{/if}
	{#if $$slots.action}
		<div class="mt-4">
			<slot name="action" />
		</div>
	{/if}
</div>
