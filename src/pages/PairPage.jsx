import { AlertTriangle, ArrowLeft, MessageCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePairPulse } from '../hooks/usePairPulse';
import { PAIR_QUESTIONS } from '../utils/pairPulse';
import { formatWeekLabel } from '../utils/teamFeedback';
import FrictionTimelineChart from '../components/FrictionTimelineChart';
import RatingScale from '../components/RatingScale';
import SectionCard from '../components/SectionCard';

function ThisWeekAnswers({ myPulse, partnerPulse, partnerName }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead className="text-xs text-slate-400">
          <tr>
            <th className="py-2 pr-3 font-normal">Вопрос</th>
            <th className="py-2 pr-3 font-normal">Вы</th>
            <th className="py-2 font-normal">{partnerName}</th>
          </tr>
        </thead>
        <tbody className="text-slate-200">
          {PAIR_QUESTIONS.map((question) => (
            <tr key={question.key} className="border-t border-slate-800">
              <td className="py-2 pr-3">{question.text}</td>
              <td className="py-2 pr-3">{myPulse.answers[question.key]}</td>
              <td className="py-2">{partnerPulse.answers[question.key]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PairPage() {
  const { friendshipId } = useParams();
  const { profile } = useAuth();
  const {
    loading,
    friendship,
    partner,
    weekKey,
    prompt,
    answers,
    complete,
    saving,
    error,
    myPulse,
    partnerPulse,
    timeline,
    alert,
    setAnswer,
    send,
  } = usePairPulse(friendshipId, profile);

  if (loading) {
    return <p className="text-sm text-slate-400">Загружаем...</p>;
  }

  if (!friendship || !partner) {
    return (
      <SectionCard title="Пара недоступна" subtitle="Заявку ещё не приняли или дружбу удалили.">
        <Link to="/teams" className="text-sm text-blue-300 hover:text-blue-200">
          ← К друзьям
        </Link>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/teams"
        className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        К друзьям
      </Link>

      <SectionCard
        title={`Вы и ${partner.name}`}
        subtitle="Короткий опрос раз в неделю, чтобы замечать напряжение раньше, чем оно станет ссорой. Это не прогноз отношений и не диагноз, а повод поговорить."
      >
        <div className="space-y-5">
          <div className="flex gap-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm leading-6 text-blue-100">
            <MessageCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              <span className="font-medium">Вопрос для разговора на этой неделе. </span>
              {prompt}
            </p>
          </div>

          {alert ? (
            <div className="flex gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm leading-6 text-rose-200">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              Напряжение выше порога. Найдите спокойное время для разговора, не дожидаясь ссоры.
            </div>
          ) : null}

          {myPulse ? (
            partnerPulse ? (
              <ThisWeekAnswers
                myPulse={myPulse}
                partnerPulse={partnerPulse}
                partnerName={partner.name}
              />
            ) : (
              <p className="text-sm text-slate-300">
                Ваш ответ за неделю с {formatWeekLabel(weekKey)} сохранён. Ответы откроются, когда
                ответит {partner.name}.
              </p>
            )
          ) : (
            <form
              className="space-y-5 rounded-3xl border border-slate-800 bg-slate-950/40 p-5"
              onSubmit={(event) => {
                event.preventDefault();
                send();
              }}
            >
              <div>
                <p className="font-display text-lg text-white">
                  Опрос недели · с {formatWeekLabel(weekKey)}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  {partner.name} увидит ваши ответы только после своего ответа. Изменить ответ позже
                  нельзя.
                </p>
              </div>
              {PAIR_QUESTIONS.map((question) => (
                <div key={question.key}>
                  <p className="mb-2 text-sm text-slate-200">{question.text}</p>
                  <RatingScale
                    label={question.text}
                    value={answers[question.key]}
                    onChange={(value) => setAnswer(question.key, value)}
                    lowLabel={question.lowLabel}
                    highLabel={question.highLabel}
                  />
                </div>
              ))}
              {error ? <p className="text-sm text-rose-200">{error}</p> : null}
              <button
                type="submit"
                disabled={!complete || saving}
                className="rounded-2xl bg-blue-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Отправляем...' : 'Отправить'}
              </button>
            </form>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Уровень сигнала пары"
        subtitle="Индекс напряжения 0–10 по неделям, на которые ответили оба. Вопросы и порог наши и на данных не проверены."
      >
        {timeline.length === 0 ? (
          <p className="text-sm text-slate-400">
            График появится после первой недели, на которую ответите вы оба.
          </p>
        ) : (
          <FrictionTimelineChart timeline={timeline} />
        )}
      </SectionCard>
    </div>
  );
}
