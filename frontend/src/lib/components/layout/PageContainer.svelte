<script lang="ts">
	export let maxWidth: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'full';

	const maxWidthClasses = {
		sm: 'max-w-3xl',
		md: 'max-w-5xl',
		lg: 'max-w-6xl',
		xl: 'max-w-7xl',
		full: ''
	};
</script>

<div class="p-6 {maxWidthClasses[maxWidth]} mx-auto {$$props.class || ''}">
	<slot />
</div>
