<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';

  Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

  export let data: { labels: string[]; values: number[]; colors?: string[] };
  export let size: number = 200;
  export let cutout: string = '70%';
  export let showLegend: boolean = true;

  let canvas: HTMLCanvasElement;
  let chart: Chart;

  const defaultColors = [
    '#8b5cf6', // primary purple
    '#10b981', // emerald
    '#f59e0b', // amber
    '#3b82f6', // blue
    '#ec4899', // pink
    '#6366f1', // indigo
    '#14b8a6', // teal
    '#f97316'  // orange
  ];

  onMount(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          backgroundColor: data.colors || defaultColors.slice(0, data.values.length),
          borderColor: '#1e1b2e',
          borderWidth: 3,
          hoverBorderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout,
        plugins: {
          legend: {
            display: showLegend,
            position: 'bottom',
            labels: {
              color: '#a0a0a0',
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: '#2a2640',
            titleColor: '#fff',
            bodyColor: '#a0a0a0',
            borderColor: '#3d3860',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12
          }
        }
      }
    });
  });

  onDestroy(() => {
    chart?.destroy();
  });

  $: if (chart && data) {
    chart.data.labels = data.labels;
    chart.data.datasets[0].data = data.values;
    chart.update();
  }
</script>

<div style="width: {size}px; height: {size}px; margin: 0 auto;">
  <canvas bind:this={canvas}></canvas>
</div>
