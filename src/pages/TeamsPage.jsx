import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfiles } from '../hooks/useProfiles';
import { useTeams } from '../hooks/useTeams';
import { createTeam } from '../services/firestore';
import {
  buildTeamSummary,
  findMostConflictPair,
  getRecommendedRoles,
} from '../utils/teamAnalysis';
import SectionCard from '../components/SectionCard';
import TeamCard from '../components/TeamCard';

const GOAL_OPTIONS = ['Работа', 'Семья', 'Личные отношения'];

export default function TeamsPage() {
  const location = useLocation();
  const { profile } = useAuth();
  const { profiles, loading: profilesLoading } = useProfiles(profile.userId);
  const { teams, loading: teamsLoading } = useTeams(profile.userId);
  const [form, setForm] = useState({
    name: '',
    description: '',
    goal: GOAL_OPTIONS[0],
    memberIds: [profile.userId],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const suggestedMemberIds = location.state?.suggestedMemberIds || [];
    if (suggestedMemberIds.length === 0) {
      return;
    }

    setForm((current) => ({
      ...current,
      memberIds: Array.from(
        new Set([profile.userId, ...current.memberIds, ...suggestedMemberIds]),
      ),
    }));
  }, [location.state, profile.userId]);

  const teamableProfiles = useMemo(
    () => profiles.filter((item) => item.questionnaireCompleted),
    [profiles],
  );
  const availableMemberIds = useMemo(
    () => new Set(teamableProfiles.map((item) => item.userId)),
    [teamableProfiles],
  );

  const handleToggleMember = (userId) => {
    setForm((current) => {
      const exists = current.memberIds.includes(userId);
      const nextMemberIds = exists
        ? current.memberIds.filter((item) => item !== userId)
        : [...current.memberIds, userId];

      return {
        ...current,
        memberIds:
          userId === profile.userId || nextMemberIds.includes(profile.userId)
            ? nextMemberIds
            : [profile.userId, ...nextMemberIds],
      };
    });
  };

  const handleCreateTeam = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.name.trim() || !form.description.trim()) {
      setError('Укажите название и описание команды.');
      return;
    }

    try {
      setSaving(true);
      const memberIds = Array.from(new Set(form.memberIds)).filter((memberId) =>
        availableMemberIds.has(memberId),
      );

      if (memberIds.length < 2) {
        setError(
          'Добавьте минимум двух участников с завершённым профилем, включая себя.',
        );
        return;
      }

      const memberProfiles = memberIds
        .map((memberId) =>
          teamableProfiles.find((item) => item.userId === memberId),
        )
        .filter(Boolean);
      const roles = getRecommendedRoles(memberProfiles);
      const conflictPair = findMostConflictPair(memberProfiles);

      await createTeam({
        name: form.name.trim(),
        description: form.description.trim(),
        goal: form.goal,
        createdBy: profile.userId,
        memberIds,
        memberSnapshots: memberProfiles.map((item) => ({
          userId: item.userId,
          name: item.name,
          avatarInitials: item.avatarInitials,
          egoState: item.egoState,
          factorScores: item.factorScores,
        })),
        analysis: {
          summary: buildTeamSummary(memberProfiles),
          roles,
          conflictPair: conflictPair
            ? {
                leftName: conflictPair.left.name,
                rightName: conflictPair.right.name,
                compatibility: conflictPair.compatibility,
                conflictRisk: conflictPair.conflictRisk,
              }
            : null,
        },
      });

      setForm({
        name: '',
        description: '',
        goal: GOAL_OPTIONS[0],
        memberIds: [profile.userId],
      });
    } catch {
      setError('Не удалось создать команду. Проверьте Firestore rules.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Команды"
        subtitle="Создавайте рабочие, семейные или личные группы. Для каждой команды рассчитывается конфликтная пара и предлагаются роли."
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
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-blue-400"
                placeholder="Например, Экипаж проектного старта"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Описание</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
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
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    goal: event.target.value,
                  }))
                }
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
              {saving ? 'Создаём команду...' : 'Создать команду'}
            </button>
          </div>

          <div className="rounded-[28px] border border-slate-800 bg-slate-950/40 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Участники
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Добавлять можно только пользователей с завершённым профилем.
            </p>

            {profilesLoading ? (
              <p className="mt-4 text-sm text-slate-400">Загружаем участников...</p>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {teamableProfiles.map((candidate) => {
                  const checked = form.memberIds.includes(candidate.userId);
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
                        disabled={candidate.userId === profile.userId}
                        onChange={() => handleToggleMember(candidate.userId)}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{candidate.name}</p>
                          <p className="text-sm text-slate-400">
                            {candidate.egoState}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-950/80 px-3 py-1 text-xs text-blue-200">
                          {candidate.userId === profile.userId
                            ? 'Вы'
                            : checked
                              ? 'Добавлен'
                              : 'Выбрать'}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Мои команды"
        subtitle="Команды подгружаются из Firestore только для тех пользователей, которые входят в состав."
      >
        {teamsLoading ? (
          <p className="text-sm text-slate-400">Загружаем команды...</p>
        ) : teams.length === 0 ? (
          <p className="text-sm leading-7 text-slate-400">
            Пока нет команд. Создайте первую группу и сразу увидите самую напряжённую
            пару и рекомендуемые роли.
          </p>
        ) : (
          <div className="space-y-5">
            {teams.map((team) => {
              const members =
                team.memberIds
                  ?.map((memberId) =>
                    teamableProfiles.find((item) => item.userId === memberId),
                  )
                  .filter(Boolean) || [];
              return <TeamCard key={team.id} team={team} memberProfiles={members} />;
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
