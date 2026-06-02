import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { FACTOR_CONFIG } from '../data/questionnaire';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

export default function RadarProfileChart({ scores, compact = false }) {
  const data = {
    labels: FACTOR_CONFIG.map((factor) => factor.shortLabel),
    datasets: [
      {
        label: 'Психологическая карта',
        data: FACTOR_CONFIG.map((factor) => scores?.[factor.key] ?? 0),
        backgroundColor: 'rgba(59, 130, 246, 0.25)',
        borderColor: 'rgba(96, 165, 250, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(14, 165, 233, 1)',
        pointBorderColor: 'rgba(255,255,255,0.85)',
        pointRadius: compact ? 2 : 4,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: !compact,
        labels: {
          color: '#E2E8F0',
        },
      },
      tooltip: {
        backgroundColor: '#0F172A',
        borderColor: '#334155',
        borderWidth: 1,
      },
    },
    scales: {
      r: {
        suggestedMin: 0,
        suggestedMax: 10,
        grid: {
          color: 'rgba(148, 163, 184, 0.18)',
        },
        angleLines: {
          color: 'rgba(148, 163, 184, 0.16)',
        },
        pointLabels: {
          color: '#CBD5E1',
          font: {
            size: compact ? 9 : 12,
          },
        },
        ticks: {
          color: '#64748B',
          backdropColor: 'transparent',
          stepSize: 2,
          display: !compact,
        },
      },
    },
  };

  return (
    <div className={compact ? 'h-44 w-full' : 'h-[360px] w-full'}>
      <Radar data={data} options={options} />
    </div>
  );
}
