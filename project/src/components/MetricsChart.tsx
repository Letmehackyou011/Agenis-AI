import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Metric } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MetricsChartProps {
  metrics: Metric[];
  type: 'cpu' | 'memory' | 'network';
}

export function MetricsChart({ metrics, type }: MetricsChartProps) {
  const sortedMetrics = [...metrics].reverse();

  const getValue = (metric: Metric) => {
    switch (type) {
      case 'cpu':
        return metric.cpu_usage;
      case 'memory':
        return metric.memory_usage;
      case 'network':
        return metric.network_usage;
    }
  };

  const labels = sortedMetrics.map((m) =>
    new Date(m.timestamp).toLocaleTimeString()
  );

  const data = {
    labels,
    datasets: [
      {
        label: type === 'network' ? 'Network (MB/s)' : `${type.toUpperCase()} (%)`,
        data: sortedMetrics.map(getValue),
        borderColor: type === 'cpu' ? 'rgb(59, 130, 246)' : type === 'memory' ? 'rgb(16, 185, 129)' : 'rgb(139, 92, 246)',
        backgroundColor: type === 'cpu' ? 'rgba(59, 130, 246, 0.1)' : type === 'memory' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: sortedMetrics.map(m => m.is_anomaly ? 'rgb(239, 68, 68)' : 'rgba(0, 0, 0, 0)'),
        pointBorderColor: sortedMetrics.map(m => m.is_anomaly ? 'rgb(239, 68, 68)' : 'rgba(0, 0, 0, 0)'),
        pointRadius: sortedMetrics.map(m => m.is_anomaly ? 6 : 3),
        pointHoverRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: type === 'network' ? 1000 : 100,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          maxTicksLimit: 8,
        },
      },
    },
  };

  return (
    <div className="h-full">
      <Line data={data} options={options} />
    </div>
  );
}
