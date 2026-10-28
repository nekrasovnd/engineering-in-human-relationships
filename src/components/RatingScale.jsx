import { RATING_VALUES } from '../utils/teamFeedback';

/** Шкала 1–5 кнопками (радиогруппа). */
export default function RatingScale({ value, onChange, label, lowLabel, highLabel }) {
  return (
    <div>
      <div role="radiogroup" aria-label={label} className="flex gap-1.5">
        {RATING_VALUES.map((rating) => {
          const selected = value === rating;
          return (
            <button
              key={rating}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(rating)}
              className={`h-9 w-9 rounded-xl border text-sm transition ${
                selected
                  ? 'border-blue-400 bg-blue-500 text-white'
                  : 'border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              {rating}
            </button>
          );
        })}
      </div>
      {lowLabel || highLabel ? (
        <div className="mt-1 flex max-w-[13.5rem] justify-between text-[11px] text-slate-500">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
