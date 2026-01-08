<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-svelte';
  import { toasts, type Toast } from '$lib/stores/toast';

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
  };

  const colors = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
  };

  const iconColors = {
    success: 'text-emerald-400',
    error: 'text-red-400',
    warning: 'text-amber-400',
    info: 'text-blue-400'
  };
</script>

<div class="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
  {#each $toasts as toast (toast.id)}
    <div
      in:fly={{ x: 100, duration: 300 }}
      out:fade={{ duration: 200 }}
      class="pointer-events-auto rounded-xl border backdrop-blur-xl shadow-2xl p-4 {colors[toast.type]}"
      role="alert"
    >
      <div class="flex items-start gap-3">
        <svelte:component this={icons[toast.type]} class="w-5 h-5 mt-0.5 flex-shrink-0 {iconColors[toast.type]}" />
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-white">{toast.title}</p>
          {#if toast.message}
            <p class="mt-1 text-sm text-gray-300">{toast.message}</p>
          {/if}
        </div>
        {#if toast.dismissible}
          <button
            on:click={() => toasts.dismiss(toast.id)}
            class="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <X class="w-4 h-4 text-gray-400" />
          </button>
        {/if}
      </div>
    </div>
  {/each}
</div>
