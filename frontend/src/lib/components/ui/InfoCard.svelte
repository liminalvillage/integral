<script lang="ts">
  import { Info } from 'lucide-svelte';
  import type { ComponentType } from 'svelte';

  export let title: string;
  export let description: string;
  export let icon: ComponentType = Info;
  export let color: 'primary' | 'emerald' | 'amber' | 'blue' | 'purple' = 'primary';

  const colorClasses = {
    primary: 'bg-primary-500/10 text-primary-400 border-primary-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
  };

  const iconBg = {
    primary: 'bg-primary-500/20',
    emerald: 'bg-emerald-500/20',
    amber: 'bg-amber-500/20',
    blue: 'bg-blue-500/20',
    purple: 'bg-purple-500/20'
  };
</script>

<div class="rounded-xl border p-4 {colorClasses[color]}">
  <div class="flex gap-4">
    <div class="flex-shrink-0 p-3 rounded-xl {iconBg[color]}">
      <svelte:component this={icon} class="w-6 h-6" />
    </div>
    <div>
      <h4 class="font-semibold text-white mb-1">{title}</h4>
      <p class="text-sm opacity-80">{description}</p>
      {#if $$slots.default}
        <div class="mt-3">
          <slot />
        </div>
      {/if}
    </div>
  </div>
</div>
