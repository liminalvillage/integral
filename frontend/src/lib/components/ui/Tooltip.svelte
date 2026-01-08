<script lang="ts">
  import { fade } from 'svelte/transition';

  export let content: string;
  export let position: 'top' | 'bottom' | 'left' | 'right' = 'top';
  export let delay: number = 200;

  let visible = false;
  let timeout: ReturnType<typeof setTimeout>;

  function show() {
    timeout = setTimeout(() => {
      visible = true;
    }, delay);
  }

  function hide() {
    clearTimeout(timeout);
    visible = false;
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-surface-700 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-surface-700 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-surface-700 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-surface-700 border-y-transparent border-l-transparent'
  };
</script>

<div
  class="relative inline-flex"
  on:mouseenter={show}
  on:mouseleave={hide}
  on:focus={show}
  on:blur={hide}
  role="tooltip"
>
  <slot />

  {#if visible}
    <div
      transition:fade={{ duration: 150 }}
      class="absolute z-50 {positionClasses[position]} pointer-events-none"
    >
      <div class="bg-surface-700 text-white text-sm px-3 py-2 rounded-lg shadow-xl max-w-xs whitespace-normal">
        {content}
      </div>
      <div class="absolute border-4 {arrowClasses[position]}" />
    </div>
  {/if}
</div>
