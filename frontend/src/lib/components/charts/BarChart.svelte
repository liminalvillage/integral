<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, BarController, BarElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';

  Chart.register(BarController, BarElement, LinearScale, CategoryScale, Tooltip, Legend);

  export let data: { labels: string[]; values: number[]; label?: string };
  export let height: number = 200;
  export let horizontal: boolean = false;
  export let color: string = '#8b5cf6';

  let canvas: HTMLCanvasElement;
  let chart: Chart;

  onMount(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{
          label: data.label || 'Value',
          data: data.values,
          backgroundColor: `${color}80`,
          borderColor: color,
          borderWidth: 1,
          borderRadius: 6,
          hoverBackgroundColor: color
        }]
      },
      options: {
        indexAxis: horizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
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
        },
        scales: {
          x: {
            grid: {
              color: '#2a264020',
              drawBorder: false
            },
            ticks: {
              color: '#6b6b6b'
            }
          },
          y: {
            grid: {
              color: '#2a264040',
              drawBorder: false
            },
            ticks: {
              color: '#6b6b6b'
            }
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

<div style="height: {height}px;">
  <canvas bind:this={canvas}></canvas>
</div>
