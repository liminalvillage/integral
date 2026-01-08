<script lang="ts">
  import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-svelte';

  export let type: 'info' | 'success' | 'warning' | 'error' = 'info';
  export let title: string = '';
  export let dismissible: boolean = false;

  let visible = true;

  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle
  };

  const colors = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    error: 'bg-red-500/10 border-red-500/30 text-red-300'
  };

  const iconColors = {
    info: 'text-blue-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-red-400'
  };
</script>

{#if visible}
  <div class="rounded-xl border p-4 {colors[type]}" role="alert">
    <div class="flex gap-3">
      <svelte:component this={icons[type]} class="w-5 h-5 flex-shrink-0 mt-0.5 {iconColors[type]}" />
      <div class="flex-1">
        {#if title}
          <h4 class="font-semibold text-white mb-1">{title}</h4>
        {/if}
        <div class="text-sm">
          <slot />
        </div>
      </div>
      {#if dismissible}
        <button
          on:click={() => visible = false}
          class="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <X class="w-4 h-4 text-gray-400" />
        </button>
      {/if}
    </div>
  </div>
{/if}
