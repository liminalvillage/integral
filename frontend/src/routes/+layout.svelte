<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { Sidebar } from '$lib/components/layout';
	import { sidebarOpen, nodeStatus, errorMessage, successMessage } from '$lib/stores';
	import { fade } from 'svelte/transition';
	import { X, CheckCircle, AlertCircle } from 'lucide-svelte';

	// Mock node status for development
	onMount(() => {
		nodeStatus.set({
			nodeId: 'node_abc12345',
			isRunning: true,
			publicKey: 'npub1...',
			connectedRelays: 3,
			knownNodes: 7,
			subsystems: {
				cds: true,
				oad: true,
				itc: true,
				cos: true,
				frs: true
			}
		});
	});
</script>

<div class="min-h-screen bg-surface-950 bg-grid-pattern bg-grid">
	<Sidebar />

	<main
		class="transition-all duration-300"
		class:ml-64={$sidebarOpen}
		class:ml-20={!$sidebarOpen}
	>
		<slot />
	</main>

	<!-- Toast Notifications -->
	{#if $errorMessage}
		<div
			class="fixed bottom-4 right-4 z-50"
			transition:fade={{ duration: 200 }}
		>
			<div class="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg backdrop-blur-sm">
				<AlertCircle size={20} class="text-red-400" />
				<span class="text-sm text-red-300">{$errorMessage}</span>
				<button
					class="p-1 hover:bg-red-500/20 rounded"
					on:click={() => errorMessage.set(null)}
				>
					<X size={16} class="text-red-400" />
				</button>
			</div>
		</div>
	{/if}

	{#if $successMessage}
		<div
			class="fixed bottom-4 right-4 z-50"
			transition:fade={{ duration: 200 }}
		>
			<div class="flex items-center gap-3 px-4 py-3 bg-eco-500/10 border border-eco-500/30 rounded-lg backdrop-blur-sm">
				<CheckCircle size={20} class="text-eco-400" />
				<span class="text-sm text-eco-300">{$successMessage}</span>
				<button
					class="p-1 hover:bg-eco-500/20 rounded"
					on:click={() => successMessage.set(null)}
				>
					<X size={16} class="text-eco-400" />
				</button>
			</div>
		</div>
	{/if}
</div>
