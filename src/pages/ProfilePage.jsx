import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PencilLine } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  FACTOR_CONFIG,
  getDisplayFactorScore,
  getFactorPoleLabel,
} from '../data/questionnaire';
import { saveProfile } from '../services/firestore';
import { formatEgoStateLabel } from '../utils/egoState';
import AvatarBadge from '../components/AvatarBadge';
import InstructionCard from '../components/InstructionCard';
import ProfileInsightCard from '../components/ProfileInsightCard';
import RadarProfileChart from '../components/RadarProfileChart';
import SectionCard from '../components/SectionCard';

function getFactorProfileExplanation(factor, rawScore) {
  const score = getDisplayFactorScore(factor.key, rawScore);

  const bucket =
    score >= 6.5 ? 'high' : score <= 3.5 ? 'low' : 'mid';

  const explanations = {
    neuroticism: {
      high: 'Обычно держите внутреннее равновесие даже под давлением и не так быстро уходите в эмоциональный разгон.',
      mid: 'Чаще всего сохраняете устойчивость, но в тяжёлых ситуациях ваше состояние заметно зависит от контекста и нагрузки.',
      low: 'Сильнее реагируете на напряжение, неопределённость и резкую обратную связь, поэтому эмоциональный фон может быстрее захватывать управление.',
    },
    extraversion: {
      high: 'Лучше раскрываетесь через живой обмен, контакт с людьми и заметное участие в разговоре.',
      mid: 'Умеете переключаться между спокойной автономной работой и активным общением, в зависимости от задачи.',
      low: 'Чаще опираетесь на внутренний темп, тишину и возможность сначала подумать самому, а потом уже включаться в обмен.',
    },
    dominance: {
      high: 'В неоднозначных ситуациях легко берёте влияние на себя и стремитесь задавать направление.',
      mid: 'Обычно держите паритет: можете повести за собой, но не нуждаетесь в постоянном контроле над ситуацией.',
      low: 'Чаще комфортно работаете без борьбы за лидерство и можете легче подстроиться под чужую рамку или готовое решение.',
    },
    ruleAdaptation: {
      high: 'Проще и спокойнее работаете, когда есть понятная структура, сроки, роли и зафиксированные договорённости.',
      mid: 'Обычно можете опираться на структуру, но без лишней жёсткости и с местом для адаптации по ситуации.',
      low: 'Лучше чувствуете себя там, где остаётся пространство для гибкости, импровизации и более живого рабочего ритма.',
    },
    empathy: {
      high: 'Хорошо считываете состояние других и обычно подстраиваете тон общения так, чтобы не разрушать контакт.',
      mid: 'Обычно держите баланс между содержанием разговора и тем, как он переживается другим человеком.',
      low: 'Скорее опираетесь на прямоту, смысл и логику разговора, чем на постоянную калибровку по эмоциональному фону.',
    },
    stressResponse: {
      high: 'Под нагрузкой чаще собираетесь и удерживаете ход действий, чем выпадаете из процесса.',
      mid: 'В стрессе можете собраться, но ваша устойчивость заметно зависит от масштаба давления и ясности следующего шага.',
      low: 'Когда давление становится слишком сильным, вам может быть труднее сохранить темп и включённость в процесс.',
    },
    feedbackNeed: {
      high: 'Для уверенного движения вам обычно полезны регулярные короткие сверки и живой внешний отклик.',
      mid: 'Обычно хватает умеренной обратной связи: без постоянных подтверждений, но и не в полном информационном вакууме.',
      low: 'Вы можете долго держать курс самостоятельно и меньше зависите от частых комментариев или внешнего подтверждения.',
    },
    cooperation: {
      high: 'Обычно легче удерживаете общий результат, договариваетесь и вкладываетесь в совместный контур.',
      mid: 'Чаще всего сочетаете личную позицию с готовностью договариваться и искать рабочий общий вариант.',
      low: 'В напряжении можете сильнее защищать свою линию и личный результат, чем растворяться в общем командном режиме.',
    },
  };

  return explanations[factor.key]?.[bucket] || '';
}

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

            <div className="mt-6 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="max-w-full break-words text-[11px] uppercase tracking-[0.08em] leading-5 text-slate-400 sm:text-xs sm:tracking-[0.12em]">
                  Показатели профиля
                </p>
                <p className="mt-2 text-3xl font-display text-white">50</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  параметров учитываются в итоговом профиле
                </p>
              </div>
              <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="max-w-full break-words text-[11px] uppercase tracking-[0.08em] leading-5 text-slate-400 sm:text-xs sm:tracking-[0.12em]">
                  Профиль готов
                </p>
                <p className="mt-2 text-3xl font-display text-white">100%</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  анкета заполнена, все разделы доступны
                </p>
              </div>
              <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="max-w-full break-words text-[11px] uppercase tracking-[0.08em] leading-5 text-slate-400 sm:text-xs sm:tracking-[0.12em]">
                  Согласованность
                </p>
                <p className="mt-2 text-3xl font-display text-white">
                  {Math.round((profile.profileIntegrity ?? 7) * 10)}%
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Показывает, насколько ровно и непротиворечиво собраны ответы по шкалам.
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
        subtitle="Кратко показывает, что означает каждый фактор сам по себе и как он проявляется именно у вас."
      >
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {FACTOR_CONFIG.map((factor) => {
            const displayScore = getDisplayFactorScore(
              factor.key,
              profile.factorScores[factor.key],
            );
            const poleLabel = getFactorPoleLabel(
              factor,
              profile.factorScores[factor.key],
            );

            return (
              <div
                key={factor.key}
                className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  {factor.shortLabel}
                </p>
                <p className="mt-2 font-display text-3xl text-white">
                  {displayScore}
                </p>
                <p className="mt-1 text-sm text-blue-200">{poleLabel}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500">
                  Что измеряет
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {factor.description}
                </p>
                <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500">
                  Как это проявляется у вас
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {getFactorProfileExplanation(
                    factor,
                    profile.factorScores[factor.key],
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <ProfileInsightCard profile={profile} />
    </div>
  );
}
