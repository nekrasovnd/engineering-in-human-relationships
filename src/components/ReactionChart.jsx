import {
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useTheme } from '../context/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

// Цвет закреплён за человеком по его месту в списке; палитра проверена на фонах сайта.
const SERIES_COLORS = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
};
export const MAX_CHART_SERIES = SERIES_COLORS.dark.length;

export function getSeriesColor(index, isLightTheme) {
  return SERIES_COLORS[isLightTheme ? 'light' : 'dark'][index];
}

// Вертикаль под курсором и отметка конца импульса.
const verticalMarkers = {
  id: 'reactionMarkers',
  afterDatasetsDraw(chart, _args, options) {
    const { ctx, chartArea, scales } = chart;
    const drawLine = (x, color, dash) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.stroke();
      ctx.restore();
    };

    if (options.pulseEnd !== null) {
      const x = scales.x.getPixelForValue(options.pulseEnd);
      drawLine(x, options.color, [4, 4]);
      ctx.save();
      ctx.fillStyle = options.color;
      ctx.font = '11px sans-serif';
      // Внизу: у конца импульса кривая обычно наверху, и подпись её не перекрывает.
      ctx.textBaseline = 'bottom';
      ctx.fillText('событие закончилось', x + 4, chartArea.bottom - 2);
      ctx.restore();
    }

    const [active] = chart.tooltip?.getActiveElements() || [];
    if (active) {
      drawLine(active.element.x, options.color, []);
    }
  },
};

/** Кривые реакции Y(t); несколько людей рисуются на одной оси. */
export default function ReactionChart({ data, signal }) {
  const { isLightTheme } = useTheme();
  const textColor = isLightTheme ? '#475569' : '#94A3B8';
  const gridColor = isLightTheme ? 'rgba(148, 163, 184, 0.25)' : 'rgba(51, 65, 85, 0.5)';

  const chartData = {
    datasets: data.series.map((item, index) => ({
      label: item.name,
      data: item.values.map((value, pointIndex) => ({ x: data.times[pointIndex], y: value })),
      borderColor: getSeriesColor(index, isLightTheme),
      backgroundColor: getSeriesColor(index, isLightTheme),
      borderWidth: 2,
      pointRadius: 0,
      pointHitRadius: 12,
      pointHoverRadius: 4,
      tension: 0,
    })),
  };

  const options = {
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      reactionMarkers: {
        pulseEnd: signal.type === 'pulse' ? signal.duration : null,
        color: textColor,
      },
      tooltip: {
        callbacks: {
          title: ([item]) => `t = ${item.parsed.x.toFixed(1)} усл. с`,
          label: (item) => `${item.dataset.label}: ${item.parsed.y.toFixed(2)} гай`,
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        min: 0,
        max: data.times[data.times.length - 1],
        title: { display: true, text: 'Время, усл. с', color: textColor },
        ticks: { color: textColor, maxTicksLimit: 8 },
        grid: { display: false },
      },
      y: {
        title: { display: true, text: 'Уровень реакции Y, гай', color: textColor },
        ticks: { color: textColor, maxTicksLimit: 6 },
        grid: { color: gridColor },
      },
    },
  };

  return (
    // Canvas вне потока: иначе он держит ширину сетки и график не сжимается вместе с окном.
    <div className="relative h-64 sm:h-72">
      <div className="absolute inset-0">
        <Line data={chartData} options={options} plugins={[verticalMarkers]} />
      </div>
    </div>
  );
}
