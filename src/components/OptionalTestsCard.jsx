import { Link } from 'react-router-dom';
import { OPTIONAL_TESTS, getOptionalTestLevel } from '../data/optionalTests';
import SectionCard from './SectionCard';

function ScoreRow({ factor, score }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-white">{factor.label}</span>
        <span className="shrink-0 text-slate-300">
          {score} из 10 · {getOptionalTestLevel(score)}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-blue-500" style={{ width: `${score * 10}%` }} />
      </div>
      <p className="mt-1.5 text-xs leading-5 text-slate-400">{factor.description}</p>
    </div>
  );
}

/** Необязательные тесты в профиле: результат или приглашение пройти. */
export default function OptionalTestsCard({ profile }) {
  return (
    <SectionCard
      title="Дополнительные тесты"
      subtitle="Необязательны и дополняют анкету. Большая пятёрка уточняет подбор команды, привязанность помогает понять себя в близких отношениях."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {Object.values(OPTIONAL_TESTS).map((test) => {
          const scores = profile[test.key]?.scores;

          return (
            <div key={test.key} className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium text-white">{test.title}</p>
                <Link
                  to={`/tests/${test.key}`}
                  className={
                    scores
                      ? 'text-sm text-blue-300 hover:text-blue-200'
                      : 'rounded-2xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400'
                  }
                >
                  {scores ? 'Пройти заново' : 'Пройти'}
                </Link>
              </div>
              {scores ? (
                <div className="mt-4 space-y-3">
                  {Object.entries(test.factors).map(([key, factor]) => (
                    <ScoreRow key={key} factor={factor} score={scores[key]} />
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-slate-400">{test.summary}</p>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
