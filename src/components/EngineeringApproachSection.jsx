import { ArrowDown, ArrowRight, CornerDownLeft } from 'lucide-react';
import {
  CONTROL_LOOP,
  MAINTENANCE_STRATEGIES,
  PROBLEM_SOLVING,
  PROJECT_LIFECYCLE,
} from '../data/engineeringApproach';
import SectionCard from './SectionCard';

function LoopNode({ code, title, team }) {
  return (
    <div className="flex-1 rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
      {code ? <p className="font-display text-2xl text-blue-300">{code}</p> : null}
      <p className={`text-sm font-medium text-white ${code ? 'mt-1' : ''}`}>{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{team}</p>
    </div>
  );
}

function LoopArrow() {
  return (
    <div className="flex shrink-0 items-center justify-center text-slate-500">
      <ArrowRight className="hidden h-5 w-5 lg:block" />
      <ArrowDown className="h-5 w-5 lg:hidden" />
    </div>
  );
}

/** Команда как система, которую настраивают и обслуживают, а не чинят после поломки. */
export default function EngineeringApproachSection() {
  const { controller, signal, plant, output, feedback } = CONTROL_LOOP;

  return (
    <SectionCard
      title="Инженерный подход"
      subtitle="Почему к машинам мы относимся внимательнее, чем к людям? У станка есть журнал ТО, датчики и запас по нагрузке, а у команды часто только надежда, что само пройдёт. Здесь те же инженерные идеи применены к людям."
    >
      <div className="space-y-8">
        <div>
          <h3 className="font-display text-lg text-white">Команда как контур управления</h3>
          <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-stretch">
            <LoopNode {...controller} />
            <LoopArrow />
            <LoopNode {...signal} />
            <LoopArrow />
            <LoopNode {...plant} />
            <LoopArrow />
            <LoopNode {...output} />
          </div>
          <div className="mt-2 flex items-start gap-3 rounded-3xl border border-dashed border-blue-500/40 bg-blue-500/5 p-4">
            <CornerDownLeft className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />
            <p className="text-sm leading-6 text-slate-300">
              <span className="font-medium text-white">{feedback.title}. </span>
              {feedback.team} Без неё руководитель управляет вслепую.
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-display text-lg text-white">
            Обслуживание: какая периодичность и для чего
          </h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {MAINTENANCE_STRATEGIES.map((item) => (
              <div
                key={item.key}
                className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4"
              >
                <p className="font-medium text-white">{item.title}</p>
                <dl className="mt-3 space-y-2 text-sm leading-6">
                  <div>
                    <dt className="text-xs text-slate-400">У машин</dt>
                    <dd className="text-slate-300">{item.machine}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400">В команде</dt>
                    <dd className="text-slate-300">{item.team}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400">Периодичность</dt>
                    <dd className="text-blue-200">{item.period}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400">На сайте</dt>
                    <dd className="text-slate-300">{item.onSite}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-display text-lg text-white">Жизненный цикл проекта</h3>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {PROJECT_LIFECYCLE.map((item, index) => (
              <li
                key={item.title}
                className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3"
              >
                <p className="text-xs text-slate-400">Шаг {index + 1}</p>
                <p className="mt-1 text-sm font-medium text-white">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">{item.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-sm text-slate-400">
            После коррекции цикл идёт заново: следующая итерация начинается уже с новыми данными.
          </p>
        </div>

        <div>
          <h3 className="font-display text-lg text-white">Как решать задачи и проблемы</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {PROBLEM_SOLVING.map((item) => (
              <div
                key={item.key}
                className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4"
              >
                <p className="font-medium text-white">{item.title}</p>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-300">
                  {item.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Готовые ходы для противоречий — в блоке «Приёмы для сложных ситуаций» ниже.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
