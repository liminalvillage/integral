<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { X } from 'lucide-svelte';

	export let open = false;
	export let title = '';
	export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';

	const dispatch = createEventDispatcher();

	const sizeClasses = {
		sm: 'max-w-md',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl'
	};

	function close() {
		dispatch('close');
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			close();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<!-- Backdrop -->
		<div
			class="modal-backdrop"
			transition:fade={{ duration: 200 }}
			on:click={close}
			on:keypress={(e) => e.key === 'Enter' && close()}
			role="button"
			tabindex="0"
			aria-label="Close modal"
		></div>

		<!-- Modal -->
		<div
			class="relative z-50 w-full {sizeClasses[size]} card p-0 shadow-2xl"
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-5 border-b border-surface-800">
				<h3 class="text-lg font-semibold text-surface-100">{title}</h3>
				<button
					class="p-1.5 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors"
					on:click={close}
				>
					<X size={20} />
				</button>
			</div>

			<!-- Content -->
			<div class="p-5">
				<slot />
			</div>

			<!-- Footer -->
			{#if $$slots.footer}
				<div class="flex items-center justify-end gap-3 p-5 border-t border-surface-800">
					<slot name="footer" />
				</div>
			{/if}
		</div>
	</div>
{/if}
