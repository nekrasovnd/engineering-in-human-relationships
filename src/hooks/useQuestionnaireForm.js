import { useEffect, useMemo, useRef, useState } from 'react';
import { useBeforeUnload, useNavigate } from 'react-router-dom';
import {
  FACTOR_CONFIG,
  calculateQuestionnaireResult,
  getInitialAnswers,
} from '../data/questionnaire';
import { saveProfile, saveQuestionnaireDraft } from '../services/firestore';
import { buildProfileNarrative } from '../utils/profileAnalysis';

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

const TOTAL_QUESTIONS = FACTOR_CONFIG.reduce(
  (sum, factor) => sum + factor.questions.length,
  0,
);

export function useQuestionnaireForm(user, profile) {
  const navigate = useNavigate();
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
      setError('РЈРєР°Р¶РёС‚Рµ РёРјСЏ Рё РІРѕР·СЂР°СЃС‚.');
      return;
    }

    if (!Number.isInteger(age) || age < 16 || age > 90) {
      setError('Р’РѕР·СЂР°СЃС‚ РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ РѕС‚ 16 РґРѕ 90 Р»РµС‚.');
      return;
    }

    if (answeredCount !== TOTAL_QUESTIONS) {
      setError(`РќСѓР¶РЅРѕ РѕС‚РІРµС‚РёС‚СЊ РЅР° РІСЃРµ ${TOTAL_QUESTIONS} РІРѕРїСЂРѕСЃРѕРІ.`);
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
        factorReliability: result.factorReliability,
        egoState: result.egoState,
        systemIndices: result.systemIndices,
        profileIntegrity: result.profileIntegrity,
        psychologicalVector50: result.psychologicalVector50,
        questionnaireCompleted: true,
      };

      await saveProfile(user.uid, {
        ...draftProfile,
        profileNarrative: buildProfileNarrative(draftProfile),
      });

      hasUserEditedRef.current = false;
      lastSavedSnapshotRef.current = currentSnapshot;
      setHasPendingChanges(false);
      setDraftState('saved');
      navigate('/profile');
    } catch {
      setError(
        'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РїСЂРѕС„РёР»СЊ. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.',
      );
    } finally {
      setSaving(false);
    }
  };

  const draftStatusMessage = useMemo(() => {
    if (draftState === 'saving') {
      return {
        tone: 'text-amber-200',
        text: 'Р§РµСЂРЅРѕРІРёРє Р°РЅРєРµС‚С‹ СЃРѕС…СЂР°РЅСЏРµС‚СЃСЏ...',
      };
    }

    if (draftState === 'saved' && hasPendingChanges) {
      return {
        tone: 'text-cyan-200',
        text: 'Р§РµСЂРЅРѕРІРёРє СЃРѕС…СЂР°РЅС‘РЅ. Р”Р»СЏ РїРµСЂРµСЃС‡С‘С‚Р° РёС‚РѕРіРѕРІРѕРіРѕ РїСЂРѕС„РёР»СЏ РЅР°Р¶РјРёС‚Рµ В«РЎРѕС…СЂР°РЅРёС‚СЊ РїСЂРѕС„РёР»СЊВ».',
      };
    }

    if (draftState === 'error') {
      return {
        tone: 'text-rose-200',
        text: 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ С‡РµСЂРЅРѕРІРёРє. РР·РјРµРЅРµРЅРёСЏ РѕСЃС‚Р°РЅСѓС‚СЃСЏ С‚РѕР»СЊРєРѕ РІ С‚РµРєСѓС‰РµР№ РІРєР»Р°РґРєРµ.',
      };
    }

    return null;
  }, [draftState, hasPendingChanges]);

  return {
    FACTOR_CONFIG,
    TOTAL_QUESTIONS,
    currentFactorIndex,
    setCurrentFactorIndex,
    currentFactor,
    saving,
    error,
    baseForm,
    answers,
    answeredCount,
    completionPercent,
    isLastFactor,
    remainingCount,
    draftStatusMessage,
    handleBaseFormChange,
    handleAnswerChange,
    handleSaveProfile,
  };
}
