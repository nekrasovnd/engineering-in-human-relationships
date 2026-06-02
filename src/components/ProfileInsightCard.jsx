import { buildProfileNarrative } from '../utils/profileAnalysis';
import SectionCard from './SectionCard';

export default function ProfileInsightCard({ profile }) {
  const narrative = buildProfileNarrative(profile);

  return (
    <SectionCard
      title="Психологический разбор"
      subtitle="Текстовый вывод имитирует заключение аналитического ассистента и опирается только на локальные вычисления."
    >
      <p className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm leading-7 text-slate-200">
        {narrative.summary}
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">
            Сильные стороны
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
            {narrative.strengths.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-300">
            Уязвимости
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
            {narrative.risks.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-blue-300">
            Поведение в команде
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-200">
            {narrative.teamPrediction}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
