import { Check, Minus } from 'lucide-react';
import { GOAL_OPTIONS } from '../hooks/useTeamsWorkspace';
import {
  TEAM_PERMISSION_LABELS,
  TEAM_ROLE_KEYS,
  TEAM_ROLES,
  hasTeamPermission,
} from '../utils/teamRoles';
import SectionCard from './SectionCard';

function TeamInfoForm({ workspace }) {
  const { infoForm, infoDirty, busyAction, updateInfoField, saveInfo } = workspace;
  // Старые команды могли сохранить цель вне текущего списка — не теряем её.
  const goalOptions = GOAL_OPTIONS.includes(infoForm.goal) || !infoForm.goal
    ? GOAL_OPTIONS
    : [infoForm.goal, ...GOAL_OPTIONS];

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        saveInfo();
      }}
    >
      <label className="block">
        <span className="mb-2 block text-sm text-slate-300">Название команды</span>
        <input
          type="text"
          value={infoForm.name}
          onChange={(event) => updateInfoField('name', event.target.value)}
          className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-blue-400"
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm text-slate-300">Описание</span>
        <textarea
          value={infoForm.description}
          onChange={(event) => updateInfoField('description', event.target.value)}
          rows="4"
          className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-blue-400"
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm text-slate-300">Цель команды</span>
        <select
          value={infoForm.goal}
          onChange={(event) => updateInfoField('goal', event.target.value)}
          className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-blue-400"
        >
          {goalOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={!infoDirty || busyAction === 'info'}
        className="rounded-2xl bg-blue-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busyAction === 'info' ? 'Сохраняем...' : 'Сохранить изменения'}
      </button>
    </form>
  );
}

function PermissionMatrix({ myRole }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-[0.16em] text-slate-400">
            <th className="py-2 pr-3 font-normal">Действие</th>
            {TEAM_ROLE_KEYS.map((roleKey) => (
              <th
                key={roleKey}
                className={`px-2 py-2 text-center font-normal ${
                  roleKey === myRole ? 'text-blue-300' : ''
                }`}
              >
                {TEAM_ROLES[roleKey].label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TEAM_PERMISSION_LABELS.map(({ action, label }) => (
            <tr key={action} className="border-t border-slate-800">
              <td className="py-2 pr-3 text-slate-300">{label}</td>
              {TEAM_ROLE_KEYS.map((roleKey) => (
                <td key={roleKey} className="px-2 py-2 text-center">
                  {hasTeamPermission(roleKey, action) ? (
                    <Check className="mx-auto h-4 w-4 text-emerald-300" />
                  ) : (
                    <Minus className="mx-auto h-4 w-4 text-slate-500" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TeamSettingsPanel({ workspace, onLeft }) {
  const { team, myRole, can, busyAction, leave, removeTeam } = workspace;
  const ownerAlone = myRole === 'owner' && team.memberIds.length === 1;

  return (
    <div className="space-y-6">
      {can.editInfo ? (
        <SectionCard
          title="Данные команды"
          subtitle="Название, описание и цель видят все участники и приглашённые."
        >
          <TeamInfoForm workspace={workspace} />
        </SectionCard>
      ) : null}

      <SectionCard
        title="Роли и права"
        subtitle="Что может каждая роль в команде. Ваша роль подсвечена."
      >
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          {TEAM_ROLE_KEYS.map((roleKey) => (
            <div
              key={roleKey}
              className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
            >
              <p className="text-sm font-medium text-white">
                {TEAM_ROLES[roleKey].label}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                {TEAM_ROLES[roleKey].description}
              </p>
            </div>
          ))}
        </div>
        <PermissionMatrix myRole={myRole} />
      </SectionCard>

      <SectionCard
        title="Опасная зона"
        subtitle={
          myRole === 'owner'
            ? 'Владелец не может просто выйти: сначала передайте владение на вкладке «Участники» или удалите команду.'
            : 'После выхода вернуться можно только по новому приглашению.'
        }
      >
        <div className="flex flex-wrap gap-3">
          {can.leave ? (
            <button
              type="button"
              onClick={async () => {
                if (await leave()) {
                  onLeft();
                }
              }}
              disabled={busyAction === 'leave'}
              className="rounded-2xl border border-rose-500/40 px-4 py-3 text-sm text-rose-200 transition hover:bg-rose-500/10 disabled:opacity-60"
            >
              {busyAction === 'leave' ? 'Выходим...' : 'Выйти из команды'}
            </button>
          ) : null}
          {can.deleteTeam ? (
            <button
              type="button"
              onClick={async () => {
                if (await removeTeam()) {
                  onLeft();
                }
              }}
              disabled={busyAction === 'delete'}
              className="rounded-2xl bg-rose-500/90 px-4 py-3 text-sm font-medium text-white transition hover:bg-rose-500 disabled:opacity-60"
            >
              {busyAction === 'delete'
                ? 'Удаляем...'
                : ownerAlone
                  ? 'Удалить команду'
                  : 'Удалить команду для всех'}
            </button>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
