<script lang="ts">
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { Sidebar } from '$lib/components/layout';
	import { Toast } from '$lib/components/ui';
	import { OnboardingModal } from '$lib/components/onboarding';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import { sidebarOpen, nodeStatus, isConnected, isLoading } from '$lib/stores';
	import { holosphere, nodeApi } from '$lib/api/client';
	import { loadAllData, setupSubscriptions } from '$lib/services/dataLoader';

	let showOnboarding = false;
	let mounted = false;
	let initError: string | null = null;
	let unsubscribe: (() => void) | null = null;

	onMount(async () => {
		mounted = true;
		isLoading.set(true);

		// Check if user has completed onboarding
		if (browser) {
			const onboardingComplete = localStorage.getItem('integral_onboarding_complete');
			if (!onboardingComplete) {
				showOnboarding = true;
			}
		}

		// Initialize HoloSphere backend
		try {
			await holosphere.init();
			isConnected.set(true);

			// Get actual node status from HoloSphere
			const status = await nodeApi.getStatus();
			nodeStatus.set(status);

			// Load all data from HoloSphere (seeds if empty)
			await loadAllData();

			// Setup real-time subscriptions
			unsubscribe = setupSubscriptions();
		} catch (error) {
			console.error('Failed to initialize HoloSphere:', error);
			initError = error instanceof Error ? error.message : 'Unknown error';
			isConnected.set(false);

			// Set fallback status
			nodeStatus.set({
				nodeId: 'node_offline',
				isRunning: false,
				publicKey: null,
				connectedRelays: 0,
				knownNodes: 0,
				subsystems: {
					cds: false,
					oad: false,
					itc: false,
					cos: false,
					frs: false
				}
			});
		} finally {
			isLoading.set(false);
		}
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
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
