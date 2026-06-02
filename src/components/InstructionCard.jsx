import SectionCard from './SectionCard';
import { buildInstructionLines } from '../utils/profileAnalysis';

export default function InstructionCard() {
  const lines = buildInstructionLines();

  return (
    <SectionCard
      title="Как пользоваться"
      subtitle="Мини-инструкция остаётся на главной странице профиля и помогает быстро войти в ритм приложения."
      className="bg-gradient-to-br from-slate-900/90 to-blue-950/60"
    >
      <div className="grid gap-3 md:grid-cols-3">
        {lines.map((line, index) => (
          <div
            key={line}
            className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-blue-300/80">
              Шаг {index + 1}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-200">{line}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
