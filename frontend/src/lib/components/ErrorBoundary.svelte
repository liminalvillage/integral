<script lang="ts">
  import { onMount } from 'svelte';
  import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-svelte';
  import Button from './ui/Button.svelte';

  export let error: Error | null = null;

  let errorInfo: string = '';
  let showDetails = false;

  onMount(() => {
    // Capture unhandled errors
    const handleError = (event: ErrorEvent) => {
      error = event.error;
      errorInfo = event.message;
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      errorInfo = 'Unhandled Promise Rejection';
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  });

  function retry() {
    error = null;
    window.location.reload();
  }

  function goHome() {
    error = null;
    window.location.href = '/';
  }

  function toggleDetails() {
    showDetails = !showDetails;
  }
</script>

{#if error}
  <div class="min-h-screen bg-surface-900 flex items-center justify-center p-4">
    <div class="max-w-md w-full text-center">
      <!-- Error Icon -->
      <div class="mb-6 inline-flex p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
        <AlertTriangle class="w-12 h-12 text-red-400" />
      </div>

      <!-- Error Message -->
      <h1 class="text-2xl font-bold text-white mb-2">Something went wrong</h1>
      <p class="text-gray-400 mb-6">
        An unexpected error occurred. This has been logged and we'll look into it.
      </p>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row gap-3 justify-center mb-6">
        <Button variant="primary" on:click={retry}>
          <RefreshCw class="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <Button variant="secondary" on:click={goHome}>
          <Home class="w-4 h-4 mr-2" />
          Go Home
        </Button>
      </div>

      <!-- Error Details Toggle -->
      <button
        on:click={toggleDetails}
        class="text-sm text-gray-500 hover:text-gray-400 transition-colors flex items-center gap-2 mx-auto"
      >
        <Bug class="w-4 h-4" />
        {showDetails ? 'Hide' : 'Show'} technical details
      </button>

      <!-- Error Details -->
      {#if showDetails}
        <div class="mt-4 p-4 rounded-xl bg-surface-800 border border-surface-700 text-left">
          <p class="text-xs text-red-400 font-mono mb-2">{error.name}: {error.message}</p>
          {#if errorInfo}
            <p class="text-xs text-gray-500 mb-2">{errorInfo}</p>
          {/if}
          {#if error.stack}
            <pre class="text-xs text-gray-500 overflow-auto max-h-40 whitespace-pre-wrap">{error.stack}</pre>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{:else}
  <slot />
{/if}
