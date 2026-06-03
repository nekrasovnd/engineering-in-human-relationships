import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { useBeforeUnload, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FACTOR_CONFIG,
  LIKERT_OPTIONS,
  calculateQuestionnaireResult,
  getInitialAnswers,
} from '../data/questionnaire';
import {
  saveProfile,
  saveQuestionnaireDraft,
} from '../services/firestore';
import { buildProfileNarrative } from '../utils/profileAnalysis';
import SectionCard from '../components/SectionCard';

const TOTAL_QUESTIONS = FACTOR_CONFIG.reduce(
  (sum, factor) => sum + factor.questions.length,
  0,
);
const AUTOSAVE_DELAY_MS = 900;
const EMPTY_BASE_FORM = {
  name: '',
  age: '',
  gender: '',
};

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() || '')
    .join('');
}

function buildDraftSnapshot(baseForm, answers) {
  return JSON.stringify({
    name: baseForm.name,
    age: baseForm.age,
    gender: baseForm.gender,
    answers,
  });
}

function buildDraftPayload(baseForm, answers) {
  const age = Number(baseForm.age);
  const payload = {
    name: baseForm.name,
    gender: baseForm.gender,
    avatarInitials: getInitials(baseForm.name),
    answers,
  };

  if (Number.isInteger(age) && age >= 16 && age <= 90) {
    payload.age = age;
  }

  return payload;
}

