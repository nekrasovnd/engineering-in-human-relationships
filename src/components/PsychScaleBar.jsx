import {
  FRUSTRATION_NORM,
  PSYCH_SCALES,
  PSYCH_SCALE_MAX,
  getPsychLevel,
} from '../utils/psychDynamics';

/** Шкала R, F или A: балл 0–20; у фрустрации отмечен порог F0. */
export default function PsychScaleBar({ scale, score }) {
  const { label, description } = PSYCH_SCALES[scale];

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-white">
          {label} <span className="text-slate-400">({scale})</span>
        </p>
        <p className="text-sm text-slate-300">
          {score} из {PSYCH_SCALE_MAX} · {getPsychLevel(score)}
        </p>
      </div>
      <div className="relative mt-2 h-2 rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-blue-500"
          style={{ width: `${(score / PSYCH_SCALE_MAX) * 100}%` }}
        />
        {scale === 'F' ? (
          <span
            title={`Порог F0 = ${FRUSTRATION_NORM}`}
            className="absolute -top-1 h-4 w-0.5 bg-slate-400"
            style={{ left: `${(FRUSTRATION_NORM / PSYCH_SCALE_MAX) * 100}%` }}
          />
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}
