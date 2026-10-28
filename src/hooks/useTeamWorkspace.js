import { useEffect, useMemo, useState } from 'react';
import { useFriendsData } from './useFriendsData';
import { useMutualMatches } from './useMutualMatches';
import { useTeams } from './useTeams';
import {
  deleteTeam,
  ensureTeamJoinCode,
  inviteMembersToTeam,
  leaveTeam,
  removeTeamMember,
  setTeamMemberRole,
  transferTeamOwnership,
  updateTeamInfo,
} from '../services/firestore';
import { copyTextToClipboard } from '../utils/clipboard';
import { canUseDiscover } from '../utils/profileState';
import { mergeInviteCandidates } from '../utils/teamSelection';
import {
  canManageMember,
  canTeamMember,
  compareMembersByRole,
  getTeamOwnerId,
  getTeamRole,
} from '../utils/teamRoles';

function buildInfoForm(team) {
  return {
    name: team?.name || '',
    description: team?.description || '',
    goal: team?.goal || '',
  };
}

function getActionErrorMessage(actionError, fallback) {
  if (actionError?.message === 'team-permission-denied') {
    return 'У вашей роли нет прав на это действие.';
  }

  if (actionError?.message === 'invalid-team-info') {
    return 'Укажите название и описание команды.';
  }

  if (actionError?.message === 'team-not-found') {
    return 'Команда уже удалена.';
  }

  return fallback;
}

/**
 * Состояние страницы одной команды: участники, роли, приглашения, настройки.
 * Команда берётся из общей подписки useTeams — если пользователя исключили,
 * она исчезнет из списка и страница покажет «команда недоступна».
 */
