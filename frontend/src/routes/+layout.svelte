<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { Sidebar } from '$lib/components/layout';
	import { Toast } from '$lib/components/ui';
	import { OnboardingModal } from '$lib/components/onboarding';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import { sidebarOpen, nodeStatus } from '$lib/stores';

	let showOnboarding = false;
	let mounted = false;

	onMount(() => {
		mounted = true;

		// Check if user has completed onboarding
		if (browser) {
			const onboardingComplete = localStorage.getItem('integral_onboarding_complete');
			if (!onboardingComplete) {
				showOnboarding = true;
			}
		}

		// Mock node status for development
		nodeStatus.set({
			nodeId: 'node_abc12345',
			isRunning: true,
			publicKey: 'npub1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq',
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

	function handleOnboardingComplete() {
		showOnboarding = false;
	}
</script>

<svelte:head>
	<title>INTEGRAL - Cooperative Economic System</title>
	<meta name="description" content="A federated, post-monetary, cybernetic cooperative economic platform" />
</svelte:head>

<ErrorBoundary>
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
		<Toast />

		<!-- Onboarding Modal -->
		{#if mounted}
			<OnboardingModal
				bind:show={showOnboarding}
				on:complete={handleOnboardingComplete}
				on:skip={handleOnboardingComplete}
			/>
		{/if}
	</div>
</ErrorBoundary>
