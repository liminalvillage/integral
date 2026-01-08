<script lang="ts">
	import { TrendingUp, TrendingDown, Minus } from 'lucide-svelte';
	import Card from './Card.svelte';

	export let title: string;
	export let value: string | number;
	export let subtitle = '';
	export let trend: 'up' | 'down' | 'neutral' | null = null;
	export let trendValue = '';
	export let icon: typeof TrendingUp | null = null;
	export let color: 'primary' | 'success' | 'warning' | 'danger' = 'primary';

	const colorClasses = {
		primary: 'text-primary-400',
		success: 'text-eco-400',
		warning: 'text-warning-400',
		danger: 'text-red-400'
	};

	const iconBgClasses = {
		primary: 'bg-primary-500/10',
		success: 'bg-eco-500/10',
		warning: 'bg-warning-500/10',
		danger: 'bg-red-500/10'
	};

	const trendColors = {
		up: 'text-eco-400',
		down: 'text-red-400',
		neutral: 'text-surface-400'
	};
</script>

<Card class="{$$props.class || ''}">
	<div class="flex items-start justify-between">
		<div class="space-y-1">
			<p class="metric-label">{title}</p>
			<p class="metric-value {colorClasses[color]}">{value}</p>
			{#if subtitle}
				<p class="text-sm text-surface-500">{subtitle}</p>
			{/if}
		</div>

		{#if icon}
			<div class="p-3 rounded-xl {iconBgClasses[color]}">
				<svelte:component this={icon} size={24} class={colorClasses[color]} />
			</div>
		{/if}
	</div>

	{#if trend}
		<div class="flex items-center gap-1 mt-3 pt-3 border-t border-surface-800">
			{#if trend === 'up'}
				<TrendingUp size={16} class={trendColors.up} />
			{:else if trend === 'down'}
				<TrendingDown size={16} class={trendColors.down} />
			{:else}
				<Minus size={16} class={trendColors.neutral} />
			{/if}
			<span class="text-sm {trendColors[trend]}">{trendValue}</span>
		</div>
	{/if}
</Card>
