import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTeamFeedback } from '../hooks/useTeamFeedback';
import { useTeamPlanning } from '../hooks/useTeamPlanning';
import { useTeamWorkspace } from '../hooks/useTeamWorkspace';
import CurrentIterationCard from '../components/CurrentIterationCard';
import SectionCard from '../components/SectionCard';
import TaskFormDialog from '../components/TaskFormDialog';
import TeamCard from '../components/TeamCard';
import TeamFeedbackPanel from '../components/TeamFeedbackPanel';
import TeamIterationsPanel from '../components/TeamIterationsPanel';
import TeamMembersPanel from '../components/TeamMembersPanel';
import TeamRoleBadge from '../components/TeamRoleBadge';
import TeamSettingsPanel from '../components/TeamSettingsPanel';
import TeamTasksPanel from '../components/TeamTasksPanel';

const TABS = [
  { key: 'overview', label: 'Обзор' },
  { key: 'tasks', label: 'Задачи' },
  { key: 'iterations', label: 'Итерации' },
  { key: 'feedback', label: 'Обратная связь' },
  { key: 'members', label: 'Участники' },
  { key: 'settings', label: 'Настройки' },
];

export default function TeamPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const workspace = useTeamWorkspace(teamId, profile);
  const { loading, team, myRole, error, notice } = workspace;
  const planning = useTeamPlanning(team, profile, {
    onError: workspace.showError,
    onNotice: workspace.showNotice,
  });
  const feedback = useTeamFeedback(team, profile, planning.iterations, {
    onError: workspace.showError,
    onNotice: workspace.showNotice,
  });
  const [activeTab, setActiveTab] = useState('overview');

  const openMyTasks = () => {
    planning.setOnlyMine(true);
    setActiveTab('tasks');
  };

  const showIterationTasks = (iterationId) => {
    planning.setIterationFilter(iterationId);
    planning.setOnlyMine(false);
    setActiveTab('tasks');
  };

  if (loading) {
    return <p className="text-sm text-slate-400">Загружаем команду...</p>;
  }

  if (!team) {
    return (
      <SectionCard
        title="Команда недоступна"
        subtitle="Её удалили, вы из неё вышли или у вас нет доступа."
      >
        <Link to="/teams" className="text-sm text-blue-300 hover:text-blue-200">
          ← Ко всем командам
        </Link>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Link
            to="/teams"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Все команды
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl text-white sm:text-3xl">{team.name}</h1>
            <TeamRoleBadge role={myRole} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            {team.goal} · {team.description}
          </p>
        </div>

        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/40 p-1 sm:inline-flex">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-sm transition ${
                activeTab === tab.key
                  ? 'bg-blue-500/15 text-blue-300'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              {tab.label}
              {tab.key === 'feedback' && feedback.pendingCount > 0 ? (
                <span className="ml-2 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-slate-950">
                  {feedback.pendingCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {error || notice ? (
        // Фиксируем над нижней навигацией: действия бывают внизу длинной страницы.
        <div className="fixed inset-x-0 bottom-24 z-40 mx-auto max-w-xl px-4">
          <div
            role="status"
            className={`rounded-2xl border px-4 py-3 text-sm shadow-glow backdrop-blur ${
              error
                ? 'border-rose-500/30 bg-rose-950/90 text-rose-200'
                : 'border-emerald-500/30 bg-emerald-950/90 text-emerald-200'
            }`}
          >
            {error || notice}
          </div>
        </div>
      ) : null}

      {activeTab === 'overview' ? (
        <>
          {feedback.pendingCount > 0 ? (
            <div className="flex flex-col gap-3 rounded-[28px] border border-amber-500/30 bg-amber-500/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-amber-50">
                {feedback.pendingReviewIterations.length > 0
                  ? 'Итерация закрыта — оцените коллег. '
                  : ''}
                {feedback.pulseDue ? 'Пройдите короткий опрос недели о трении в команде.' : ''}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('feedback')}
                className="shrink-0 rounded-2xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-400"
              >
                Пройти опросы
              </button>
            </div>
          ) : null}
          <CurrentIterationCard
            planning={planning}
            onOpenTasks={openMyTasks}
            onOpenIterations={() => {
              planning.openNewIteration();
              setActiveTab('iterations');
            }}
          />
          <TeamCard team={team} memberProfiles={team.memberSnapshots} />
        </>
      ) : null}

      {activeTab === 'tasks' ? (
        <TeamTasksPanel planning={planning} currentUserId={profile.userId} />
      ) : null}

      {activeTab === 'iterations' ? (
        <TeamIterationsPanel planning={planning} onShowTasks={showIterationTasks} />
      ) : null}

      {activeTab === 'feedback' ? (
        <TeamFeedbackPanel feedback={feedback} teamSize={team.memberIds.length} />
      ) : null}

      <TaskFormDialog team={team} planning={planning} />

      {activeTab === 'members' ? <TeamMembersPanel workspace={workspace} /> : null}

      {activeTab === 'settings' ? (
        <TeamSettingsPanel
          workspace={workspace}
          onLeft={() => navigate('/teams', { replace: true })}
        />
      ) : null}
    </div>
  );
}
