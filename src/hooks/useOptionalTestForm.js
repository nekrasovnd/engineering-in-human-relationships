import { useMemo, useState } from 'react';
import { OPTIONAL_TESTS } from '../data/optionalTests';
import { saveOptionalTest } from '../services/firestore';

// Вперемешку по шкалам: подряд идущие вопросы одной шкалы подсказывают, что измеряется.
function orderQuestions(test) {
  const position = (id) => Number(id.replace(/\D/g, ''));

  return [...test.items].sort((left, right) => position(left.id) - position(right.id));
}

/** Форма необязательного теста; прошлые ответы подставляются для перепрохождения. */
export function useOptionalTestForm(testKey, profile) {
  const test = OPTIONAL_TESTS[testKey] || null;
  const questions = useMemo(() => (test ? orderQuestions(test) : []), [test]);
  const [answers, setAnswers] = useState(() => profile?.[testKey]?.answers || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const answeredCount = questions.filter((question) => answers[question.id]).length;

  const setAnswer = (questionId, value) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const submit = async () => {
    setError('');

    try {
      setSaving(true);
      await saveOptionalTest(profile.userId, testKey, answers);
      return true;
    } catch {
      setError('Не удалось сохранить результат. Попробуйте ещё раз.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    test,
    questions,
    answers,
    answeredCount,
    complete: questions.length > 0 && answeredCount === questions.length,
    saving,
    error,
    setAnswer,
    submit,
  };
}
