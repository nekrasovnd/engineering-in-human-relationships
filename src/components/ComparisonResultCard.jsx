import { useMemo, useState } from 'react';
import { getConflictResolutionHints } from '../utils/trizKnowledge';
import { formatEgoStateLabel } from '../utils/egoState';
import AvatarBadge from './AvatarBadge';
import SectionCard from './SectionCard';

function riskToneClass(value) {
  if (value === 'Высокий') {
    return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
  }

  if (value === 'Средний') {
    return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
  }

  return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
}

function fitToneClass(value) {
  if (value === 'Нет') {
    return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
  }

  if (value === 'Условно') {
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
      title="Как вы стыкуетесь"
      subtitle="Это не ярлык на пару, а карта того, где вам будет легко, а где лучше заранее договориться о ритме, роли и давлении."
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <AvatarBadge initials={firstProfile.avatarInitials} size="sm" />
              <div>
                <p className="font-medium text-white">{firstProfile.name}</p>
                <p className="text-sm text-slate-400">
                  {formatEgoStateLabel(firstProfile.egoState)}
                </p>
              </div>
            </div>

            <div className="text-slate-500">×</div>

            <div className="flex items-center gap-3">
              <AvatarBadge initials={secondProfile.avatarInitials} size="sm" />
              <div>
                <p className="font-medium text-white">{secondProfile.name}</p>
                <p className="text-sm text-slate-400">
                  {formatEgoStateLabel(secondProfile.egoState)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-sm leading-7 text-slate-200">{comparison.pairSummary}</p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-blue-300">
                Общая стыковка
              </p>
              <p className="mt-2 font-display text-4xl text-white">
                {comparison.compatibility}%
              </p>
            </div>

            <div
              className={`rounded-2xl border p-4 ${riskToneClass(comparison.conflictRisk)}`}
            >
              <p className="text-xs uppercase tracking-[0.24em]">
                Вероятность трения
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {comparison.conflictRisk}
              </p>
            </div>

            <div
              className={`rounded-2xl border p-4 ${fitToneClass(comparison.verdict)}`}
            >
              <p className="text-xs uppercase tracking-[0.24em]">
                Командный режим
              </p>
              <p className="mt-2 text-lg font-semibold">
                {comparison.teamFitLabel}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-200">
                Где будет легче
              </p>
              <p className="mt-2 text-sm leading-6 text-emerald-50">
                {comparison.supportPoint}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-amber-200">
                Где заранее договориться
              </p>
              <p className="mt-2 text-sm leading-6 text-amber-50">
                {comparison.frictionPoint}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Контур связи
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {Math.round(comparison.resonanceScore)}%
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Насколько легко вам держать общий ритм общения, обратной связи и ожиданий друг от друга.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Резерв пары
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {Math.round(comparison.pairReserveScore)}%
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Запас устойчивости к давлению, неопределённости и накоплению напряжения.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Надёжность профилей
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {Math.round(comparison.reliabilityScore)}%
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Насколько согласованно заполнены сами шкалы. Это помогает не переоценивать один голый процент.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Как этим пользоваться
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              {comparison.explanation}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5">
          <p className="font-display text-lg text-white">Подсказки</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Если между вами может появляться напряжение, здесь собраны идеи, как сделать взаимодействие мягче и управляемее.
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
