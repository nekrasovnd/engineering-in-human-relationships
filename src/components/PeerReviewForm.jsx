import { PEER_CRITERIA } from '../utils/teamFeedback';
import AvatarBadge from './AvatarBadge';
import RatingScale from './RatingScale';

export default function PeerReviewForm({ feedback }) {
  const {
    reviewIteration,
    colleagues,
    reviewRatings,
    reviewComments,
    reviewComplete,
    busyAction,
    setReviewRating,
    setReviewComment,
    sendReview,
    cancelReview,
  } = feedback;

  return (
    <form
      className="space-y-5 rounded-3xl border border-blue-500/30 bg-slate-950/40 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        sendReview();
      }}
    >
      <div>
        <p className="font-display text-lg text-white">
          Оценка коллег · {reviewIteration.title}
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          1 — совсем не про этого человека, 5 — отлично. Отправить можно один раз;
          результаты видят владелец и администраторы в виде средних.
        </p>
      </div>

      {colleagues.map((member) => (
        <div
          key={member.userId}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
        >
          <div className="mb-4 flex items-center gap-3">
            <AvatarBadge
              initials={member.avatarInitials}
              imageUrl={member.avatarUrl}
              size="sm"
            />
            <p className="font-medium text-white">{member.name}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {PEER_CRITERIA.map((criterion) => (
              <div key={criterion.key}>
                <p className="mb-2 text-sm text-slate-300">{criterion.label}</p>
                <RatingScale
                  label={`${member.name}: ${criterion.label}`}
                  value={reviewRatings[member.userId]?.[criterion.key]}
                  onChange={(value) =>
                    setReviewRating(member.userId, criterion.key, value)
                  }
                />
              </div>
            ))}
          </div>
          <input
            type="text"
            value={reviewComments[member.userId] || ''}
            onChange={(event) => setReviewComment(member.userId, event.target.value)}
            maxLength={1000}
            placeholder="Комментарий (необязательно)"
            className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-400"
          />
        </div>
      ))}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={!reviewComplete || busyAction === 'review'}
          className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busyAction === 'review' ? 'Отправляем...' : 'Отправить оценку'}
        </button>
        <button
          type="button"
          onClick={cancelReview}
          className="rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-200 transition hover:border-blue-400 hover:text-white"
        >
          Позже
        </button>
      </div>
    </form>
  );
}
