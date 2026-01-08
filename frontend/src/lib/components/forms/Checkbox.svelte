<script lang="ts">
  import { Check } from 'lucide-svelte';

  export let checked: boolean = false;
  export let disabled: boolean = false;
  export let id: string = '';
  export let name: string = '';
  export let label: string = '';
  export let description: string = '';
</script>

<label
  class="flex items-start gap-3 cursor-pointer group"
  class:opacity-50={disabled}
  class:cursor-not-allowed={disabled}
>
  <div class="relative flex-shrink-0 mt-0.5">
    <input
      type="checkbox"
      {id}
      {name}
      bind:checked
      {disabled}
      class="sr-only peer"
      on:change
    />
    <div
      class="w-5 h-5 rounded-md border-2 border-surface-600 bg-surface-800/50
             peer-checked:border-primary-500 peer-checked:bg-primary-500
             peer-focus:ring-2 peer-focus:ring-primary-500/20
             group-hover:border-surface-500 transition-colors"
    >
      {#if checked}
        <Check class="w-full h-full text-white p-0.5" />
      {/if}
    </div>
  </div>

  <div>
    {#if label}
      <span class="text-sm font-medium text-white">{label}</span>
    {/if}
    {#if description}
      <p class="text-xs text-gray-400 mt-0.5">{description}</p>
    {/if}
  </div>
</label>
