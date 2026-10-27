import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTeamWorkspace } from '../hooks/useTeamWorkspace';
import SectionCard from '../components/SectionCard';
import TeamCard from '../components/TeamCard';
import TeamMembersPanel from '../components/TeamMembersPanel';
import TeamRoleBadge from '../components/TeamRoleBadge';
import TeamSettingsPanel from '../components/TeamSettingsPanel';

const TABS = [
  { key: 'overview', label: 'Обзор' },
  { key: 'members', label: 'Участники' },
  { key: 'settings', label: 'Настройки' },
];

export default function TeamPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const workspace = useTeamWorkspace(teamId, profile);
  const [activeTab, setActiveTab] = useState('overview');
  const { loading, team, myRole, error, notice } = workspace;

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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

        <div className="flex gap-1 rounded-2xl border border-slate-800 bg-slate-950/40 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                activeTab === tab.key
                  ? 'bg-blue-500/15 text-blue-300'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              {tab.label}
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
        <TeamCard team={team} memberProfiles={team.memberSnapshots} />
      ) : null}

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
