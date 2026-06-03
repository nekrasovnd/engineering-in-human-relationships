import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProfiles } from '../hooks/useProfiles';
import { calculateCompatibility } from '../utils/compatibility';
import ComparisonResultCard from '../components/ComparisonResultCard';
import SectionCard from '../components/SectionCard';

export default function ComparePage() {
  const { profile } = useAuth();
  const { profiles, loading } = useProfiles(profile.userId, { excludeCurrent: true });
  const [selectedId, setSelectedId] = useState('');

  const selectedProfile = useMemo(
    () => profiles.find((item) => item.userId === selectedId) || null,
    [profiles, selectedId],
  );

  const comparison = selectedProfile
    ? calculateCompatibility(profile, selectedProfile)
    : null;

  return (
    <div className="space-y-6">
      <SectionCard
        title="Сравнение пользователей"
        subtitle="Выберите человека и посмотрите совместимость, риск конфликта и рекомендации."
      >
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Кандидат для сравнения
            </p>

            {loading ? (
              <p className="mt-4 text-sm text-slate-400">Загружаем список профилей...</p>
            ) : profiles.length === 0 ? (
              <p className="mt-4 text-sm leading-6 text-slate-400">
                Пока нет других пользователей с завершённым профилем.
              </p>
            ) : (
              <>
                <select
                  value={selectedId}
                  onChange={(event) => setSelectedId(event.target.value)}
                  className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-blue-400"
                >
                  <option value="">Выберите пользователя</option>
                  {profiles.map((item) => (
                    <option key={item.userId} value={item.userId}>
                      {item.name} · {item.egoState}
                    </option>
                  ))}
                </select>

                <div className="mt-5 space-y-3">
                  {profiles.slice(0, 6).map((item) => {
                    const quick = calculateCompatibility(profile, item);
                    return (
                      <button
                        key={item.userId}
                        type="button"
                        onClick={() => setSelectedId(item.userId)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          selectedId === item.userId
                            ? 'border-blue-400 bg-blue-500/10'
                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-white">{item.name}</p>
                            <p className="mt-1 text-sm text-slate-400">
                              {item.egoState}
                            </p>
                          </div>
                          <span className="rounded-full bg-slate-950/80 px-3 py-1 text-xs text-blue-200">
                            {quick.compatibility}%
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/20 p-5">
            <p className="font-display text-2xl text-white">
              Что учитывает алгоритм
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
              <li>• Весовой евклидов расчёт по 8 факторам.</li>
              <li>• Нейротизм и доминантность имеют двойной вес.</li>
              <li>
                • Высокий конфликт: разница по нейротизму больше 4 или оба
                пользователя доминантны выше 7.
              </li>
              <li>• Итог “Да / Условно / Нет” строится поверх совместимости и риска.</li>
            </ul>
          </div>
        </div>
      </SectionCard>

      {selectedProfile && comparison ? (
        <ComparisonResultCard
          firstProfile={profile}
          secondProfile={selectedProfile}
          comparison={comparison}
        />
      ) : null}
    </div>
  );
}
