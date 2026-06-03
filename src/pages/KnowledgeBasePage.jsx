import { useMemo, useState } from 'react';
import { searchKnowledge } from '../utils/trizKnowledge';
import SectionCard from '../components/SectionCard';

export default function KnowledgeBasePage() {
  const [query, setQuery] = useState('');
  const knowledge = useMemo(() => searchKnowledge(query), [query]);

  return (
    <div className="space-y-6">
      <SectionCard
        title="Гид по общению и совместимости"
        subtitle="Здесь собраны идеи, которые помогают быстрее понять напряжение, роли и рабочие ходы."
      >
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-blue-400"
          placeholder="Поиск по темам, ролям, конфликтам и приёмам"
        />
      </SectionCard>

      <SectionCard
        title="Если нужна быстрая идея"
        subtitle="Это короткие приёмы, которые можно взять в разговор, команду или спор без долгой теории."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {knowledge.teamExamples.slice(0, 4).map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5 text-sm leading-7 text-slate-300"
            >
              {item}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Приёмы для сложных ситуаций">
        <div className="grid gap-4 xl:grid-cols-2">
          {knowledge.principles.map((principle) => (
            <div
              key={principle.id}
              className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-blue-300">
                Принцип {principle.id}
              </p>
              <p className="mt-2 font-display text-xl text-white">
                {principle.title}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {principle.summary}
              </p>
              <p className="mt-3 text-sm leading-7 text-cyan-200">
                {principle.teamExample}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Что можно заметить в поведении">
        <div className="grid gap-4 md:grid-cols-2">
          {knowledge.analogies.map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5 text-sm leading-7 text-slate-300"
            >
              {item}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Законы и наблюдения">
        <div className="grid gap-4 md:grid-cols-2">
          {knowledge.laws.map((law) => (
            <div
              key={law.id}
              className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5"
            >
              <p className="font-display text-xl text-white">{law.title}</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">{law.summary}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Ещё примеры для команд">
        <div className="grid gap-4 md:grid-cols-2">
          {knowledge.teamExamples.map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5 text-sm leading-7 text-slate-300"
            >
              {item}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
