import { ArrowLeft } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOptionalTestForm } from '../hooks/useOptionalTestForm';
import RatingScale from '../components/RatingScale';
import SectionCard from '../components/SectionCard';

export default function OptionalTestPage() {
  const { testKey } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { test, questions, answers, answeredCount, complete, saving, error, setAnswer, submit } =
    useOptionalTestForm(testKey, profile);

  if (!test) {
    return <Navigate to="/profile" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (await submit()) {
      navigate('/profile');
    }
  };

  return (
    <div className="space-y-6">
      <Link
        to="/profile"
        className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Профиль
      </Link>

      <SectionCard title={test.title} subtitle={test.intro}>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {questions.map((question, index) => (
            <div key={question.id}>
              <p className="mb-2 text-sm text-slate-200">
                {index + 1}. {question.text}
              </p>
              <RatingScale
                label={question.text}
                value={answers[question.id]}
                onChange={(value) => setAnswer(question.id, value)}
                lowLabel={test.lowLabel}
                highLabel={test.highLabel}
              />
            </div>
          ))}

          {error ? <p className="text-sm text-rose-200">{error}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!complete || saving}
              className="rounded-2xl bg-blue-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Сохраняем...' : 'Сохранить результат'}
            </button>
            <p className="text-sm text-slate-400">
              Отвечено {answeredCount} из {questions.length}
            </p>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
