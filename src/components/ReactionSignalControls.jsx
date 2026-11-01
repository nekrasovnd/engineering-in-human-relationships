import { REACTION_SIGNALS } from '../utils/psychDynamics';

/** Входное воздействие: вид, длительность импульса и сила. */
export default function ReactionSignalControls({ signal, onChange }) {
  const activeSignal = REACTION_SIGNALS.find((item) => item.key === signal.type);

  return (
    <div className="space-y-3">
      <div>
        <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-800 bg-slate-950/40 p-1 sm:inline-flex">
          {REACTION_SIGNALS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange({ ...signal, type: item.key })}
              aria-pressed={signal.type === item.key}
              className={`rounded-xl px-3 py-2 text-sm transition ${
                signal.type === item.key
                  ? 'bg-blue-500/15 text-blue-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">{activeSignal.hint}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-slate-300">
          Сила воздействия: {signal.amplitude} кет
          <input
            type="range"
            min="1"
            max="20"
            value={signal.amplitude}
            onChange={(event) => onChange({ ...signal, amplitude: Number(event.target.value) })}
            className="mt-2 w-full accent-blue-500"
          />
        </label>
        {signal.type === 'pulse' ? (
          <label className="block text-sm text-slate-300">
            Длительность: {signal.duration} усл. с
            <input
              type="range"
              min="1"
              max="15"
              value={signal.duration}
              onChange={(event) => onChange({ ...signal, duration: Number(event.target.value) })}
              className="mt-2 w-full accent-blue-500"
            />
          </label>
        ) : null}
      </div>
    </div>
  );
}
