import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GOAL_OPTIONS, useTeamsWorkspace } from '../hooks/useTeamsWorkspace';
import { formatEgoStateLabel } from '../utils/egoState';
import SectionCard from '../components/SectionCard';
import TeamCard from '../components/TeamCard';

export default function TeamsPage() {
  const location = useLocation();
  const { profile } = useAuth();
  const {
    mutualMatches,
    matchesLoading,
    invitesLoading,
    teamsLoading,
    form,
    saving,
    respondingInviteId,
    codeInviteValue,
    codeInviteLoading,
    generatingCodeForTeamId,
    copiedCodeForTeamId,
    copyFailedForTeamId,
    codeInviteError,
    codeInviteSuccess,
    inviteActionError,
    codeSuccess,
    error,
    pendingInvites,
    createdTeams,
    joinedTeams,
    updateFormField,
    toggleInvitee,
    updateCodeInviteValue,
    createTeam,
    acceptInvite,
    declineInvite,
    requestInviteByCode,
    generateCode,
    copyCode,
  } = useTeamsWorkspace(profile, location.state);

  const handleCreateTeam = async (event) => {
    event.preventDefault();
    await createTeam();
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Команды"
        subtitle="Собирайте людей через взаимный интерес и приглашения, а потом уже смотрите, как команда держит темп, роли и нагрузку."
      >
        <form
          className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]"
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

            {codeSuccess ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {codeSuccess}
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
              Здесь показываются только взаимные совпадения из знакомств. Так приглашение в команду начинается не со случайного списка людей, а с уже подтверждённого интереса.
            </p>

            {matchesLoading ? (
              <p className="mt-4 text-sm text-slate-400">
                Собираем взаимные совпадения...
              </p>
            ) : mutualMatches.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm leading-6 text-slate-400">
                Пока нет взаимных совпадений. Сначала они появятся в знакомствах, а уже потом здесь можно будет отправить приглашение в команду.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {mutualMatches.map((candidate) => {
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
        title="Созданные мной"
        subtitle="Ваши команды, где вы задали состав и исходную рамку."
      >
        {teamsLoading ? (
          <p className="text-sm text-slate-400">Загружаем команды...</p>
        ) : createdTeams.length === 0 ? (
          <p className="text-sm leading-7 text-slate-400">
            Пока вы не создали ни одной команды.
          </p>
        ) : (
          <div className="space-y-5">
            {createdTeams.map((team) => (
              <div key={team.id} className="space-y-3">
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
                        {copiedCodeForTeamId === team.id ? (
                          <p className="mt-2 text-sm text-emerald-200">
                            Код скопирован
                          </p>
                        ) : copyFailedForTeamId === team.id ? (
                          <p className="mt-2 text-sm text-amber-200">
                            Не удалось скопировать. Можно выделить вручную.
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => copyCode(team.id, team.joinCode)}
                        className={`rounded-2xl border px-4 py-3 text-sm transition ${
                          copiedCodeForTeamId === team.id
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                            : copyFailedForTeamId === team.id
                              ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                            : 'border-slate-700 text-slate-200 hover:border-blue-400 hover:text-white'
                        }`}
                      >
                        {copiedCodeForTeamId === team.id
                          ? 'Скопировано'
                          : copyFailedForTeamId === team.id
                            ? 'Не удалось'
                          : 'Скопировать код'}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm leading-6 text-slate-400">
                        У этой команды ещё нет кода. Его можно создать и отправить человеку напрямую.
                      </p>
                      <button
                        type="button"
                        onClick={() => generateCode(team)}
                        disabled={generatingCodeForTeamId === team.id}
                        className="rounded-2xl border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm text-blue-100 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {generatingCodeForTeamId === team.id
                          ? 'Создаём код...'
                          : 'Создать код'}
                      </button>
                    </div>
                  )}
                </div>

                <TeamCard
                  team={team}
                  memberProfiles={team.memberSnapshots || []}
                />
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Команды, где я участвую"
        subtitle="Команды, куда вас пригласили и где вы уже стали частью общего контура."
      >
        {teamsLoading ? (
          <p className="text-sm text-slate-400">Загружаем команды...</p>
        ) : joinedTeams.length === 0 ? (
          <p className="text-sm leading-7 text-slate-400">
            Пока вы ещё не вступили ни в одну чужую команду.
          </p>
        ) : (
          <div className="space-y-5">
            {joinedTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                memberProfiles={team.memberSnapshots || []}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
