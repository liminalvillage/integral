<script lang="ts">
	export let variant: 'default' | 'hover' | 'gradient' = 'default';
	export let padding: 'none' | 'sm' | 'md' | 'lg' = 'md';

	const paddingClasses = {
		none: '',
		sm: 'p-3',
		md: 'p-5',
		lg: 'p-6'
	};

	const variantClasses = {
		default: 'card',
		hover: 'card-hover cursor-pointer',
		gradient: 'card gradient-border'
	};
</script>

<div class="{variantClasses[variant]} {paddingClasses[padding]} {$$props.class || ''}">
	<slot />
</div>
