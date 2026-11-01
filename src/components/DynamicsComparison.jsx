import { AlertTriangle, Info } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { hasComparableProfileData } from '../utils/compatibility';
import {
  DEFAULT_SIGNAL,
  buildGroupDynamicsNotes,
  buildPersonDynamics,
  buildReactionSeries,
} from '../utils/psychDynamics';
import ReactionChart, { MAX_CHART_SERIES, getSeriesColor } from './ReactionChart';
import ReactionSignalControls from './ReactionSignalControls';
import SectionCard from './SectionCard';

/** Реакции нескольких людей на одно воздействие: график, таблица и замечания. */
export default function DynamicsComparison({ title, subtitle, people }) {
  const { isLightTheme } = useTheme();
  const [signal, setSignal] = useState(DEFAULT_SIGNAL);
  const rows = useMemo(
    () =>
      people
        .filter(hasComparableProfileData)
        .map((person) => buildPersonDynamics(person, signal)),
    [people, signal],
  );
  const charted = useMemo(() => rows.slice(0, MAX_CHART_SERIES), [rows]);
  const chartData = useMemo(
    () => (charted.length > 0 ? buildReactionSeries(charted, signal) : null),
    [charted, signal],
  );
  const notes = buildGroupDynamicsNotes(rows);

  return (
    <SectionCard title={title} subtitle={subtitle}>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">Нет пройденных анкет — считать пока не по чему.</p>
      ) : (
        <div className="space-y-5">
          <ReactionSignalControls signal={signal} onChange={setSignal} />
          <ReactionChart data={chartData} signal={signal} />

          {charted.length > 1 ? (
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-300">
              {charted.map((row, index) => (
                <span key={row.userId} className="inline-flex items-center gap-2">
                  <span
                    className="h-0.5 w-4 rounded-full"
                    style={{ backgroundColor: getSeriesColor(index, isLightTheme) }}
                  />
                  {row.name}
                </span>
              ))}
            </div>
          ) : null}
          {rows.length > MAX_CHART_SERIES ? (
            <p className="text-xs text-slate-400">
              На графике первые {MAX_CHART_SERIES} человек, в таблице — все.
            </p>
          ) : null}

          {notes.length > 0 ? (
            <div className="space-y-2">
              {notes.map((note) => {
                const Icon = note.tone === 'warning' ? AlertTriangle : Info;
                return (
                  <p
                    key={note.text}
                    className={`flex items-start gap-2 rounded-2xl border px-3 py-2.5 text-sm leading-6 ${
                      note.tone === 'warning'
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-50'
                        : 'border-slate-800 bg-slate-950/40 text-slate-300'
                    }`}
                  >
                    <Icon className="mt-1 h-4 w-4 shrink-0" />
                    {note.text}
                  </p>
                );
              })}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs text-slate-400">
                <tr>
                  <th className="py-2 pr-3 font-normal">Человек</th>
                  <th className="py-2 pr-3 font-normal">R</th>
                  <th className="py-2 pr-3 font-normal">F</th>
                  <th className="py-2 pr-3 font-normal">A</th>
                  <th className="py-2 pr-3 font-normal">Реакция</th>
                  <th className="py-2 pr-3 font-normal">Успокоение, усл. с</th>
                  <th className="py-2 font-normal">Перехлёст</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                {rows.map((row) => (
                  <tr key={row.userId} className="border-t border-slate-800">
                    <td className="py-2 pr-3 text-white">{row.name}</td>
                    <td className="py-2 pr-3">{row.map.R}</td>
                    <td className="py-2 pr-3">{row.map.F}</td>
                    <td className="py-2 pr-3">{row.map.A}</td>
                    <td className="py-2 pr-3">{row.regime.label.replace(' реакция', '')}</td>
                    <td className="py-2 pr-3">{row.analysis.settlingTime}</td>
                    <td className="py-2">{row.analysis.overshootPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs leading-5 text-slate-400">
            Учебная модель из ТАУ: баллы оценены по анкете, а не отдельным тестом. Это повод для
            разговора о рабочем стиле, а не диагноз и не характеристика человека.
          </p>
        </div>
      )}
    </SectionCard>
  );
}
