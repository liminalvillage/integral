<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { createEventDispatcher, onMount } from 'svelte';
  import { X } from 'lucide-svelte';
  import Button from '../ui/Button.svelte';

  export let steps: {
    target: string;
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
  }[] = [];

  export let active: boolean = false;

  const dispatch = createEventDispatcher();

  let currentStep = 0;
  let targetRect: DOMRect | null = null;
  let tooltipPosition = { top: 0, left: 0 };

  function updatePosition() {
    if (!active || currentStep >= steps.length) return;

    const step = steps[currentStep];
    const target = document.querySelector(step.target);

    if (target) {
      targetRect = target.getBoundingClientRect();
      const position = step.position || 'bottom';

      switch (position) {
        case 'top':
          tooltipPosition = {
            top: targetRect.top - 16,
            left: targetRect.left + targetRect.width / 2
          };
          break;
        case 'bottom':
          tooltipPosition = {
            top: targetRect.bottom + 16,
            left: targetRect.left + targetRect.width / 2
          };
          break;
        case 'left':
          tooltipPosition = {
            top: targetRect.top + targetRect.height / 2,
            left: targetRect.left - 16
          };
          break;
        case 'right':
          tooltipPosition = {
            top: targetRect.top + targetRect.height / 2,
            left: targetRect.right + 16
          };
          break;
      }

      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function next() {
    if (currentStep < steps.length - 1) {
      currentStep++;
      updatePosition();
    } else {
      complete();
    }
  }

  function prev() {
    if (currentStep > 0) {
      currentStep--;
      updatePosition();
    }
  }

  function complete() {
    active = false;
    currentStep = 0;
    dispatch('complete');
  }

  onMount(() => {
    if (active) {
      updatePosition();
    }
  });

  $: if (active) {
    updatePosition();
  }

  $: step = steps[currentStep];
  $: isLast = currentStep === steps.length - 1;
</script>

<svelte:window on:resize={updatePosition} />

{#if active && step && targetRect}
  <!-- Overlay with cutout -->
  <div class="fixed inset-0 z-40" transition:fade={{ duration: 200 }}>
    <svg class="absolute inset-0 w-full h-full">
      <defs>
        <mask id="spotlight-mask">
          <rect width="100%" height="100%" fill="white" />
          <rect
            x={targetRect.left - 8}
            y={targetRect.top - 8}
            width={targetRect.width + 16}
            height={targetRect.height + 16}
            rx="8"
            fill="black"
          />
        </mask>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill="rgba(0, 0, 0, 0.8)"
        mask="url(#spotlight-mask)"
      />
    </svg>

    <!-- Target highlight -->
    <div
      class="absolute border-2 border-primary-500 rounded-lg pointer-events-none shadow-glow-primary"
      style="
        top: {targetRect.top - 8}px;
        left: {targetRect.left - 8}px;
        width: {targetRect.width + 16}px;
        height: {targetRect.height + 16}px;
      "
    />

    <!-- Tooltip -->
    <div
      class="absolute z-50 w-80 bg-surface-800 rounded-xl shadow-2xl border border-surface-700 overflow-hidden"
      style="
        top: {tooltipPosition.top}px;
        left: {tooltipPosition.left}px;
        transform: translate(-50%, 0);
      "
      transition:fly={{ y: 10, duration: 200 }}
    >
      <div class="p-4">
        <div class="flex items-start justify-between mb-2">
          <h4 class="font-semibold text-white">{step.title}</h4>
          <button
            on:click={complete}
            class="p-1 rounded-lg hover:bg-surface-700 transition-colors"
          >
            <X class="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <p class="text-sm text-gray-300 mb-4">{step.content}</p>

        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500">
            {currentStep + 1} of {steps.length}
          </span>
          <div class="flex gap-2">
            {#if currentStep > 0}
              <Button size="sm" variant="ghost" on:click={prev}>Back</Button>
            {/if}
            <Button size="sm" variant="primary" on:click={next}>
              {isLast ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
