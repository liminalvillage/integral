<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler } from 'chart.js';

  Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

  export let data: { labels: string[]; values: number[]; label?: string };
  export let height: number = 200;
  export let gradient: boolean = true;
  export let color: string = '#8b5cf6';

  let canvas: HTMLCanvasElement;
  let chart: Chart;

  onMount(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let gradientFill: CanvasGradient | string = 'transparent';
    if (gradient) {
      gradientFill = ctx.createLinearGradient(0, 0, 0, height);
      gradientFill.addColorStop(0, `${color}40`);
      gradientFill.addColorStop(1, `${color}00`);
    }

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: data.label || 'Value',
          data: data.values,
          borderColor: color,
          backgroundColor: gradientFill,
          borderWidth: 2,
          fill: gradient,
          tension: 0.4,
          pointBackgroundColor: color,
          pointBorderColor: '#1e1b2e',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
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
        },
        interaction: {
          intersect: false,
          mode: 'index'
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
