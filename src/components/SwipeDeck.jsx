import { useState } from 'react';
import AvatarBadge from './AvatarBadge';
import { formatEgoStateLabel } from '../utils/egoState';

export default function SwipeDeck({
  candidate,
  comparison,
  busy,
  onLike,
  onPass,
}) {
  const [touchStart, setTouchStart] = useState(0);

  const handleTouchStart = (event) => {
    setTouchStart(event.changedTouches[0].clientX);
  };

  const handleTouchEnd = (event) => {
    const touchEnd = event.changedTouches[0].clientX;
    const delta = touchEnd - touchStart;

    if (Math.abs(delta) < 70 || busy) {
      return;
    }

    if (delta > 0) {
      onLike();
    } else {
      onPass();
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="rounded-[32px] border border-slate-800 bg-slate-900/70 p-5 shadow-glow backdrop-blur"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <AvatarBadge initials={candidate.avatarInitials} size="lg" />
          <div>
            <p className="font-display text-2xl text-white">{candidate.name}</p>
            <p className="mt-1 text-sm text-slate-400">{candidate.age} лет</p>
            <p className="mt-1 text-xs text-slate-500">
              {formatEgoStateLabel(candidate.egoState)}
            </p>
          </div>
        </div>
        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-200">
          {comparison.compatibility}%
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Риск трения
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {comparison.conflictRisk}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Общий прогноз
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {comparison.verdict}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Что может зацепить
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            {candidate.factorScores.cooperation >= 7
              ? 'Высокая кооперация'
              : candidate.factorScores.stressResponse >= 7
                ? 'Собранность под давлением'
                : 'Живой отклик на коммуникацию'}
          </p>
        </div>
      </div>

      <p className="mt-5 text-sm leading-7 text-slate-300">
        Свайп вправо или кнопка «Подходит» оставляют человека в фокусе. Влево
        или «Не подходит» убирают карточку дальше по ленте.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onPass}
          disabled={busy}
          className="rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-200 transition hover:border-rose-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Не подходит
        </button>
        <button
          type="button"
          onClick={onLike}
          disabled={busy}
          className="rounded-2xl border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm text-blue-100 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Подходит
        </button>
      </div>
    </div>
  );
}
