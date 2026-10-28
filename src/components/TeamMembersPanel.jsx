import { Crown, UserMinus } from 'lucide-react';
import { formatEgoStateLabel } from '../utils/egoState';
import { ASSIGNABLE_TEAM_ROLES, TEAM_ROLES } from '../utils/teamRoles';
import AvatarBadge from './AvatarBadge';
import FunctionalRoleBadge from './FunctionalRoleBadge';
import SectionCard from './SectionCard';
import TeamRoleBadge from './TeamRoleBadge';

function JoinCodeBlock({ workspace }) {
  const { team, busyAction, codeCopyState, generateCode, copyCode } = workspace;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
        Код приглашения
      </p>
      {team.joinCode ? (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-2xl tracking-[0.2em] text-white">
              {team.joinCode}
            </p>
            {codeCopyState === 'copied' ? (
              <p className="mt-2 text-sm text-emerald-200">Код скопирован</p>
            ) : codeCopyState === 'failed' ? (
              <p className="mt-2 text-sm text-amber-200">
                Не удалось скопировать. Можно выделить вручную.
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={copyCode}
            className="rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-200 transition hover:border-blue-400 hover:text-white"
          >
            Скопировать код
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-slate-400">
            У команды ещё нет кода. Его можно создать и отправить человеку напрямую.
          </p>
          <button
            type="button"
            onClick={generateCode}
            disabled={busyAction === 'code'}
            className="rounded-2xl border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm text-blue-100 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busyAction === 'code' ? 'Создаём код...' : 'Создать код'}
          </button>
        </div>
      )}
    </div>
  );
}

function InviteMatchesBlock({ workspace }) {
  const {
    invitableMatches,
    matchesLoading,
    inviteeIds,
    busyAction,
    toggleInvitee,
    sendInvites,
  } = workspace;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
        Пригласить друзей и совпадения
      </p>
      {matchesLoading ? (
        <p className="mt-3 text-sm text-slate-400">Собираем друзей и совпадения...</p>
      ) : invitableMatches.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Некого пригласить: все друзья и совпадения уже в команде или их пока нет.
        </p>
      ) : (
        <>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {invitableMatches.map((candidate) => {
              const checked = inviteeIds.includes(candidate.userId);
              return (
                <label
                  key={candidate.userId}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition ${
                    checked
                      ? 'border-blue-400 bg-blue-500/10'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleInvitee(candidate.userId)}
                    className="sr-only"
                  />
                  <span className="text-sm text-white">{candidate.name}</span>
                  <span className="text-xs text-blue-200">
                    {checked ? 'Будет приглашён' : 'Пригласить'}
                  </span>
                </label>
              );
            })}
          </div>
          <button
            type="button"
            onClick={sendInvites}
            disabled={busyAction === 'invite' || inviteeIds.length === 0}
            className="mt-3 rounded-2xl bg-blue-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busyAction === 'invite' ? 'Отправляем...' : 'Отправить приглашения'}
          </button>
        </>
      )}
    </div>
  );
}

export default function TeamMembersPanel({ workspace }) {
  const {
    team,
    members,
    can,
    canManage,
    ownerId,
    busyAction,
    changeMemberRole,
    removeMember,
    transferOwnership,
  } = workspace;

  return (
    <div className="space-y-6">
      <SectionCard
        title={`Участники · ${members.length}`}
        subtitle="Владелец и администраторы назначают роли и управляют составом. Владельца нельзя исключить или понизить — только передать владение."
      >
        <div className="space-y-3">
          {members.map((member) => {
            const role = team.roles[member.userId] || 'member';
            const manageable = canManage(member.userId);
            const busy = busyAction.endsWith(`:${member.userId}`);

            return (
              <div
                key={member.userId}
                className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950/40 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <AvatarBadge
                    initials={member.avatarInitials}
                    imageUrl={member.avatarUrl}
                    size="sm"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white">{member.name}</p>
                      <TeamRoleBadge role={role} />
                      <FunctionalRoleBadge
                        role={team.functionalRoles[member.userId]}
                        qualification={team.qualifications[member.userId]}
                      />
                    </div>
                    <p className="mt-1 text-sm text-slate-400">
                      {formatEgoStateLabel(member.egoState)}
                    </p>
                  </div>
                </div>

                {manageable || (can.transferOwnership && member.userId !== ownerId) ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {manageable ? (
                      <select
                        value={role}
                        disabled={busy}
                        onChange={(event) =>
                          changeMemberRole(member.userId, event.target.value)
                        }
                        aria-label={`Роль: ${member.name}`}
                        className="rounded-2xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-blue-400 disabled:opacity-60"
                      >
                        {ASSIGNABLE_TEAM_ROLES.map((roleKey) => (
                          <option key={roleKey} value={roleKey}>
                            {TEAM_ROLES[roleKey].label}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    {can.transferOwnership && member.userId !== ownerId ? (
                      <button
                        type="button"
                        onClick={() => transferOwnership(member)}
                        disabled={busy}
                        title="Передать владение"
                        className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/40 px-3 py-2 text-sm text-amber-200 transition hover:bg-amber-500/10 disabled:opacity-60"
                      >
                        <Crown className="h-4 w-4" />
                        <span className="hidden sm:inline">Сделать владельцем</span>
                      </button>
                    ) : null}
                    {manageable ? (
                      <button
                        type="button"
                        onClick={() => removeMember(member)}
                        disabled={busy}
                        title="Исключить"
                        className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/40 px-3 py-2 text-sm text-rose-200 transition hover:bg-rose-500/10 disabled:opacity-60"
                      >
                        <UserMinus className="h-4 w-4" />
                        <span className="hidden sm:inline">Исключить</span>
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </SectionCard>

      {can.invite ? (
        <SectionCard
          title="Пригласить в команду"
          subtitle="Отправьте код напрямую или пригласите друзей и взаимные совпадения."
        >
          <div className="grid gap-4 xl:grid-cols-2">
            <JoinCodeBlock workspace={workspace} />
            <InviteMatchesBlock workspace={workspace} />
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
