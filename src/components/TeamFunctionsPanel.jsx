import { AlertTriangle, Info, Sparkles } from 'lucide-react';
import {
  FUNCTIONAL_ROLES,
  FUNCTIONAL_ROLE_KEYS,
  QUALIFICATIONS,
  QUALIFICATION_KEYS,
} from '../utils/teamFunctions';
import AvatarBadge from './AvatarBadge';
import FunctionalRoleBadge from './FunctionalRoleBadge';
import SectionCard from './SectionCard';

const SELECT_CLASS =
  'rounded-2xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-blue-400 disabled:opacity-60';

function FitBars({ row }) {
  return (
    <div className="grid gap-1.5">
      {FUNCTIONAL_ROLE_KEYS.map((roleKey) => {
        const fit = row.fits.find((item) => item.role === roleKey)?.fit ?? 0;
        const highlighted = roleKey === (row.role || row.suggested);

        return (
          <div key={roleKey} className="flex items-center gap-2 text-xs">
            <span
              className={`w-28 shrink-0 ${highlighted ? 'text-blue-200' : 'text-slate-400'}`}
            >
              {FUNCTIONAL_ROLES[roleKey].shortLabel}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full ${highlighted ? 'bg-blue-500' : 'bg-slate-500'}`}
                style={{ width: `${fit * 10}%` }}
              />
            </div>
            <span className="w-8 text-right text-slate-400">{fit}</span>
          </div>
        );
      })}
    </div>
  );
}

function MemberRow({ row, member, functions }) {
  const { canAssign, busyAction, setMemberRole, setMemberQualification, applySuggestion } =
    functions;
  const busy = busyAction === `function:${row.userId}` || busyAction === 'function:all';

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-3">
          <AvatarBadge initials={member.avatarInitials} imageUrl={member.avatarUrl} size="sm" />
          <div>
            <p className="font-medium text-white">{row.name}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {row.role ? (
                <FunctionalRoleBadge role={row.role} qualification={row.qualification} />
              ) : (
                <span className="text-sm text-slate-400">Роль не назначена</span>
              )}
            </div>
          </div>
        </div>

        {canAssign ? (
          <div className="flex flex-wrap gap-2">
            <select
              value={row.role}
              disabled={busy}
              onChange={(event) => setMemberRole(row.userId, event.target.value)}
              aria-label={`Роль в работе: ${row.name}`}
              className={SELECT_CLASS}
            >
              <option value="">— роль не назначена —</option>
              {FUNCTIONAL_ROLE_KEYS.map((roleKey) => (
                <option key={roleKey} value={roleKey}>
                  {FUNCTIONAL_ROLES[roleKey].label}
                </option>
              ))}
            </select>
            <select
              value={row.qualification}
              disabled={busy}
              onChange={(event) => setMemberQualification(row.userId, event.target.value)}
              aria-label={`Уровень: ${row.name}`}
              className={SELECT_CLASS}
            >
              <option value="">— уровень —</option>
              {QUALIFICATION_KEYS.map((levelKey) => (
                <option key={levelKey} value={levelKey}>
                  {QUALIFICATIONS[levelKey].label} — {QUALIFICATIONS[levelKey].description.toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {row.hasProfile ? (
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr]">
          <FitBars row={row} />
          <div className="space-y-3">
            <p className="text-sm leading-6 text-slate-300">
              <span className="text-slate-400">Сильные стороны: </span>
              {row.reason}.
            </p>
            {row.hint ? (
              <div className="flex flex-col gap-2 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2 text-sm leading-6 text-blue-100">
                  <Sparkles className="mt-1 h-4 w-4 shrink-0" />
                  {row.hint}
                </p>
                {canAssign ? (
                  <button
                    type="button"
                    onClick={() => applySuggestion(row)}
                    disabled={busy}
                    className="shrink-0 rounded-xl border border-blue-400/50 px-3 py-1.5 text-xs text-blue-100 transition hover:bg-blue-500/20 disabled:opacity-60"
                  >
                    Применить
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">
          Анкета не пройдена — подсказать роль пока не по чему.
        </p>
      )}
    </div>
  );
}

export default function TeamFunctionsPanel({ functions, members }) {
  const { canAssign, busyAction, warnings, unassignedSuggestions, applyAllSuggestions } =
    functions;
  const membersById = Object.fromEntries(members.map((item) => [item.userId, item]));
  const pendingCount = Object.keys(unassignedSuggestions).length;

  return (
    <div className="space-y-6">
      <SectionCard
        title="Роли в работе"
        subtitle={
          canAssign
            ? 'Вы назначаете роль и уровень каждому. Подсказки — по сильным сторонам из анкеты, решение за вами.'
            : 'Роли в работе и уровни назначают владелец и администраторы.'
        }
        action={
          canAssign && pendingCount > 0 ? (
            <button
              type="button"
              onClick={applyAllSuggestions}
              disabled={busyAction !== ''}
              className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-400 disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              Распределить по подсказкам ({pendingCount})
            </button>
          ) : null
        }
      >
        {warnings.length > 0 ? (
          <div className="mb-4 space-y-2">
            {warnings.map((warning) => {
              const Icon = warning.tone === 'warning' ? AlertTriangle : Info;
              return (
                <p
                  key={warning.text}
                  className={`flex items-start gap-2 rounded-2xl border px-3 py-2.5 text-sm leading-6 ${
                    warning.tone === 'warning'
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-50'
                      : 'border-slate-800 bg-slate-950/40 text-slate-300'
                  }`}
                >
                  <Icon className="mt-1 h-4 w-4 shrink-0" />
                  {warning.text}
                </p>
              );
            })}
          </div>
        ) : null}

        <div className="space-y-3">
          {functions.members.map((row) => (
            <MemberRow
              key={row.userId}
              row={row}
              member={membersById[row.userId]}
              functions={functions}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Как считаются подсказки"
        subtitle="Без нейросети: у каждой роли своя формула из черт характера по анкете (шкала 0–10). У руководителя дополнительно учитывается уровень — Junior −1,5, Senior +1."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {FUNCTIONAL_ROLE_KEYS.map((roleKey) => (
            <div
              key={roleKey}
              className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4"
            >
              <FunctionalRoleBadge role={roleKey} />
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {FUNCTIONAL_ROLES[roleKey].description}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
