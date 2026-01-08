<script lang="ts">
	export let value = '';
	export let type: 'text' | 'email' | 'password' | 'number' | 'search' = 'text';
	export let placeholder = '';
	export let label = '';
	export let error = '';
	export let disabled = false;
	export let id = '';
</script>

<div class="space-y-1.5 {$$props.class || ''}">
	{#if label}
		<label for={id} class="label">{label}</label>
	{/if}

	<input
		{id}
		{type}
		{placeholder}
		{disabled}
		bind:value
		class="input {error ? 'input-error' : ''}"
		on:input
		on:focus
		on:blur
	/>

	{#if error}
		<p class="text-sm text-red-400">{error}</p>
	{/if}
</div>
