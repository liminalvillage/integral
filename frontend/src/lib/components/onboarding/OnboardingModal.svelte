<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  import {
    Vote,
    Lightbulb,
    Clock,
    Factory,
    BarChart3,
    Globe,
    ChevronRight,
    ChevronLeft,
    Check,
    Sparkles
  } from 'lucide-svelte';
  import Button from '../ui/Button.svelte';

  export let show: boolean = false;

  const dispatch = createEventDispatcher();

  let currentStep = 0;

  const steps = [
    {
      icon: Sparkles,
      title: 'Welcome to INTEGRAL',
      subtitle: 'A Post-Monetary Cooperative System',
      description: 'INTEGRAL is a federated, cybernetic economic platform designed to replace traditional monetary systems with transparent, democratic resource allocation.',
      features: [
        'Democratic decision-making through weighted consensus',
        'Transparent labor accounting with time credits',
        'Ecological sustainability built into every design',
        'Decentralized federation via Nostr protocol'
      ],
      color: 'primary'
    },
    {
      icon: Vote,
      title: 'Collaborative Decision System (CDS)',
      subtitle: 'Democratic Governance',
      description: 'Make collective decisions using weighted consensus mechanisms. Every voice counts, with reputation and stake determining voting power.',
      features: [
        'Raise issues and proposals for community input',
        'Vote on decisions with transparent weight calculation',
        'Track decision history with immutable audit trails',
        'Delegate voting power to trusted representatives'
      ],
      color: 'emerald'
    },
    {
      icon: Lightbulb,
      title: 'Open Access Design (OAD)',
      subtitle: 'Sustainable Innovation',
      description: 'Create and certify designs with built-in ecological assessment. All designs are open-source and evaluated for environmental impact.',
      features: [
        'Submit designs through a structured lifecycle',
        'Automatic ecological scoring (lower is better)',
        'Community certification and peer review',
        'Version control for design iterations'
      ],
      color: 'amber'
    },
    {
      icon: Clock,
      title: 'Integral Time Credits (ITC)',
      subtitle: 'Fair Labor Accounting',
      description: 'Track contributions through a transparent time-based system. Labor is valued by skill, complexity, and context factors.',
      features: [
        'Log labor events with detailed categorization',
        'Weighted hours based on skill and difficulty',
        'Time decay prevents hoarding (configurable half-life)',
        'Access goods and services through credit balance'
      ],
      color: 'blue'
    },
    {
      icon: Factory,
      title: 'Cooperative Organization System (COS)',
      subtitle: 'Efficient Production',
      description: 'Plan and coordinate production across the cooperative. Material requirements planning and bottleneck detection built-in.',
      features: [
        'Create production plans with task dependencies',
        'Track materials, inventory, and resource allocation',
        'Automatic bottleneck detection and alerts',
        'Constraint satisfaction for optimal scheduling'
      ],
      color: 'purple'
    },
    {
      icon: BarChart3,
      title: 'Feedback & Review System (FRS)',
      subtitle: 'System Intelligence',
      description: 'Monitor the health of the entire system through signals, diagnostics, and automated recommendations.',
      features: [
        'Real-time system health monitoring',
        'Anomaly detection and diagnostic reports',
        'AI-generated recommendations for optimization',
        'Continuous improvement through feedback loops'
      ],
      color: 'rose'
    },
    {
      icon: Globe,
      title: 'Federation Network',
      subtitle: 'Decentralized Cooperation',
      description: 'Connect with other INTEGRAL nodes through the Nostr protocol. Share resources, decisions, and labor across cooperatives.',
      features: [
        'Cryptographic identity via Nostr keypairs',
        'Relay-based message propagation',
        'Cross-community resource sharing',
        'Autonomous governance with global coordination'
      ],
      color: 'cyan'
    }
  ];

  const colorClasses: Record<string, string> = {
    primary: 'from-primary-500 to-purple-600',
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-600',
    blue: 'from-blue-500 to-cyan-600',
    purple: 'from-purple-500 to-pink-600',
    rose: 'from-rose-500 to-red-600',
    cyan: 'from-cyan-500 to-blue-600'
  };

  const iconBgClasses: Record<string, string> = {
    primary: 'bg-primary-500/20 text-primary-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/20 text-amber-400',
    blue: 'bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/20 text-purple-400',
    rose: 'bg-rose-500/20 text-rose-400',
    cyan: 'bg-cyan-500/20 text-cyan-400'
  };

  function next() {
    if (currentStep < steps.length - 1) {
      currentStep++;
    }
  }

  function prev() {
    if (currentStep > 0) {
      currentStep--;
    }
  }

  function complete() {
    localStorage.setItem('integral_onboarding_complete', 'true');
    dispatch('complete');
    show = false;
  }

  function skip() {
    localStorage.setItem('integral_onboarding_complete', 'true');
    dispatch('skip');
    show = false;
  }

  $: step = steps[currentStep];
  $: isLast = currentStep === steps.length - 1;
