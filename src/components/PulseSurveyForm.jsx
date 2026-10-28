import { PULSE_QUESTIONS, formatWeekLabel } from '../utils/teamFeedback';
import RatingScale from './RatingScale';

export default function PulseSurveyForm({ feedback }) {
  const {
    weekKey,
    colleagues,
    pulseForm,
    pulseComplete,
    busyAction,
    setPulseAnswer,
    togglePulseFriction,
    setPulseComment,
    sendPulse,
  } = feedback;

  return (
    <form
      className="space-y-5 rounded-3xl border border-blue-500/30 bg-slate-950/40 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        sendPulse();
      }}
    >
      <div>
        <p className="font-display text-lg text-white">
          Опрос недели · с {formatWeekLabel(weekKey)}
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          Пять коротких вопросов, чтобы вовремя заметить трение. Ответы видят только
          владелец и администраторы команды — в виде общей картины.
        </p>
      </div>

      {PULSE_QUESTIONS.map((question) => (
        <div key={question.key}>
          <p className="mb-2 text-sm text-slate-200">{question.text}</p>
          <RatingScale
            label={question.text}
            value={pulseForm.answers[question.key]}
            onChange={(value) => setPulseAnswer(question.key, value)}
            lowLabel={question.lowLabel}
            highLabel={question.highLabel}
          />
        </div>
      ))}

      <div>
        <p className="mb-2 text-sm text-slate-200">
          С кем на этой неделе было сложнее взаимодействовать? (необязательно)
        </p>
        <div className="flex flex-wrap gap-2">
          {colleagues.map((member) => {
            const selected = pulseForm.frictionWith.includes(member.userId);
            return (
              <button
                key={member.userId}
                type="button"
                aria-pressed={selected}
                onClick={() => togglePulseFriction(member.userId)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  selected
                    ? 'border-amber-400 bg-amber-500/10 text-amber-200'
                    : 'border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                {member.name}
              </button>
            );
          })}
        </div>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm text-slate-200">
          Что мешало или помогало? (необязательно)
        </span>
        <textarea
          value={pulseForm.comment}
          onChange={(event) => setPulseComment(event.target.value)}
          rows="2"
          maxLength={1000}
          className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-blue-400"
        />
      </label>

      <button
        type="submit"
        disabled={!pulseComplete || busyAction === 'pulse'}
        className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busyAction === 'pulse' ? 'Отправляем...' : 'Отправить ответ'}
      </button>
    </form>
  );
}
