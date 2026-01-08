<script lang="ts">
	import { page } from '$app/stores';
	import { sidebarOpen, nodeStatus } from '$lib/stores';
	import { StatusIndicator } from '$lib/components/ui';
	import {
		LayoutDashboard,
		Vote,
		Lightbulb,
		Clock,
		Factory,
		Activity,
		Globe,
		Settings,
		ChevronLeft,
		ChevronRight,
		Hexagon,
		BookOpen,
		HelpCircle
	} from 'lucide-svelte';

	const navItems = [
		{ href: '/', icon: LayoutDashboard, label: 'Dashboard', section: 'dashboard' },
		{ href: '/cds', icon: Vote, label: 'Decisions (CDS)', section: 'cds' },
		{ href: '/oad', icon: Lightbulb, label: 'Designs (OAD)', section: 'oad' },
		{ href: '/itc', icon: Clock, label: 'Time Credits (ITC)', section: 'itc' },
		{ href: '/cos', icon: Factory, label: 'Production (COS)', section: 'cos' },
		{ href: '/frs', icon: Activity, label: 'Feedback (FRS)', section: 'frs' },
		{ href: '/federation', icon: Globe, label: 'Federation', section: 'federation' },
		{ href: '/docs', icon: BookOpen, label: 'Documentation', section: 'docs' }
	];

	$: currentPath = $page.url.pathname;

	function isActive(href: string): boolean {
		if (href === '/') return currentPath === '/';
		return currentPath.startsWith(href);
	}

	function toggleSidebar() {
		sidebarOpen.update((v) => !v);
	}
</script>

<aside
	class="fixed left-0 top-0 h-screen bg-surface-900/80 backdrop-blur-xl border-r border-surface-800 transition-all duration-300 z-40 flex flex-col"
	class:w-64={$sidebarOpen}
	class:w-20={!$sidebarOpen}
>
	<!-- Logo -->
	<div class="flex items-center gap-3 p-5 border-b border-surface-800">
		<div class="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500">
			<Hexagon size={24} class="text-white" />
		</div>
		{#if $sidebarOpen}
			<div class="overflow-hidden">
				<h1 class="text-lg font-bold gradient-text">INTEGRAL</h1>
				<p class="text-xs text-surface-500 truncate">Post-Monetary System</p>
			</div>
		{/if}
	</div>

	<!-- Navigation -->
	<nav class="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
		{#each navItems as item}
			<a
				href={item.href}
				class="nav-item {isActive(item.href) ? 'nav-item-active' : ''}"
				title={!$sidebarOpen ? item.label : undefined}
			>
				<svelte:component this={item.icon} size={20} />
				{#if $sidebarOpen}
					<span class="truncate">{item.label}</span>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- Node Status -->
	<div class="p-3 border-t border-surface-800">
		{#if $sidebarOpen}
			<div class="p-3 rounded-lg bg-surface-800/50">
				<div class="flex items-center gap-2 mb-2">
					<StatusIndicator
						status={$nodeStatus?.isRunning ? 'online' : 'offline'}
						pulse={$nodeStatus?.isRunning}
					/>
					<span class="text-sm font-medium text-surface-300">
						{$nodeStatus?.isRunning ? 'Connected' : 'Offline'}
					</span>
				</div>
				{#if $nodeStatus}
					<p class="text-xs text-surface-500 truncate">
						Node: {$nodeStatus.nodeId}
					</p>
					<p class="text-xs text-surface-500">
						{$nodeStatus.connectedRelays} relays · {$nodeStatus.knownNodes} nodes
					</p>
				{/if}
			</div>
		{:else}
			<div class="flex justify-center">
				<StatusIndicator
					status={$nodeStatus?.isRunning ? 'online' : 'offline'}
					pulse={$nodeStatus?.isRunning}
				/>
			</div>
		{/if}
	</div>

	<!-- Settings & Collapse -->
	<div class="p-3 border-t border-surface-800 space-y-1">
		<a
			href="/settings"
			class="nav-item {isActive('/settings') ? 'nav-item-active' : ''}"
			title={!$sidebarOpen ? 'Settings' : undefined}
		>
			<Settings size={20} />
			{#if $sidebarOpen}
				<span>Settings</span>
			{/if}
		</a>

		<button
			class="nav-item w-full"
			on:click={toggleSidebar}
			title={$sidebarOpen ? 'Collapse' : 'Expand'}
		>
			{#if $sidebarOpen}
				<ChevronLeft size={20} />
				<span>Collapse</span>
			{:else}
				<ChevronRight size={20} />
			{/if}
		</button>
	</div>
</aside>