export function useTeamWorkspace(teamId, profile) {
  const { teams, loading } = useTeams(profile.userId);
  const team = useMemo(
    () => teams.find((item) => item.id === teamId) || null,
    [teamId, teams],
  );
  const myRole = getTeamRole(team, profile.userId);
  const can = useMemo(
    () => ({
      editInfo: canTeamMember(team, profile.userId, 'editInfo'),
      invite: canTeamMember(team, profile.userId, 'invite'),
      manageMembers: canTeamMember(team, profile.userId, 'manageMembers'),
      transferOwnership: canTeamMember(team, profile.userId, 'transferOwnership'),
      deleteTeam: canTeamMember(team, profile.userId, 'deleteTeam'),
      leave: canTeamMember(team, profile.userId, 'leave'),
    }),
    [profile.userId, team],
  );
  const { mutualMatches, loading: matchesLoading } = useMutualMatches(
    profile.userId,
    { enabled: can.invite && canUseDiscover(profile) },
  );
  const { friends, loading: friendsLoading } = useFriendsData(profile.userId);

  const [infoForm, setInfoForm] = useState(() => buildInfoForm(team));
  const [inviteeIds, setInviteeIds] = useState([]);
  const [busyAction, setBusyAction] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [codeCopyState, setCodeCopyState] = useState('');

  // Подтягиваем форму, когда документ команды пришёл или изменился снаружи.
  useEffect(() => {
    setInfoForm(buildInfoForm(team));
  }, [team?.name, team?.description, team?.goal]);

  useEffect(() => {
    if (!notice && !error) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setNotice('');
      setError('');
    }, 4000);
    return () => window.clearTimeout(timeoutId);
  }, [error, notice]);

  useEffect(() => {
    if (!codeCopyState) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setCodeCopyState(''), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [codeCopyState]);

  const members = useMemo(
    () =>
      team
        ? [...team.memberSnapshots].sort(compareMembersByRole(team))
        : [],
    [team],
  );
  const invitableMatches = useMemo(
    () =>
      team
        ? mergeInviteCandidates(
            mutualMatches,
            friends.map((item) => item.profile),
          ).filter((item) => !team.memberIds.includes(item.userId))
        : [],
    [friends, mutualMatches, team],
  );
  const infoDirty =
    Boolean(team) &&
    (infoForm.name.trim() !== team.name ||
      infoForm.description.trim() !== team.description ||
      infoForm.goal !== team.goal);

  const runAction = async (actionKey, action, fallbackError) => {
    setError('');
    setNotice('');

    try {
      setBusyAction(actionKey);
      return await action();
    } catch (actionError) {
      setError(getActionErrorMessage(actionError, fallbackError));
      return undefined;
    } finally {
      setBusyAction('');
    }
  };

  const updateInfoField = (key, value) => {
    setInfoForm((current) => ({ ...current, [key]: value }));
  };

  const saveInfo = () =>
    runAction(
      'info',
      async () => {
        await updateTeamInfo(team, profile.userId, infoForm);
        setNotice('Данные команды сохранены.');
      },
      'Не удалось сохранить данные команды.',
    );

  const changeMemberRole = (memberId, role) =>
    runAction(
      `role:${memberId}`,
      () => setTeamMemberRole(team.id, profile.userId, memberId, role),
      'Не удалось изменить роль.',
    );

  const removeMember = (member) => {
    if (!window.confirm(`Исключить ${member.name} из команды «${team.name}»?`)) {
      return undefined;
    }

    return runAction(
      `remove:${member.userId}`,
      () => removeTeamMember(team.id, profile.userId, member.userId),
      'Не удалось исключить участника.',
    );
  };

  const transferOwnership = (member) => {
    if (
      !window.confirm(
        `Передать владение командой ${member.name}? Вы станете администратором.`,
      )
    ) {
      return undefined;
    }

    return runAction(
      `transfer:${member.userId}`,
      async () => {
        await transferTeamOwnership(team.id, profile.userId, member.userId);
        setNotice(`Теперь владелец команды — ${member.name}.`);
      },
      'Не удалось передать владение.',
    );
  };

  const leave = async () => {
    if (!window.confirm(`Выйти из команды «${team.name}»?`)) {
      return false;
    }

    const result = await runAction(
      'leave',
      async () => {
        await leaveTeam(team.id, profile.userId);
        return true;
      },
      'Не удалось выйти из команды.',
    );

    return result === true;
  };

  const removeTeam = async () => {
    if (
      !window.confirm(
        `Удалить команду «${team.name}» для всех участников? Это нельзя отменить.`,
      )
    ) {
      return false;
    }

    const result = await runAction(
      'delete',
      async () => {
        await deleteTeam(team, profile.userId);
        return true;
      },
      'Не удалось удалить команду.',
    );

    return result === true;
  };

  const generateCode = () =>
    runAction(
      'code',
      () => ensureTeamJoinCode(team, profile),
      'Не удалось создать код приглашения.',
    );

  const copyCode = async () => {
    const copied = await copyTextToClipboard(team.joinCode).catch(() => false);
    setCodeCopyState(copied ? 'copied' : 'failed');
  };

  const toggleInvitee = (userId) => {
    setInviteeIds((current) =>
      current.includes(userId)
        ? current.filter((item) => item !== userId)
        : [...current, userId],
    );
  };

  const sendInvites = () =>
    runAction(
      'invite',
      async () => {
        const invitedCount = await inviteMembersToTeam(
          team,
          profile,
          invitableMatches.filter((item) => inviteeIds.includes(item.userId)),
        );
        setInviteeIds([]);
        setNotice(
          invitedCount > 0
            ? `Отправлено приглашений: ${invitedCount}.`
            : 'Выберите, кого пригласить.',
        );
      },
      'Не удалось отправить приглашения.',
    );

  return {
    loading,
    team,
    myRole,
    ownerId: getTeamOwnerId(team),
    can,
    canManage: (memberId) => canManageMember(team, profile.userId, memberId),
    members,
    infoForm,
    infoDirty,
    invitableMatches,
    matchesLoading: matchesLoading || friendsLoading,
    inviteeIds,
    busyAction,
    error,
    notice,
    codeCopyState,
    showError: (message) => {
      setNotice('');
      setError(message);
    },
    showNotice: (message) => {
      setError('');
      setNotice(message);
    },
    updateInfoField,
    saveInfo,
    changeMemberRole,
    removeMember,
    transferOwnership,
    leave,
    removeTeam,
    generateCode,
    copyCode,
    toggleInvitee,
    sendInvites,
  };
}
