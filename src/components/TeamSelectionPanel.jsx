import { Users } from 'lucide-react';
import { GROUP_SIZE_OPTIONS, MAX_SELECTION_CANDIDATES, getGroupVerdict } from '../utils/teamSelection';
import { getFunctionalRoleLabel } from '../utils/teamFunctions';
import FunctionalRoleBadge from './FunctionalRoleBadge';
import SectionCard from './SectionCard';

const VERDICT_STYLES = {
  good: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
  ok: 'border-blue-400/40 bg-blue-500/10 text-blue-200',
  risk: 'border-amber-400/40 bg-amber-500/10 text-amber-200',
};

const SOURCE_LABELS = { friend: 'друг', match: 'совпадение' };

function GroupCard({ group, rank, currentUserId, onUse }) {
  const verdict = getGroupVerdict(group.score);
  const { weakestPair } = group;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-display text-2xl text-slate-500">#{rank}</span>
          <span className={`rounded-full border px-3 py-1 text-xs ${VERDICT_STYLES[verdict.tone]}`}>
            {verdict.label} · {group.score}/100
          </span>
        </div>
        <button
          type="button"
          onClick={() => onUse(group)}
          className="rounded-2xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400"
        >
          Собрать эту команду
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {group.members.map((member) => (
          <div
            key={member.userId}
            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2"
          >
            <span className="text-sm text-white">
              {member.name}
              {member.userId === currentUserId ? ' (вы)' : ''}
            </span>
            <FunctionalRoleBadge role={group.roles[member.userId]} />
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-1 text-sm leading-6 text-slate-300">
        <p>Средняя совместимость пар: {group.averageCompatibility}%</p>
        {weakestPair ? (
          <p className="text-slate-400">
            Слабое звено: {weakestPair.left.name} × {weakestPair.right.name} —{' '}
            {weakestPair.compatibility}%
          </p>
        ) : null}
        {group.members.length >= 4 && group.missingRoles.length > 0 ? (
          <p className="text-slate-400">
            Не закрыто: {group.missingRoles.map(getFunctionalRoleLabel).join(', ')}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function TeamSelectionPanel({ selection, currentUserId, loading, onUseGroup }) {
  const {
    candidates,
    selectedIds,
    size,
    includeMe,
    canIncludeMe,
    neededCount,
    groups,
    setSize,
    setIncludeMe,
    toggleCandidate,
    selectAll,
    clearSelection,
  } = selection;
  const missingCount = Math.max(0, neededCount - selectedIds.length);

  return (
    <SectionCard
      title="Подбор команды"
      subtitle="Отметьте людей, которых видите в команде, — система переберёт составы и покажет, кто лучше всего совпадает: совместимость пар, слабое звено и роли в работе."
    >
      {loading ? (
        <p className="text-sm text-slate-400">Собираем друзей и совпадения...</p>
      ) : candidates.length === 0 ? (
        <p className="text-sm leading-6 text-slate-400">
          Подбирать пока не из кого. Добавьте друзей по коду ниже или найдите взаимные
          совпадения в знакомствах.
        </p>
      ) : (
        <div className="space-y-5">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Кандидаты · выбрано {selectedIds.length} из {candidates.length}
              </p>
              <div className="flex gap-3 text-xs">
                <button type="button" onClick={selectAll} className="text-blue-300 hover:text-blue-200">
                  Выбрать всех
                </button>
                {selectedIds.length > 0 ? (
                  <button type="button" onClick={clearSelection} className="text-slate-400 hover:text-white">
                    Сбросить
                  </button>
                ) : null}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {candidates.map((candidate) => {
                const checked = selectedIds.includes(candidate.userId);
                return (
                  <button
                    key={candidate.userId}
                    type="button"
                    onClick={() => toggleCandidate(candidate.userId)}
                    aria-pressed={checked}
                    className={`rounded-2xl border px-3 py-2 text-left text-sm transition ${
                      checked
                        ? 'border-blue-400 bg-blue-500/10 text-white'
                        : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {candidate.name}
                    <span className="ml-2 text-xs text-slate-400">
                      {candidate.sources.map((source) => SOURCE_LABELS[source]).join(', ')}
                    </span>
                  </button>
                );
              })}
            </div>
            {candidates.length > MAX_SELECTION_CANDIDATES ? (
              <p className="mt-2 text-xs text-slate-500">
                Можно отметить до {MAX_SELECTION_CANDIDATES} человек за раз.
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-300">Размер команды</span>
              <div className="flex gap-1 rounded-2xl border border-slate-800 bg-slate-950/40 p-1">
                {GROUP_SIZE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSize(option)}
                    aria-pressed={size === option}
                    className={`h-8 w-8 rounded-xl text-sm transition ${
                      size === option ? 'bg-blue-500/15 text-blue-300' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            {canIncludeMe ? (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={includeMe}
                  onChange={(event) => setIncludeMe(event.target.checked)}
                  className="h-4 w-4 accent-blue-500"
                />
                Я тоже в составе
              </label>
            ) : null}
          </div>

          {missingCount > 0 ? (
            <p className="flex items-center gap-2 text-sm text-slate-400">
              <Users className="h-4 w-4" />
              Отметьте ещё {missingCount}, чтобы собрать команду из {size}.
            </p>
          ) : (
            <div className="space-y-3">
              {groups.map((group, index) => (
                <GroupCard
                  key={group.members.map((member) => member.userId).join('-')}
                  group={group}
                  rank={index + 1}
                  currentUserId={currentUserId}
                  onUse={onUseGroup}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}
