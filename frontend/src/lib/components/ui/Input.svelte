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

	{#if type === 'password'}
		<input
			{id}
			type="password"
			{placeholder}
			{disabled}
			bind:value
			class="input {error ? 'input-error' : ''}"
			on:input
			on:focus
			on:blur
		/>
	{:else if type === 'email'}
		<input
			{id}
			type="email"
			{placeholder}
			{disabled}
			bind:value
			class="input {error ? 'input-error' : ''}"
			on:input
			on:focus
			on:blur
		/>
	{:else if type === 'number'}
		<input
			{id}
			type="number"
			{placeholder}
			{disabled}
			bind:value
			class="input {error ? 'input-error' : ''}"
			on:input
			on:focus
			on:blur
		/>
	{:else if type === 'search'}
		<input
			{id}
			type="search"
			{placeholder}
			{disabled}
			bind:value
			class="input {error ? 'input-error' : ''}"
			on:input
			on:focus
			on:blur
		/>
	{:else}
		<input
			{id}
			type="text"
			{placeholder}
			{disabled}
			bind:value
			class="input {error ? 'input-error' : ''}"
			on:input
			on:focus
			on:blur
		/>
	{/if}

	{#if error}
		<p class="text-sm text-red-400">{error}</p>
	{/if}
</div>
