import SectionCard from './SectionCard';
import { buildInstructionLines } from '../utils/profileAnalysis';

export default function InstructionCard() {
  const lines = buildInstructionLines();

  return (
    <SectionCard
      title="Быстро и по делу"
      subtitle="Короткая памятка, чтобы не вспоминать логику разделов каждый раз заново."
      className="bg-gradient-to-br from-slate-900/90 to-blue-950/60"
    >
      <div className="space-y-3">
        {lines.map((line, index) => (
          <div
            key={line}
            className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
          >
            <p className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/10 text-xs font-medium text-blue-200">
              {index + 1}
            </p>
            <p className="pt-1 text-sm leading-6 text-slate-200">{line}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
