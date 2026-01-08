<script lang="ts">
  import { AlertCircle, CheckCircle } from 'lucide-svelte';

  export let label: string;
  export let name: string;
  export let errors: string[] = [];
  export let touched: boolean = false;
  export let hint: string = '';
  export let required: boolean = false;

  $: showError = touched && errors.length > 0;
  $: showSuccess = touched && errors.length === 0;
</script>

<div class="space-y-1.5">
  <label for={name} class="block text-sm font-medium text-gray-300">
    {label}
    {#if required}
      <span class="text-red-400">*</span>
    {/if}
  </label>

  <div class="relative">
    <slot />

    {#if showError}
      <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <AlertCircle class="w-5 h-5 text-red-400" />
      </div>
    {:else if showSuccess}
      <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <CheckCircle class="w-5 h-5 text-emerald-400" />
      </div>
    {/if}
  </div>

  {#if hint && !showError}
    <p class="text-xs text-gray-500">{hint}</p>
  {/if}

  {#if showError}
    <div class="space-y-1">
      {#each errors as error}
        <p class="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle class="w-3 h-3" />
          {error}
        </p>
      {/each}
    </div>
  {/if}
</div>
