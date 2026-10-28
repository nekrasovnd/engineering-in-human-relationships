import { useMemo, useState } from 'react';
import { hasComparableProfileData } from '../utils/compatibility';
import { MAX_SELECTION_CANDIDATES, findBestGroups } from '../utils/teamSelection';

/**
 * Блок «Подбор команды»: HR отмечает кандидатов (друзей и совпадения),
 * задаёт размер — и получает лучшие составы.
 */
export function useTeamSelection(profile, candidates) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [size, setSize] = useState(4);
  const [includeMe, setIncludeMe] = useState(true);

  const comparable = useMemo(
    () => candidates.filter(hasComparableProfileData),
    [candidates],
  );
  const selected = useMemo(
    () => comparable.filter((item) => selectedIds.includes(item.userId)),
    [comparable, selectedIds],
  );
  const canIncludeMe = hasComparableProfileData(profile);
  const anchor = includeMe && canIncludeMe ? profile : null;
  const neededCount = anchor ? size - 1 : size;

  const groups = useMemo(
    () => (selected.length >= neededCount ? findBestGroups(selected, { size, anchor }) : []),
    [anchor, neededCount, selected, size],
  );

  const toggleCandidate = (userId) => {
    setSelectedIds((current) => {
      if (current.includes(userId)) {
        return current.filter((item) => item !== userId);
      }

      return current.length >= MAX_SELECTION_CANDIDATES ? current : [...current, userId];
    });
  };

  const selectAll = () =>
    setSelectedIds(comparable.slice(0, MAX_SELECTION_CANDIDATES).map((item) => item.userId));

  return {
    candidates: comparable,
    selectedIds,
    size,
    includeMe: Boolean(anchor),
    canIncludeMe,
    neededCount,
    groups,
    setSize,
    setIncludeMe,
    toggleCandidate,
    selectAll,
    clearSelection: () => setSelectedIds([]),
  };
}
