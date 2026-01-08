<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let tabs: Array<{ id: string; label: string; count?: number }>;
	export let activeTab: string;

	const dispatch = createEventDispatcher();

	function selectTab(id: string) {
		activeTab = id;
		dispatch('change', id);
	}
</script>

<div class="border-b border-surface-800 {$$props.class || ''}">
	<nav class="flex gap-1 -mb-px">
		{#each tabs as tab}
			<button
				class="tab {activeTab === tab.id ? 'tab-active' : ''}"
				on:click={() => selectTab(tab.id)}
			>
				{tab.label}
				{#if tab.count !== undefined}
					<span class="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-surface-800 text-surface-400">
						{tab.count}
					</span>
				{/if}
			</button>
		{/each}
	</nav>
</div>
