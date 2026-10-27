import { Plus } from 'lucide-react';
import IterationProgress from './IterationProgress';
import SectionCard from './SectionCard';

const INPUT_CLASS =
  'w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-blue-400';

function IterationForm({ planning }) {
  const {
    editingIterationId,
    iterationForm,
    busyAction,
    updateIterationField,
    saveIteration,
    closeIterationForm,
  } = planning;

  return (
    <form
      className="mb-5 space-y-4 rounded-3xl border border-blue-500/30 bg-slate-950/40 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        saveIteration();
      }}
    >
      <p className="text-sm font-medium text-white">
        {editingIterationId === 'new' ? 'Новая итерация' : 'Редактирование итерации'}
      </p>
      <label className="block">
        <span className="mb-2 block text-sm text-slate-300">Название</span>
        <input
          type="text"
          value={iterationForm.title}
          onChange={(event) => updateIterationField('title', event.target.value)}
          maxLength={200}
          className={INPUT_CLASS}
          placeholder="Например, Итерация 1 — прототип"
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm text-slate-300">Цель итерации</span>
        <textarea
          value={iterationForm.goal}
          onChange={(event) => updateIterationField('goal', event.target.value)}
          rows="2"
          maxLength={2000}
          className={INPUT_CLASS}
          placeholder="Какой результат команда должна показать к дедлайну."
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">Начало</span>
          <input
            type="date"
            value={iterationForm.startDate}
            onChange={(event) => updateIterationField('startDate', event.target.value)}
            className={INPUT_CLASS}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">Дедлайн</span>
          <input
            type="date"
            value={iterationForm.deadline}
            min={iterationForm.startDate || undefined}
            onChange={(event) => updateIterationField('deadline', event.target.value)}
            className={INPUT_CLASS}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busyAction === 'iteration-save'}
          className="rounded-2xl bg-blue-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busyAction === 'iteration-save' ? 'Сохраняем...' : 'Сохранить'}
        </button>
        <button
          type="button"
          onClick={closeIterationForm}
          className="rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-200 transition hover:border-blue-400 hover:text-white"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}

export default function TeamIterationsPanel({ planning, onShowTasks }) {
  const {
    loading,
    can,
    iterations,
    tasks,
    busyAction,
    editingIterationId,
    openNewIteration,
    openIteration,
    toggleIterationStatus,
    removeIteration,
  } = planning;

  return (
    <SectionCard
      title="Итерации"
      subtitle="Работа идёт короткими итерациями с дедлайном, как в TeamProject. После закрытия итерации её результаты можно разобрать всей командой."
      action={
        can.setDeadlines && !editingIterationId ? (
          <button
            type="button"
            onClick={openNewIteration}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-400"
          >
            <Plus className="h-4 w-4" />
            Новая итерация
          </button>
        ) : null
      }
    >
      {editingIterationId ? <IterationForm planning={planning} /> : null}

      {loading ? (
        <p className="text-sm text-slate-400">Загружаем итерации...</p>
      ) : iterations.length === 0 ? (
        <p className="text-sm leading-7 text-slate-400">
          {can.setDeadlines
            ? 'Итераций пока нет. Создайте первую: название, цель и дедлайн.'
            : 'Итераций пока нет — их создают владелец, админы или тимлид.'}
        </p>
      ) : (
        <div className="space-y-4">
          {iterations.map((iteration) => (
            <div
              key={iteration.id}
              className={`rounded-3xl border p-5 ${
                iteration.status === 'closed'
                  ? 'border-slate-800 bg-slate-950/20'
                  : 'border-slate-800 bg-slate-950/40'
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg text-white">{iteration.title}</p>
                  {iteration.goal ? (
                    <p className="mt-1 text-sm leading-6 text-slate-300">{iteration.goal}</p>
                  ) : null}
                  <div className="mt-3">
                    <IterationProgress iteration={iteration} tasks={tasks} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onShowTasks(iteration.id)}
                    className="rounded-2xl border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-blue-400 hover:text-white"
                  >
                    Задачи
                  </button>
                  {can.setDeadlines ? (
                    <>
                      <button
                        type="button"
                        onClick={() => openIteration(iteration)}
                        className="rounded-2xl border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-blue-400 hover:text-white"
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleIterationStatus(iteration)}
                        disabled={busyAction === `iteration-status:${iteration.id}`}
                        className="rounded-2xl border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-sm text-blue-100 transition hover:bg-blue-500/20 disabled:opacity-60"
                      >
                        {iteration.status === 'active' ? 'Закрыть' : 'Открыть снова'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeIteration(iteration)}
                        disabled={busyAction === `iteration-delete:${iteration.id}`}
                        className="rounded-2xl border border-rose-500/40 px-3 py-2 text-sm text-rose-200 transition hover:bg-rose-500/10 disabled:opacity-60"
                      >
                        Удалить
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
