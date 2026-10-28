import { useMemo, useState } from 'react';
import { setTeamMemberFunctions } from '../services/firestore';
import { buildFunctionHints, getFunctionalRoleLabel } from '../utils/teamFunctions';
import { canTeamMember } from '../utils/teamRoles';

/**
 * Вкладка «Роли»: роли в работе, квалификация и подсказки по анкете.
 * Назначают владелец и админы, остальные только смотрят.
 */
export function useTeamFunctions(team, profile, members, { onError, onNotice }) {
  const canAssign = canTeamMember(team, profile.userId, 'assignFunctions');
  const [busyAction, setBusyAction] = useState('');
  const hints = useMemo(() => buildFunctionHints(team, members), [members, team]);

  const save = async (actionKey, changes, successMessage) => {
    try {
      setBusyAction(actionKey);
      await setTeamMemberFunctions(team, profile.userId, changes);
      if (successMessage) {
        onNotice(successMessage);
      }
    } catch (saveError) {
      onError(
        saveError?.message === 'team-permission-denied'
          ? 'У вашей роли нет прав на это действие.'
          : 'Не удалось сохранить роль.',
      );
    } finally {
      setBusyAction('');
    }
  };

  const setMemberRole = (userId, functionalRole) =>
    save(`function:${userId}`, [{ userId, functionalRole }]);

  const setMemberQualification = (userId, qualification) =>
    save(`function:${userId}`, [{ userId, qualification }]);

  const applySuggestion = (row) =>
    save(
      `function:${row.userId}`,
      [{ userId: row.userId, functionalRole: row.hintRole }],
      `${row.name}: роль «${getFunctionalRoleLabel(row.hintRole)}».`,
    );

  const applyAllSuggestions = () => {
    const changes = Object.entries(hints.unassignedSuggestions).map(
      ([userId, functionalRole]) => ({ userId, functionalRole }),
    );

    return save('function:all', changes, `Роли распределены: ${changes.length}.`);
  };

  return {
    canAssign,
    busyAction,
    ...hints,
    setMemberRole,
    setMemberQualification,
    applySuggestion,
    applyAllSuggestions,
  };
}
