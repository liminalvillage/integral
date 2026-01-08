<script lang="ts">
  import { ChevronDown } from 'lucide-svelte';

  export let value: string = '';
  export let options: { value: string; label: string }[] = [];
  export let placeholder: string = 'Select an option';
  export let disabled: boolean = false;
  export let error: boolean = false;
  export let id: string = '';
  export let name: string = '';

  $: borderClass = error
    ? 'border-red-500/50 focus:border-red-500'
    : 'border-surface-600 focus:border-primary-500';
</script>

<div class="relative">
  <select
    {id}
    {name}
    bind:value
    {disabled}
    class="w-full px-4 py-2.5 pr-10 rounded-xl bg-surface-800/50 border {borderClass}
           text-white appearance-none cursor-pointer transition-colors
           disabled:opacity-50 disabled:cursor-not-allowed
           focus:outline-none focus:ring-2 focus:ring-primary-500/20"
    on:change
    on:blur
  >
    {#if placeholder}
      <option value="" disabled selected class="text-gray-500">{placeholder}</option>
    {/if}
    {#each options as option}
      <option value={option.value} class="bg-surface-800 text-white">
        {option.label}
      </option>
    {/each}
  </select>

  <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
    <ChevronDown class="w-5 h-5 text-gray-400" />
  </div>
</div>
