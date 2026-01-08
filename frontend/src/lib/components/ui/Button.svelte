<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' = 'primary';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let disabled = false;
	export let loading = false;
	export let icon = false;
	export let type: 'button' | 'submit' | 'reset' = 'button';

	const dispatch = createEventDispatcher();

	const variantClasses = {
		primary: 'btn-primary',
		secondary: 'btn-secondary',
		ghost: 'btn-ghost',
		danger: 'btn-danger',
		success: 'btn-success'
	};

	const sizeClasses = {
		sm: 'btn-sm',
		md: '',
		lg: 'btn-lg'
	};

	function handleClick(e: MouseEvent) {
		if (!disabled && !loading) {
			dispatch('click', e);
		}
	}
</script>

<button
	{type}
	class="{variantClasses[variant]} {sizeClasses[size]} {icon ? 'btn-icon' : ''} {$$props.class || ''}"
	disabled={disabled || loading}
	on:click={handleClick}
>
	{#if loading}
		<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
		</svg>
	{/if}
	<slot />
</button>
