import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PencilLine } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FACTOR_CONFIG } from '../data/questionnaire';
import { saveProfile } from '../services/firestore';
import { formatEgoStateLabel } from '../utils/egoState';
import { getFactorTone } from '../utils/profileAnalysis';
import AvatarBadge from '../components/AvatarBadge';
import InstructionCard from '../components/InstructionCard';
import ProfileInsightCard from '../components/ProfileInsightCard';
import RadarProfileChart from '../components/RadarProfileChart';
import SectionCard from '../components/SectionCard';

export default function ProfilePage() {
  const { profile } = useAuth();
  const [editForm, setEditForm] = useState({
    name: '',
    age: '',
    gender: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profile) {
      return;
    }

    setEditForm({
      name: profile.name || '',
      age: profile.age ? String(profile.age) : '',
      gender: profile.gender || '',
    });
  }, [profile]);

  const handleSaveProfileDetails = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    const age = Number(editForm.age);

    if (!editForm.name.trim() || !editForm.age) {
      setError('Укажите имя и возраст.');
      return;
    }

    if (!Number.isInteger(age) || age < 16 || age > 90) {
      setError('Возраст должен быть от 16 до 90 лет.');
      return;
    }

    try {
      setSaving(true);
      await saveProfile(profile.userId, {
        name: editForm.name.trim(),
        age,
        gender: editForm.gender,
        avatarInitials: editForm.name
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((item) => item[0]?.toUpperCase() || '')
          .join(''),
      });
      setMessage(
        'Базовые данные профиля обновлены без повторного прохождения опросника.',
      );
    } catch {
      setError('Не удалось сохранить базовые данные профиля.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Мой профиль"
        subtitle="Здесь собраны ваши результаты и основные данные."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/questionnaire"
              className="inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm text-blue-100 transition hover:bg-blue-500/20"
            >
              <PencilLine className="h-4 w-4" />
              Перепройти опросник
            </Link>
          </div>
        }
      >
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[28px] border border-slate-800 bg-slate-950/40 p-5">
            <div className="flex items-center gap-4">
              <AvatarBadge initials={profile.avatarInitials} size="lg" />
              <div>
                <p className="font-display text-3xl text-white">{profile.name}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {profile.age} лет
                  {profile.gender ? ` · ${profile.gender}` : ''}
                </p>
                <p className="mt-2 inline-flex rounded-full border border-slate-700 px-3 py-1 text-xs text-blue-200">
                  {formatEgoStateLabel(profile.egoState)}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Показатели профиля
                </p>
                <p className="mt-2 text-3xl font-display text-white">50</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  параметров учитываются в итоговом профиле
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Профиль готов
                </p>
                <p className="mt-2 text-3xl font-display text-white">100%</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  анкета заполнена, все разделы доступны
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-800 bg-slate-950/40 p-5">
            <RadarProfileChart scores={profile.factorScores} />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Редактирование базовых данных"
        subtitle="Имя, возраст и пол можно поменять отдельно. Повторный опросник нужен только если вы хотите пересчитать психологическую карту."
      >
        <form
          className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]"
          onSubmit={handleSaveProfileDetails}
        >
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Имя</span>
            <input
              type="text"
              value={editForm.name}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-blue-400"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Возраст</span>
              <input
                type="number"
                min="16"
                max="90"
                value={editForm.age}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    age: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-blue-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">
                Пол (опционально)
              </span>
              <select
                value={editForm.gender}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    gender: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-blue-400"
              >
                <option value="">Не указывать</option>
                <option value="Мужчина">Мужчина</option>
                <option value="Женщина">Женщина</option>
              </select>
            </label>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-blue-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Сохраняем...' : 'Сохранить'}
            </button>
          </div>
        </form>

        {message ? (
          <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}
      </SectionCard>

      <InstructionCard />

      <SectionCard
        title="8 факторов"
        subtitle="Каждая шкала показывает, насколько выражено качество по вашим ответам."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {FACTOR_CONFIG.map((factor) => (
            <div
              key={factor.key}
              className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                {factor.shortLabel}
              </p>
              <p className="mt-2 font-display text-3xl text-white">
                {profile.factorScores[factor.key]}
              </p>
              <p className="mt-1 text-sm text-blue-200">
                {getFactorTone(profile.factorScores[factor.key])} уровень
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {factor.description}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      <ProfileInsightCard profile={profile} />
    </div>
  );
}