export default function QuestionnairePage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [currentFactorIndex, setCurrentFactorIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [draftState, setDraftState] = useState('idle');
  const [error, setError] = useState('');
  const [baseForm, setBaseForm] = useState(EMPTY_BASE_FORM);
  const [answers, setAnswers] = useState(getInitialAnswers());
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const hasHydratedRef = useRef(false);
  const hasUserEditedRef = useRef(false);
  const lastSavedSnapshotRef = useRef(
    buildDraftSnapshot(EMPTY_BASE_FORM, getInitialAnswers()),
  );

  useEffect(() => {
    if (!user?.uid) {
      hasHydratedRef.current = false;
      hasUserEditedRef.current = false;
      lastSavedSnapshotRef.current = buildDraftSnapshot(
        EMPTY_BASE_FORM,
        getInitialAnswers(),
      );
      setBaseForm(EMPTY_BASE_FORM);
      setAnswers(getInitialAnswers());
      setDraftState('idle');
      setHasPendingChanges(false);
      return;
    }

    if (hasUserEditedRef.current) {
      return;
    }

    const nextBaseForm = profile
      ? {
          name: profile.name || '',
          age: profile.age ? String(profile.age) : '',
          gender: profile.gender || '',
        }
      : EMPTY_BASE_FORM;
    const nextAnswers = {
      ...getInitialAnswers(),
      ...(profile?.answers || {}),
    };

    setBaseForm(nextBaseForm);
    setAnswers(nextAnswers);
    lastSavedSnapshotRef.current = buildDraftSnapshot(nextBaseForm, nextAnswers);
    setDraftState('idle');
    setHasPendingChanges(false);
    hasHydratedRef.current = true;
  }, [profile, user?.uid]);

  const currentFactor = FACTOR_CONFIG[currentFactorIndex];
  const answeredCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers],
  );
  const completionPercent = Math.round((answeredCount / TOTAL_QUESTIONS) * 100);
  const isLastFactor = currentFactorIndex === FACTOR_CONFIG.length - 1;
  const remainingCount = TOTAL_QUESTIONS - answeredCount;
  const currentSnapshot = useMemo(
    () => buildDraftSnapshot(baseForm, answers),
    [answers, baseForm],
  );
  const hasProgress = useMemo(
    () =>
      answeredCount > 0 ||
      Boolean(baseForm.name.trim()) ||
      Boolean(baseForm.age) ||
      Boolean(baseForm.gender),
    [answeredCount, baseForm],
  );
  const shouldWarnBeforeExit =
    hasPendingChanges || (!profile?.questionnaireCompleted && hasProgress);

  useBeforeUnload((event) => {
    if (!shouldWarnBeforeExit) {
      return;
    }

    event.preventDefault();
    event.returnValue = '';
  });

  useEffect(() => {
    if (!user?.uid || !hasHydratedRef.current || !hasUserEditedRef.current) {
      return undefined;
    }

    if (currentSnapshot === lastSavedSnapshotRef.current) {
      return undefined;
    }

    setDraftState('saving');
    const timeoutId = window.setTimeout(async () => {
      try {
        await saveQuestionnaireDraft(
          user.uid,
          buildDraftPayload(baseForm, answers),
        );
        lastSavedSnapshotRef.current = currentSnapshot;
        setDraftState('saved');
      } catch {
        setDraftState('error');
      }
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [answers, baseForm, currentSnapshot, user?.uid]);

  const markQuestionnaireEdited = () => {
    hasUserEditedRef.current = true;
    setHasPendingChanges(true);
    setDraftState((current) => (current === 'error' ? 'idle' : current));
  };

  const handleBaseFormChange = (key, value) => {
    markQuestionnaireEdited();
    setBaseForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleAnswerChange = (questionId, value) => {
    markQuestionnaireEdited();
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  };

  const handleSaveProfile = async () => {
    setError('');
    const age = Number(baseForm.age);

    if (!baseForm.name.trim() || !baseForm.age) {
      setError('Укажите имя и возраст.');
      return;
    }

    if (!Number.isInteger(age) || age < 16 || age > 90) {
      setError('Возраст должен быть от 16 до 90 лет.');
      return;
    }

    if (answeredCount !== TOTAL_QUESTIONS) {
      setError(`Нужно ответить на все ${TOTAL_QUESTIONS} вопросов.`);
      return;
    }

    try {
      setSaving(true);
      const result = calculateQuestionnaireResult(answers);
      const draftProfile = {
        userId: user.uid,
        email: user.email,
        name: baseForm.name.trim(),
        age,
        gender: baseForm.gender,
        avatarInitials: getInitials(baseForm.name),
        answers,
        factorScores: result.factorScores,
        egoState: result.egoState,
        psychologicalVector50: result.psychologicalVector50,
        questionnaireCompleted: true,
      };

      const narrative = buildProfileNarrative(draftProfile);

      await saveProfile(user.uid, {
        ...draftProfile,
        profileNarrative: narrative,
      });

      hasUserEditedRef.current = false;
      lastSavedSnapshotRef.current = currentSnapshot;
      setHasPendingChanges(false);
      setDraftState('saved');
      navigate('/profile');
    } catch {
      setError(
        'Не удалось сохранить профиль. Проверьте Firestore rules и конфигурацию Firebase.',
      );
    } finally {
      setSaving(false);
    }
  };

  const draftStatusMessage = useMemo(() => {
    if (draftState === 'saving') {
      return {
        tone: 'text-amber-200',
        text: 'Черновик анкеты сохраняется...',
      };
    }

    if (draftState === 'saved' && hasPendingChanges) {
      return {
        tone: 'text-cyan-200',
        text: 'Черновик сохранён. Для пересчёта итогового профиля нажмите «Сохранить профиль».',
      };
    }

    if (draftState === 'error') {
      return {
        tone: 'text-rose-200',
        text: 'Не удалось сохранить черновик. Изменения останутся только в текущей вкладке.',
      };
    }

    return null;
  }, [draftState, hasPendingChanges]);

  return (
    <div className="min-h-screen bg-aurora px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <SectionCard
          title="Обязательный психологический опросник"
          subtitle="Пока опросник не пройден, страницы с командами, знакомствами и сравнением недоступны."
        >
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-blue-300">
                    Прогресс
                  </p>
                  <p className="mt-2 font-display text-4xl text-white">
                    {completionPercent}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Ответов</p>
                  <p className="mt-1 text-lg text-white">
                    {answeredCount} / {TOTAL_QUESTIONS}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Осталось ответить: {remainingCount}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Текущий блок
              </p>
              <p className="mt-2 font-display text-2xl text-white">
                {currentFactorIndex + 1}. {currentFactor.shortLabel}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {currentFactor.description}
              </p>
              {draftStatusMessage ? (
                <p className={`mt-3 text-sm leading-6 ${draftStatusMessage.tone}`}>
                  {draftStatusMessage.text}
                </p>
              ) : null}
            </div>
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title="Базовый профиль"
            subtitle="Эти поля сохраняются вместе с психологической картой. Позже базовые данные можно поправить в профиле без повторного прохождения теста."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Имя</span>
                <input
                  type="text"
                  required
                  value={baseForm.name}
                  onChange={(event) =>
                    handleBaseFormChange('name', event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-blue-400"
                  placeholder="Например, Анна Лебедева"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Возраст</span>
                <input
                  type="number"
                  required
                  min="16"
                  max="90"
                  value={baseForm.age}
                  onChange={(event) =>
                    handleBaseFormChange('age', event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-blue-400"
                  placeholder="27"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">
                  Пол (опционально)
                </span>
                <select
                  value={baseForm.gender}
                  onChange={(event) =>
                    handleBaseFormChange('gender', event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-blue-400"
                >
                  <option value="">Не указывать</option>
                  <option value="Мужчина">Мужчина</option>
                  <option value="Женщина">Женщина</option>
                </select>
              </label>
            </div>
          </SectionCard>

          <SectionCard
            title={`Блок ${currentFactorIndex + 1} из ${FACTOR_CONFIG.length}`}
            subtitle={currentFactor.label}
          >
            <div className="mb-5 flex flex-wrap gap-2">
              {FACTOR_CONFIG.map((factor, index) => (
                <button
                  key={factor.key}
                  type="button"
                  onClick={() => setCurrentFactorIndex(index)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    currentFactorIndex === index
                      ? 'bg-blue-500/20 text-blue-100'
                      : 'border border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {index + 1}. {factor.shortLabel}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {currentFactor.questions.map((question, questionIndex) => (
                <div
                  key={question.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4"
                >
                  <p className="text-sm leading-7 text-white">
                    {questionIndex + 1}. {question.text}
                  </p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-5">
                    {LIKERT_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={`cursor-pointer rounded-2xl border p-3 text-sm transition ${
                          Number(answers[question.id]) === option.value
                            ? 'border-blue-400 bg-blue-500/10 text-white'
                            : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option.value}
                          checked={Number(answers[question.id]) === option.value}
                          onChange={() =>
                            handleAnswerChange(question.id, option.value)
                          }
                          className="sr-only"
                        />
                        <span className="block text-xs uppercase tracking-[0.2em]">
                          {option.value}
                        </span>
                        <span className="mt-1 block leading-5">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() =>
                  setCurrentFactorIndex((current) => Math.max(current - 1, 0))
                }
                disabled={currentFactorIndex === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-200 transition hover:border-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Назад
              </button>

              {isLastFactor ? (
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Сохраняем профиль...' : 'Сохранить профиль'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentFactorIndex((current) =>
                      Math.min(current + 1, FACTOR_CONFIG.length - 1),
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-400"
                >
                  Следующий блок
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
