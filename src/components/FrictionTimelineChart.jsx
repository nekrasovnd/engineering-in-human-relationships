import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useTheme } from '../context/ThemeContext';
import { FRICTION_ALERT_THRESHOLD, formatWeekLabel } from '../utils/teamFeedback';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

/** Индекс трения по неделям и порог, выше которого нужен разговор 1:1. */
export default function FrictionTimelineChart({ timeline }) {
  const { isLightTheme } = useTheme();
  const textColor = isLightTheme ? '#475569' : '#94A3B8';
  const gridColor = isLightTheme ? 'rgba(148, 163, 184, 0.25)' : 'rgba(51, 65, 85, 0.5)';
  const labels = timeline.map((item) => formatWeekLabel(item.weekKey));

  const data = {
    labels,
    datasets: [
      {
        label: 'Индекс трения',
        data: timeline.map((item) => item.frictionIndex),
        borderColor: '#60A5FA',
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        fill: true,
        cubicInterpolationMode: 'monotone',
        pointRadius: 4,
        pointBackgroundColor: timeline.map((item) =>
          item.frictionIndex > FRICTION_ALERT_THRESHOLD ? '#F43F5E' : '#3B82F6',
        ),
      },
      {
        label: 'Порог',
        data: timeline.map(() => FRICTION_ALERT_THRESHOLD),
        borderColor: 'rgba(244, 63, 94, 0.6)',
        borderDash: [6, 6],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          afterLabel: (context) =>
            context.datasetIndex === 0
              ? `Ответов: ${timeline[context.dataIndex].responses}`
              : '',
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 10,
        ticks: { color: textColor, stepSize: 2 },
        grid: { color: gridColor },
      },
      x: {
        ticks: { color: textColor },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="h-56">
      <Line data={data} options={options} />
    </div>
  );
}
