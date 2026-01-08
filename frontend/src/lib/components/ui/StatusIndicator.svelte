<script lang="ts">
	export let status: 'online' | 'offline' | 'warning' | 'error' | 'pending' = 'offline';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let pulse = false;
	export let label = '';

	const statusClasses = {
		online: 'bg-eco-400',
		offline: 'bg-surface-500',
		warning: 'bg-warning-400',
		error: 'bg-red-400',
		pending: 'bg-primary-400'
	};

	const shadowClasses = {
		online: 'shadow-eco-500/50',
		offline: '',
		warning: 'shadow-warning-500/50',
		error: 'shadow-red-500/50',
		pending: 'shadow-primary-500/50'
	};

	const sizeClasses = {
		sm: 'w-1.5 h-1.5',
		md: 'w-2 h-2',
		lg: 'w-3 h-3'
	};
</script>

<span class="inline-flex items-center gap-2 {$$props.class || ''}">
	<span
		class="rounded-full {statusClasses[status]} {sizeClasses[size]} {pulse ? 'animate-pulse' : ''} {status !== 'offline' ? 'shadow-lg ' + shadowClasses[status] : ''}"
	></span>
	{#if label}
		<span class="text-sm text-surface-400">{label}</span>
	{/if}
</span>
