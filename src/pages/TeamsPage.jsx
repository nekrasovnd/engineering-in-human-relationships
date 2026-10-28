import { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTeamSelection } from '../hooks/useTeamSelection';
import { GOAL_OPTIONS, useTeamsWorkspace } from '../hooks/useTeamsWorkspace';
import { formatEgoStateLabel } from '../utils/egoState';
import { getTeamRole, TEAM_ROLES } from '../utils/teamRoles';
import FriendsPanel from '../components/FriendsPanel';
import SectionCard from '../components/SectionCard';
import TeamListItem from '../components/TeamListItem';
import TeamSelectionPanel from '../components/TeamSelectionPanel';

const SOURCE_LABELS = { friend: 'Друг', match: 'Совпадение' };

export default function TeamsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const formRef = useRef(null);
  const {
    friends,
    inviteCandidates,
    matchesLoading,
    invitesLoading,
    teamsLoading,
    form,
    saving,
    respondingInviteId,
    codeInviteValue,
    codeInviteLoading,
    codeInviteError,
    codeInviteSuccess,
    inviteActionError,
    error,
    pendingInvites,
    teams,
    updateFormField,
    toggleInvitee,
    setInvitees,
    updateCodeInviteValue,
    createTeam,
    acceptInvite,
    declineInvite,
    requestInviteByCode,
  } = useTeamsWorkspace(profile, location.state);
  const selection = useTeamSelection(profile, inviteCandidates);

  const applyGroup = (group) => {
    setInvitees(group.members.map((member) => member.userId));
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCreateTeam = async (event) => {
    event.preventDefault();
    const teamId = await createTeam();

    if (teamId) {
      navigate(`/teams/${teamId}`);
    }
  };

  // Сначала команды, где у пользователя больше прав.
  const sortedTeams = [...teams].sort(
    (left, right) =>
      TEAM_ROLES[getTeamRole(right, profile.userId) || 'member'].rank -
      TEAM_ROLES[getTeamRole(left, profile.userId) || 'member'].rank,
  );

  return (
    <div className="space-y-6">
      <SectionCard
        title="Команды"
        subtitle="Собирайте людей через взаимный интерес и приглашения, а потом уже смотрите, как команда держит темп, роли и нагрузку."
      >
        <form
          ref={formRef}
          className="grid scroll-mt-6 gap-6 xl:grid-cols-[0.95fr_1.05fr]"
          onSubmit={handleCreateTeam}
        >
          <div className="space-y-4 rounded-[28px] border border-slate-800 bg-slate-950/40 p-5">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">
                Название команды
              </span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => updateFormField('name', event.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-blue-400"
                  placeholder="Например, Экипаж проектного старта"
                />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Описание</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateFormField('description', event.target.value)
                }
                rows="4"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-blue-400"
                placeholder="Кратко опишите цель и контекст этой команды."
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Цель команды</span>
              <select
                value={form.goal}
                onChange={(event) => updateFormField('goal', event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-blue-400"
              >
                {GOAL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            {error ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-blue-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? 'Создаём команду...'
                : form.inviteeIds.length > 0
                  ? 'Создать команду и отправить приглашения'
                  : 'Создать команду'}
            </button>
          </div>

          <div className="rounded-[28px] border border-slate-800 bg-slate-950/40 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Кого можно пригласить
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Друзья, добавленные по коду, и взаимные совпадения из знакомств. Так приглашение в команду начинается не со случайного списка людей, а с уже подтверждённого интереса.
            </p>

            {matchesLoading ? (
              <p className="mt-4 text-sm text-slate-400">
                Собираем друзей и совпадения...
              </p>
            ) : inviteCandidates.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm leading-6 text-slate-400">
                Пока некого пригласить. Добавьте друзей по коду ниже или найдите взаимные совпадения в знакомствах.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {inviteCandidates.map((candidate) => {
                  const checked = form.inviteeIds.includes(candidate.userId);
                  return (
                    <label
                      key={candidate.userId}
                      className={`cursor-pointer rounded-2xl border p-4 transition ${
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
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{candidate.name}</p>
                          <p className="text-sm text-slate-400">
                            {candidate.sources.map((source) => SOURCE_LABELS[source]).join(' · ')}
                            {' · '}
                            {formatEgoStateLabel(candidate.egoState)}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-950/80 px-3 py-1 text-xs text-blue-200">
                          {checked ? 'Будет приглашён' : 'Пригласить'}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Вступить по коду
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Если вам дали код команды напрямую, введите его здесь. Это работает без общего списка пользователей и без взаимного совпадения.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={codeInviteValue}
                  onChange={(event) => updateCodeInviteValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      requestInviteByCode();
                    }
                  }}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-blue-400"
                  placeholder="Например, A7K2M9QP"
                  maxLength={12}
                />
                <button
                  type="button"
                  onClick={requestInviteByCode}
                  disabled={codeInviteLoading}
                  className="rounded-2xl border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm text-blue-100 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {codeInviteLoading ? 'Проверяем код...' : 'Войти по коду'}
                </button>
              </div>

              {codeInviteError ? (
                <div className="mt-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {codeInviteError}
                </div>
              ) : null}

              {codeInviteSuccess ? (
                <div className="mt-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {codeInviteSuccess}
                </div>
              ) : null}
            </div>
          </div>
        </form>
      </SectionCard>

      <TeamSelectionPanel
        selection={selection}
        currentUserId={profile.userId}
        loading={matchesLoading}
        onUseGroup={applyGroup}
      />

      <FriendsPanel friends={friends} />

      <SectionCard
        title="Приглашения"
        subtitle="Здесь команды, куда вас уже позвали, но вы ещё не решили, входить в них или нет."
      >
        {invitesLoading ? (
          <p className="text-sm text-slate-400">Загружаем приглашения...</p>
        ) : pendingInvites.length === 0 ? (
          <p className="text-sm leading-7 text-slate-400">
            Пока новых приглашений нет.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5"
              >
                <p className="font-display text-xl text-white">{invite.teamName}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {invite.teamDescription}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-400">
                  {invite.teamGoal}
                </p>
                <p className="mt-3 text-sm text-slate-400">
                  Пригласил: {invite.fromName}
                </p>
                {inviteActionError.inviteId === invite.id ? (
                  <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {inviteActionError.message}
                  </div>
                ) : null}
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => acceptInvite(invite.id)}
                    disabled={respondingInviteId === invite.id}
                    className="rounded-2xl bg-blue-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {respondingInviteId === invite.id
                      ? 'Обрабатываем...'
                      : 'Вступить'}
                  </button>
                  <button
                    type="button"
                    onClick={() => declineInvite(invite.id)}
                    disabled={respondingInviteId === invite.id}
                    className="rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-200 transition hover:border-blue-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Отклонить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Мои команды"
        subtitle="Откройте команду, чтобы управлять участниками, ролями и приглашениями."
      >
        {teamsLoading ? (
          <p className="text-sm text-slate-400">Загружаем команды...</p>
        ) : sortedTeams.length === 0 ? (
          <p className="text-sm leading-7 text-slate-400">
            Пока вы не состоите ни в одной команде. Создайте свою или вступите по коду.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {sortedTeams.map((team) => (
              <TeamListItem
                key={team.id}
                team={team}
                role={getTeamRole(team, profile.userId)}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
