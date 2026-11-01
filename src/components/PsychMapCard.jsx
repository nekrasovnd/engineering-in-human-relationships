import { useMemo, useState } from 'react';
import {
  DEFAULT_SIGNAL,
  buildDynamicsAdvice,
  buildPersonDynamics,
  buildReactionSeries,
} from '../utils/psychDynamics';
import PsychScaleBar from './PsychScaleBar';
import ReactionChart from './ReactionChart';
import ReactionSignalControls from './ReactionSignalControls';
import SectionCard from './SectionCard';

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2.5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-medium text-white">{value}</p>
    </div>
  );
}

/** Психокарта профиля: R, F, A и переходный процесс из модели ТАУ. */
export default function PsychMapCard({ profile }) {
  const [signal, setSignal] = useState(DEFAULT_SIGNAL);
  const dynamics = useMemo(() => buildPersonDynamics(profile, signal), [profile, signal]);
  const chartData = useMemo(() => buildReactionSeries([dynamics], signal), [dynamics, signal]);
  const { map, parameters, regime, analysis } = dynamics;

  return (
    <SectionCard
      title="Психокарта: как вы реагируете на нагрузку"
      subtitle="Ригидность, фрустрация и агрессия задают модель человека как звена системы управления. График показывает, как уровень реакции меняется со временем."
    >
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
          {['R', 'F', 'A'].map((scale) => (
            <PsychScaleBar key={scale} scale={scale} score={map[scale]} />
          ))}

          <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="font-medium text-white">{regime.label}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{regime.summary}</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
              {buildDynamicsAdvice(dynamics).map((item) => (
                <li key={item}>— {item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <ReactionSignalControls signal={signal} onChange={setSignal} />
          <ReactionChart data={chartData} signal={signal} />
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <Metric label="Время успокоения" value={`${analysis.settlingTime} усл. с`} />
            <Metric label="Перехлёст" value={`${analysis.overshootPercent}%`} />
            <Metric label="Колебаний" value={analysis.oscillations} />
            <Metric label="Затухание ξ = F/F0" value={parameters.xi.toFixed(2)} />
          </div>
          <details className="rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm leading-6 text-slate-300">
            <summary className="cursor-pointer text-slate-200">Как это посчитано</summary>
            <p className="mt-2 font-mono text-xs leading-6 text-blue-200">
              R·Y″ + (2F√(RA) / (Q·F0))·Y′ + (A/Q²)·Y = X
            </p>
            <p className="mt-2">
              Модель из методички «Человек как динамическое звено системы управления»: F0 = 10,
              Q = 1, постоянная времени T = {parameters.T.toFixed(2)}, усиление k ={' '}
              {parameters.k.toFixed(3)}. Баллы R, F и A — оценка по 8 факторам анкеты, а не
              отдельный тест. Это учебная модель для разговора о рабочем стиле, а не диагноз.
            </p>
          </details>
        </div>
      </div>
    </SectionCard>
  );
}