</script>

{#if show}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    transition:fade={{ duration: 200 }}
  >
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/80 backdrop-blur-sm"
      on:click={skip}
      on:keypress={(e) => e.key === 'Escape' && skip()}
      role="button"
      tabindex="0"
    />

    <!-- Modal -->
    <div
      class="relative w-full max-w-2xl bg-surface-900 rounded-2xl shadow-2xl overflow-hidden"
      transition:fly={{ y: 20, duration: 300 }}
    >
      <!-- Progress bar -->
      <div class="h-1 bg-surface-800">
        <div
          class="h-full bg-gradient-to-r {colorClasses[step.color]} transition-all duration-300"
          style="width: {((currentStep + 1) / steps.length) * 100}%"
        />
      </div>

      <!-- Header gradient -->
      <div class="h-32 bg-gradient-to-br {colorClasses[step.color]} opacity-20" />

      <!-- Content -->
      <div class="px-8 -mt-16">
        <!-- Icon -->
        <div class="w-20 h-20 rounded-2xl {iconBgClasses[step.color]} flex items-center justify-center mb-6 shadow-xl">
          <svelte:component this={step.icon} class="w-10 h-10" />
        </div>

        <!-- Text -->
        <div class="mb-6">
          <p class="text-sm font-medium text-gray-400 mb-1">{step.subtitle}</p>
          <h2 class="text-2xl font-bold text-white mb-3">{step.title}</h2>
          <p class="text-gray-300">{step.description}</p>
        </div>

        <!-- Features -->
        <ul class="space-y-3 mb-8">
          {#each step.features as feature}
            <li class="flex items-start gap-3">
              <div class="mt-1 p-1 rounded-full bg-emerald-500/20">
                <Check class="w-3 h-3 text-emerald-400" />
              </div>
              <span class="text-gray-300 text-sm">{feature}</span>
            </li>
          {/each}
        </ul>
      </div>

      <!-- Footer -->
      <div class="px-8 pb-8 flex items-center justify-between">
        <!-- Step indicators -->
        <div class="flex gap-2">
          {#each steps as _, i}
            <button
              on:click={() => currentStep = i}
              class="w-2 h-2 rounded-full transition-all {i === currentStep ? 'w-6 bg-white' : 'bg-surface-600 hover:bg-surface-500'}"
              aria-label="Go to step {i + 1}"
            />
          {/each}
        </div>

        <!-- Navigation -->
        <div class="flex gap-3">
          {#if currentStep > 0}
            <Button variant="ghost" on:click={prev}>
              <ChevronLeft class="w-4 h-4 mr-1" />
              Back
            </Button>
          {:else}
            <Button variant="ghost" on:click={skip}>
              Skip tour
            </Button>
          {/if}

          {#if isLast}
            <Button variant="primary" on:click={complete}>
              Get Started
              <Sparkles class="w-4 h-4 ml-1" />
            </Button>
          {:else}
            <Button variant="primary" on:click={next}>
              Next
              <ChevronRight class="w-4 h-4 ml-1" />
            </Button>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
