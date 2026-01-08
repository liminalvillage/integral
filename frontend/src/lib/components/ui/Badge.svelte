<script lang="ts">
	export let variant: 'primary' | 'success' | 'warning' | 'danger' | 'info' = 'info';
	export let size: 'sm' | 'md' = 'md';
	export let dot = false;

	const variantClasses = {
		primary: 'badge-primary',
		success: 'badge-success',
		warning: 'badge-warning',
		danger: 'badge-danger',
		info: 'badge-info'
	};

	const sizeClasses = {
		sm: 'text-[10px] px-1.5',
		md: ''
	};

	const dotColors = {
		primary: 'bg-primary-400',
		success: 'bg-eco-400',
		warning: 'bg-warning-400',
		danger: 'bg-red-400',
		info: 'bg-surface-400'
	};
</script>

<span class="{variantClasses[variant]} {sizeClasses[size]} {$$props.class || ''}">
	{#if dot}
		<span class="w-1.5 h-1.5 rounded-full {dotColors[variant]}"></span>
	{/if}
	<slot />
</span>
