<script lang="ts">
  export let value: string = '';
  export let options: { value: string; label: string; description?: string }[] = [];
  export let name: string = '';
  export let disabled: boolean = false;
</script>

<div class="space-y-3" role="radiogroup">
  {#each options as option}
    <label
      class="flex items-start gap-3 cursor-pointer group p-3 rounded-xl border
             {value === option.value ? 'border-primary-500 bg-primary-500/5' : 'border-surface-700 bg-surface-800/30'}
             hover:border-surface-500 transition-colors"
      class:opacity-50={disabled}
      class:cursor-not-allowed={disabled}
    >
      <div class="relative flex-shrink-0 mt-0.5">
        <input
          type="radio"
          {name}
          value={option.value}
          bind:group={value}
          {disabled}
          class="sr-only peer"
          on:change
        />
        <div
          class="w-5 h-5 rounded-full border-2 border-surface-600 bg-surface-800/50
                 peer-checked:border-primary-500
                 peer-focus:ring-2 peer-focus:ring-primary-500/20
                 group-hover:border-surface-500 transition-colors
                 flex items-center justify-center"
        >
          {#if value === option.value}
            <div class="w-2.5 h-2.5 rounded-full bg-primary-500" />
          {/if}
        </div>
      </div>

      <div>
        <span class="text-sm font-medium text-white">{option.label}</span>
        {#if option.description}
          <p class="text-xs text-gray-400 mt-0.5">{option.description}</p>
        {/if}
      </div>
    </label>
  {/each}
</div>
