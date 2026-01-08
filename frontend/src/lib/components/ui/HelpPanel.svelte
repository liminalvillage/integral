<script lang="ts">
  import { slide } from 'svelte/transition';
  import { HelpCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-svelte';

  export let title: string;
  export let expanded: boolean = false;
  export let learnMoreUrl: string = '';

  function toggle() {
    expanded = !expanded;
  }
</script>

<div class="rounded-xl border border-surface-700 bg-surface-800/50 overflow-hidden">
  <button
    on:click={toggle}
    class="w-full flex items-center gap-3 p-4 hover:bg-surface-700/50 transition-colors text-left"
    aria-expanded={expanded}
  >
    <div class="p-2 rounded-lg bg-primary-500/10">
      <HelpCircle class="w-5 h-5 text-primary-400" />
    </div>
    <div class="flex-1">
      <h4 class="font-medium text-white">{title}</h4>
      <p class="text-sm text-gray-400">Click to {expanded ? 'hide' : 'show'} details</p>
    </div>
    {#if expanded}
      <ChevronUp class="w-5 h-5 text-gray-400" />
    {:else}
      <ChevronDown class="w-5 h-5 text-gray-400" />
    {/if}
  </button>

  {#if expanded}
    <div transition:slide={{ duration: 200 }} class="px-4 pb-4 border-t border-surface-700">
      <div class="pt-4 prose prose-invert prose-sm max-w-none">
        <slot />
      </div>
      {#if learnMoreUrl}
        <a
          href={learnMoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 mt-4 text-sm text-primary-400 hover:text-primary-300 transition-colors"
        >
          Learn more
          <ExternalLink class="w-4 h-4" />
        </a>
      {/if}
    </div>
  {/if}
</div>
