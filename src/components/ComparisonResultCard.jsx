import { useMemo, useState } from 'react';
import { getConflictResolutionHints } from '../utils/trizKnowledge';
import AvatarBadge from './AvatarBadge';
import SectionCard from './SectionCard';

function toneClass(value) {
  if (value === 'Высокий' || value === 'Нет') {
    return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
  }
  if (value === 'Средний' || value === 'Условно') {
    return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
  }
  return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
}

export default function ComparisonResultCard({
  firstProfile,
  secondProfile,
  comparison,
}) {
  const [showHints, setShowHints] = useState(false);
  const hints = useMemo(
    () => getConflictResolutionHints(firstProfile, secondProfile, comparison),
    [comparison, firstProfile, secondProfile],
  );

  return (
    <SectionCard
      title="Карточка совместимости"
      subtitle="Коэффициент считается по весовому евклидову расстоянию: нейротизм и доминантность имеют двойной вес."
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <AvatarBadge initials={firstProfile.avatarInitials} size="sm" />
              <div>
                <p className="font-medium text-white">{firstProfile.name}</p>
                <p className="text-sm text-slate-400">{firstProfile.egoState}</p>
              </div>
            </div>

            <div className="text-slate-500">×</div>

            <div className="flex items-center gap-3">
              <AvatarBadge initials={secondProfile.avatarInitials} size="sm" />
              <div>
                <p className="font-medium text-white">{secondProfile.name}</p>
                <p className="text-sm text-slate-400">{secondProfile.egoState}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-blue-300">
                Совместимость
              </p>
              <p className="mt-2 font-display text-4xl text-white">
                {comparison.compatibility}%
              </p>
            </div>

            <div
              className={`rounded-2xl border p-4 ${toneClass(comparison.conflictRisk)}`}
            >
              <p className="text-xs uppercase tracking-[0.24em]">Прогноз конфликта</p>
              <p className="mt-2 text-2xl font-semibold">{comparison.conflictRisk}</p>
            </div>

            <div className={`rounded-2xl border p-4 ${toneClass(comparison.verdict)}`}>
              <p className="text-xs uppercase tracking-[0.24em]">
                Вместе в одной команде?
              </p>
              <p className="mt-2 text-2xl font-semibold">{comparison.verdict}</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Рекомендация по управлению
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              {comparison.explanation}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5">
          <p className="font-display text-lg text-white">Подсказка от ТРИЗ</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Принципы подбираются локально по типу противоречия между профилями.
          </p>

          <button
            type="button"
            onClick={() => setShowHints((value) => !value)}
            className="mt-4 rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm text-blue-200 transition hover:bg-blue-500/20"
          >
            {showHints ? 'Скрыть подсказки' : 'Показать подсказки'}
          </button>

          {showHints ? (
            <div className="mt-4 space-y-3">
              {hints.map((hint) => (
                <div
                  key={hint.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
                >
                  <p className="text-sm font-semibold text-white">
                    Принцип {hint.id}. {hint.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {hint.summary}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-blue-200">
                    {hint.reason}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </SectionCard>
  );
}
