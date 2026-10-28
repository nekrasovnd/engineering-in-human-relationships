import { CheckCircle2 } from 'lucide-react';
import { formatWeekLabel } from '../utils/teamFeedback';
import FeedbackResults from './FeedbackResults';
import PeerReviewForm from './PeerReviewForm';
import PulseSurveyForm from './PulseSurveyForm';
import SectionCard from './SectionCard';

export default function TeamFeedbackPanel({ feedback, teamSize }) {
  const {
    loading,
    colleagues,
    weekKey,
    pulseDue,
    myPulseThisWeek,
    pendingReviewIterations,
    reviewIteration,
    startReview,
  } = feedback;

  return (
    <div className="space-y-6">
      <SectionCard
        title="Мои опросы"
        subtitle="Раз в неделю — короткий опрос о трении, после каждой закрытой итерации — оценка коллег."
      >
        {loading ? (
          <p className="text-sm text-slate-400">Загружаем опросы...</p>
        ) : colleagues.length === 0 ? (
          <p className="text-sm text-slate-400">
            Опросы появятся, когда в команде будет хотя бы ещё один участник.
          </p>
        ) : (
          <div className="space-y-4">
            {reviewIteration ? (
              <PeerReviewForm feedback={feedback} />
            ) : (
              pendingReviewIterations.map((iteration) => (
                <div
                  key={iteration.id}
                  className="flex flex-col gap-3 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-sm leading-6 text-amber-50">
                    Итерация «{iteration.title}» закрыта — оцените, как с вами работали коллеги.
                  </p>
                  <button
                    type="button"
                    onClick={() => startReview(iteration.id)}
                    className="shrink-0 rounded-2xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-400"
                  >
                    Оценить коллег
                  </button>
                </div>
              ))
            )}

            {pulseDue ? (
              <PulseSurveyForm feedback={feedback} />
            ) : myPulseThisWeek ? (
              <p className="flex items-center gap-2 text-sm text-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                Опрос недели с {formatWeekLabel(weekKey)} пройден. Следующий — с понедельника.
              </p>
            ) : null}
          </div>
        )}
      </SectionCard>

      <FeedbackResults feedback={feedback} teamSize={teamSize} />
    </div>
  );
}
