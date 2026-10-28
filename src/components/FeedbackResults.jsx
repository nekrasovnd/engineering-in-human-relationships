import { AlertTriangle } from 'lucide-react';
import {
  FRICTION_ALERT_THRESHOLD,
  PEER_CRITERIA,
  PULSE_QUESTIONS,
} from '../utils/teamFeedback';
import FrictionTimelineChart from './FrictionTimelineChart';
import SectionCard from './SectionCard';

const PULSE_SHORT_LABELS = {
  tension: 'Напряжение',
  workload: 'Нагрузка',
  clarity: 'Ясность задач',
  support: 'Поддержка',
  mood: 'Состояние',
};

function PulseResults({ results, teamSize }) {
  const { timeline, thisWeekResponses, frictionMentions } = results;
  const lastWeek = timeline.at(-1);
  const alert = lastWeek && lastWeek.frictionIndex > FRICTION_ALERT_THRESHOLD;

  return (
    <SectionCard
      title="Уровень сигнала: трение в команде"
      subtitle="Индекс трения 0–10 по еженедельному опросу. Это обратная связь контура управления: плановое «ТО» команды раз в неделю, а не ремонт после поломки."
    >
      {timeline.length === 0 ? (
        <p className="text-sm text-slate-400">Пока нет ни одного ответа на опрос недели.</p>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
          <div>
            <FrictionTimelineChart timeline={timeline} />
            <p className="mt-2 text-xs text-slate-500">
              Пунктир — порог {FRICTION_ALERT_THRESHOLD}. На этой неделе ответили{' '}
              {thisWeekResponses} из {teamSize}.
            </p>
          </div>

          <div className="space-y-4">
            {alert ? (
              <div className="flex gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm leading-6 text-rose-200">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                Трение выше порога. Обслуживание «по состоянию»: проведите короткие
                разговоры 1:1 и проверьте нагрузку и ясность задач, не дожидаясь срыва.
              </div>
            ) : null}

            {lastWeek ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Последняя неделя · среднее 1–5
                </p>
                <div className="mt-3 space-y-2">
                  {PULSE_QUESTIONS.map((question) => (
                    <div key={question.key} className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{PULSE_SHORT_LABELS[question.key]}</span>
                      <span className="font-medium text-white">
                        {lastWeek.averages[question.key]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                С кем чаще «сложно» · 4 недели
              </p>
              {frictionMentions.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">Никого не отмечали.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {frictionMentions.slice(0, 5).map((item) => (
                    <div key={item.userId} className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{item.name}</span>
                      <span className="text-amber-200">{item.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function PeerResults({ feedback }) {
  const { closedIterations, selectedResultsIterationId, setResultsIterationId, results } =
    feedback;
  const { peerSummary, peerReviewers, forecastVsFact } = results;

  return (
    <SectionCard
      title="Оценка коллег по итерациям"
      subtitle="Средние оценки, которые участники поставили друг другу после закрытия итерации (1–5)."
      action={
        closedIterations.length > 0 ? (
          <select
            value={selectedResultsIterationId}
            onChange={(event) => setResultsIterationId(event.target.value)}
            aria-label="Итерация"
            className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-400"
          >
            {closedIterations.map((iteration) => (
              <option key={iteration.id} value={iteration.id}>
                {iteration.title}
              </option>
            ))}
          </select>
        ) : null
      }
    >
      {closedIterations.length === 0 ? (
        <p className="text-sm text-slate-400">
          Закройте итерацию — после этого участники смогут оценить друг друга.
        </p>
      ) : peerSummary.length === 0 ? (
        <p className="text-sm text-slate-400">По этой итерации оценок пока нет.</p>
      ) : (
        <>
          <p className="mb-3 text-xs text-slate-500">Оценили коллег: {peerReviewers}</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-[0.14em] text-slate-400">
                  <th className="py-2 pr-3 font-normal">Участник</th>
                  <th className="px-2 py-2 text-center font-normal">Итог</th>
                  {PEER_CRITERIA.map((criterion) => (
                    <th key={criterion.key} className="px-2 py-2 text-center font-normal">
                      {criterion.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {peerSummary.map((row) => (
                  <tr key={row.userId} className="border-t border-slate-800">
                    <td className="py-2 pr-3 text-white">
                      {row.name}
                      <span className="ml-2 text-xs text-slate-500">· {row.reviewers}</span>
                    </td>
                    <td className="px-2 py-2 text-center font-medium text-blue-300">
                      {row.overall}
                    </td>
                    {PEER_CRITERIA.map((criterion) => (
                      <td key={criterion.key} className="px-2 py-2 text-center text-slate-300">
                        {row.criteria[criterion.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {forecastVsFact.length > 0 ? (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Прогноз против факта · все итерации
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Совместимость пары по профилям против того, как они реально оценили друг
            друга. Большой разрыв — повод присмотреться к паре.
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {forecastVsFact.map((pair) => (
              <div
                key={pair.pairKey}
                className="rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm"
              >
                <p className="text-white">
                  {pair.leftName} × {pair.rightName}
                </p>
                <p className="mt-1 text-slate-400">
                  Прогноз {pair.forecast}% · факт {pair.fact}% ·{' '}
                  <span className={pair.gap < -15 ? 'text-rose-200' : pair.gap > 15 ? 'text-emerald-200' : 'text-slate-300'}>
                    {pair.gap > 0 ? '+' : ''}
                    {pair.gap}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </SectionCard>
  );
}

export default function FeedbackResults({ feedback, teamSize }) {
  if (!feedback.results) {
    return null;
  }

  return (
    <>
      <PulseResults results={feedback.results} teamSize={teamSize} />
      <PeerResults feedback={feedback} />
    </>
  );
}
