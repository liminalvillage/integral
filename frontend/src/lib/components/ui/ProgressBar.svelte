<script lang="ts">
	export let value = 0;
	export let max = 100;
	export let showLabel = false;
	export let color: 'primary' | 'success' | 'warning' | 'danger' = 'primary';
	export let size: 'sm' | 'md' | 'lg' = 'md';

	$: percentage = Math.min(100, Math.max(0, (value / max) * 100));

	const colorClasses = {
		primary: 'from-primary-600 to-primary-400',
		success: 'from-eco-600 to-eco-400',
		warning: 'from-warning-600 to-warning-400',
		danger: 'from-red-600 to-red-400'
	};

	const sizeClasses = {
		sm: 'h-1',
		md: 'h-2',
		lg: 'h-3'
	};
</script>

<div class="w-full {$$props.class || ''}">
	{#if showLabel}
		<div class="flex justify-between text-sm mb-1">
			<span class="text-surface-400"><slot /></span>
			<span class="text-surface-300 font-medium">{percentage.toFixed(0)}%</span>
		</div>
	{/if}
	<div class="progress-bar {sizeClasses[size]}">
		<div
			class="h-full bg-gradient-to-r {colorClasses[color]} rounded-full transition-all duration-500"
			style="width: {percentage}%"
		></div>
	</div>
</div>
