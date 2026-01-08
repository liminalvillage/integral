<script lang="ts">
	import { page } from '$app/stores';
	import { sidebarOpen, currentTime } from '$lib/stores';
	import { Button } from '$lib/components/ui';
	import { Bell, Search, User, Plus } from 'lucide-svelte';
	import { format } from 'date-fns';

	export let title = '';
	export let subtitle = '';
	export let showCreateButton = false;
	export let createButtonLabel = 'Create';

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	$: timeString = format($currentTime, 'HH:mm:ss');
	$: dateString = format($currentTime, 'EEEE, MMMM d, yyyy');
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
			<button class="p-2.5 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors">
				<Search size={20} />
			</button>

			<!-- Notifications -->
			<button class="relative p-2.5 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors">
				<Bell size={20} />
				<span class="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full"></span>
			</button>

			<!-- Create Button -->
			{#if showCreateButton}
				<Button variant="primary" size="sm" on:click={() => dispatch('create')}>
					<Plus size={16} />
					{createButtonLabel}
				</Button>
			{/if}

			<!-- User -->
			<button class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-800 transition-colors">
				<div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
					<User size={16} class="text-white" />
				</div>
			</button>
		</div>
	</div>
</header>
