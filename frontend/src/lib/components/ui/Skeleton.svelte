<script lang="ts">
  export let width: string = '100%';
  export let height: string = '1rem';
  export let rounded: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
  export let className: string = '';

  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };
</script>

<div
  class="animate-pulse bg-gradient-to-r from-surface-700 via-surface-600 to-surface-700 bg-[length:200%_100%] {roundedClasses[rounded]} {className}"
  style="width: {width}; height: {height};"
  role="status"
  aria-label="Loading..."
/>
