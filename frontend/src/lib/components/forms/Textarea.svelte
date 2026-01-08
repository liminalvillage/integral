<script lang="ts">
  export let value: string = '';
  export let placeholder: string = '';
  export let disabled: boolean = false;
  export let error: boolean = false;
  export let id: string = '';
  export let name: string = '';
  export let rows: number = 4;
  export let maxlength: number | undefined = undefined;

  $: borderClass = error
    ? 'border-red-500/50 focus:border-red-500'
    : 'border-surface-600 focus:border-primary-500';

  $: charCount = value.length;
</script>

<div class="relative">
  <textarea
    {id}
    {name}
    bind:value
    {placeholder}
    {disabled}
    {rows}
    {maxlength}
    class="w-full px-4 py-3 rounded-xl bg-surface-800/50 border {borderClass}
           text-white placeholder-gray-500 resize-none transition-colors
           disabled:opacity-50 disabled:cursor-not-allowed
           focus:outline-none focus:ring-2 focus:ring-primary-500/20"
    on:input
    on:blur
    on:focus
  />

  {#if maxlength}
    <div class="absolute right-3 bottom-3 text-xs text-gray-500">
      {charCount}/{maxlength}
    </div>
  {/if}
</div>
