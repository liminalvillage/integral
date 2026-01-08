<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { sidebarOpen, currentTime, activityFeed } from '$lib/stores';
	import { Button, Modal, Input } from '$lib/components/ui';
	import { Bell, Search, User, Plus, Settings, LogOut, X } from 'lucide-svelte';
	import { format } from 'date-fns';

	export let title = '';
	export let subtitle = '';
	export let description = '';
	export let showCreateButton = false;
	export let createButtonLabel = 'Create';

	import { createEventDispatcher, onMount } from 'svelte';
	const dispatch = createEventDispatcher();

	$: timeString = format($currentTime, 'HH:mm:ss');
	$: dateString = format($currentTime, 'EEEE, MMMM d, yyyy');

	// Search state
	let showSearchModal = false;
	let searchQuery = '';

	// Notifications state
	let showNotifications = false;
	let notifications = [
		{ id: 1, title: 'New issue created', message: 'Community Workshop Equipment Proposal', time: '5m ago' },
		{ id: 2, title: 'Labor verified', message: 'Your 4.5h of solar panel work has been verified', time: '1h ago' },
		{ id: 3, title: 'Task assigned', message: 'You have been assigned to Batch #47', time: '3h ago' }
	];

	// User menu state
	let showUserMenu = false;

	function handleSearch() {
		if (!searchQuery.trim()) return;
		// Navigate to a search results page or filter current page
		showSearchModal = false;
		// For now just show an alert - in a real app this would navigate or filter
		goto(`/?search=${encodeURIComponent(searchQuery)}`);
		searchQuery = '';
	}

	function handleLogout() {
		localStorage.clear();
		goto('/');
		showUserMenu = false;
	}

	function handleViewProfile() {
		goto('/settings');
		showUserMenu = false;
	}

	function dismissNotification(id: number) {
		notifications = notifications.filter(n => n.id !== id);
	}

	// Close menus when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.notifications-dropdown') && !target.closest('.notifications-trigger')) {
			showNotifications = false;
		}
		if (!target.closest('.user-menu-dropdown') && !target.closest('.user-menu-trigger')) {
			showUserMenu = false;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});
</script>

<header
	class="sticky top-0 z-30 bg-surface-950/80 backdrop-blur-xl border-b border-surface-800"
>
	<div class="flex items-center justify-between h-16 px-6">
		<!-- Title -->
		<div>
			<h1 class="text-xl font-semibold text-surface-100">{title}</h1>
			{#if subtitle}
				<p class="text-sm text-surface-500">{subtitle}</p>
			{/if}
		</div>

		<!-- Right side -->
		<div class="flex items-center gap-4">
			<!-- Time -->
			<div class="hidden md:block text-right">
				<p class="text-sm font-mono text-surface-300">{timeString}</p>
				<p class="text-xs text-surface-500">{dateString}</p>
			</div>

			<!-- Search -->
			<button
				class="p-2.5 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors"
				on:click={() => showSearchModal = true}
			>
				<Search size={20} />
			</button>

			<!-- Notifications -->
			<div class="relative">
				<button
					class="notifications-trigger relative p-2.5 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors"
					on:click={() => showNotifications = !showNotifications}
				>
					<Bell size={20} />
					{#if notifications.length > 0}
						<span class="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full"></span>
					{/if}
				</button>

				{#if showNotifications}
					<div class="notifications-dropdown absolute right-0 top-full mt-2 w-80 bg-surface-900 border border-surface-700 rounded-lg shadow-xl">
						<div class="p-3 border-b border-surface-700">
							<h3 class="font-medium text-surface-100">Notifications</h3>
						</div>
						<div class="max-h-80 overflow-y-auto">
							{#if notifications.length === 0}
								<p class="p-4 text-center text-surface-500 text-sm">No notifications</p>
							{:else}
								{#each notifications as notification}
									<div class="p-3 border-b border-surface-800 hover:bg-surface-800/50 transition-colors">
										<div class="flex items-start justify-between gap-2">
											<div>
												<p class="text-sm font-medium text-surface-200">{notification.title}</p>
												<p class="text-xs text-surface-400 mt-0.5">{notification.message}</p>
												<p class="text-xs text-surface-500 mt-1">{notification.time}</p>
											</div>
											<button
												class="text-surface-500 hover:text-surface-300 p-1"
												on:click={() => dismissNotification(notification.id)}
											>
												<X size={14} />
											</button>
										</div>
									</div>
								{/each}
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<!-- Create Button -->
			{#if showCreateButton}
				<Button variant="primary" size="sm" on:click={() => dispatch('create')}>
					<Plus size={16} />
					{createButtonLabel}
				</Button>
			{/if}

			<!-- User Menu -->
			<div class="relative">
				<button
					class="user-menu-trigger flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-800 transition-colors"
					on:click={() => showUserMenu = !showUserMenu}
				>
					<div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
						<User size={16} class="text-white" />
					</div>
				</button>

				{#if showUserMenu}
					<div class="user-menu-dropdown absolute right-0 top-full mt-2 w-48 bg-surface-900 border border-surface-700 rounded-lg shadow-xl py-1">
						<button
							class="w-full flex items-center gap-2 px-4 py-2 text-left text-surface-300 hover:bg-surface-800 hover:text-surface-100 transition-colors"
							on:click={handleViewProfile}
						>
							<Settings size={16} />
							Settings
						</button>
						<div class="border-t border-surface-700 my-1"></div>
						<button
							class="w-full flex items-center gap-2 px-4 py-2 text-left text-red-400 hover:bg-surface-800 transition-colors"
							on:click={handleLogout}
						>
							<LogOut size={16} />
							Logout
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</header>

<!-- Search Modal -->
<Modal bind:open={showSearchModal} title="Search" size="md">
	<div class="space-y-4">
		<Input
			placeholder="Search issues, designs, tasks..."
			bind:value={searchQuery}
			on:keydown={(e) => e.key === 'Enter' && handleSearch()}
		/>
		<p class="text-sm text-surface-500">Search across all subsystems</p>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showSearchModal = false}>Cancel</Button>
		<Button variant="primary" on:click={handleSearch}>Search</Button>
	</svelte:fragment>
</Modal>
