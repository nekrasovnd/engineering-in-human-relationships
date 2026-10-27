/**
 * Тесты правил Firestore для ролей в команде.
 * Запуск: npm run test:rules (поднимает эмулятор Firestore, нужна Java 11+).
 */
// CommonJS: ESM-сборка firebase@10 ломает импорт compat/database в Node.
const { after, before, beforeEach, describe, test } = require('node:test');
const { readFileSync } = require('node:fs');
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require('@firebase/rules-unit-testing');
const {
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  setDoc,
  setLogLevel,
  updateDoc,
  writeBatch,
} = require('firebase/firestore');

// Ожидаемые PERMISSION_DENIED не засоряют вывод.
setLogLevel('silent');

const NOW = '2026-10-28T00:00:00.000Z';
const TEAM_ID = 'team1';

let testEnv;

const snapshot = (userId) => ({ userId, name: userId });

function baseTeam(overrides = {}) {
  return {
    name: 'Команда',
    description: 'Описание',
    goal: 'Работа',
    joinCode: '',
    createdBy: 'owner',
    ownerId: 'owner',
    roles: { owner: 'owner', admin: 'admin', lead: 'lead' },
    memberIds: ['owner', 'admin', 'lead', 'member'],
    memberSnapshots: ['owner', 'admin', 'lead', 'member'].map(snapshot),
    analysis: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

async function seed(path, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
}

function db(uid) {
  return testEnv.authenticatedContext(uid).firestore();
}

function teamRef(uid) {
  return doc(db(uid), 'teams', TEAM_ID);
}

function removePatch(target, team = baseTeam()) {
  const patch = {
    memberIds: team.memberIds.filter((item) => item !== target),
    memberSnapshots: team.memberSnapshots.filter((item) => item.userId !== target),
    analysis: null,
    updatedAt: NOW,
  };

  if (team.roles && Object.hasOwn(team.roles, target)) {
    patch[`roles.${target}`] = deleteField();
  }

  return patch;
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-kod',
    firestore: {
      rules: readFileSync('firebase/firestore.rules', 'utf8'),
    },
  });
});

after(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seed(`teams/${TEAM_ID}`, baseTeam());
});

describe('создание команды', () => {
  test('создатель становится владельцем', async () => {
    await assertSucceeds(
      setDoc(doc(db('alice'), 'teams', 'new'), {
        name: 'Новая',
        description: 'd',
        goal: 'Работа',
        joinCode: '',
        createdBy: 'alice',
        ownerId: 'alice',
        roles: { alice: 'owner' },
        memberIds: ['alice'],
        memberSnapshots: [snapshot('alice')],
        analysis: null,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
  });

  test('нельзя создать команду с чужим владельцем', async () => {
    await assertFails(
      setDoc(doc(db('alice'), 'teams', 'new'), {
        name: 'Новая',
        description: 'd',
        goal: 'Работа',
        joinCode: '',
        createdBy: 'alice',
        ownerId: 'bob',
        roles: { alice: 'owner' },
        memberIds: ['alice'],
        memberSnapshots: [snapshot('alice')],
        analysis: null,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
  });
});

describe('название и описание', () => {
  const patch = { name: 'Переименовали', updatedAt: NOW };

  test('владелец и админ могут менять', async () => {
    await assertSucceeds(updateDoc(teamRef('owner'), patch));
    await assertSucceeds(updateDoc(teamRef('admin'), patch));
  });

  test('тимлид и участник не могут', async () => {
    await assertFails(updateDoc(teamRef('lead'), patch));
    await assertFails(updateDoc(teamRef('member'), patch));
  });

  test('пустое название запрещено', async () => {
    await assertFails(updateDoc(teamRef('owner'), { name: '', updatedAt: NOW }));
  });
});

describe('назначение ролей', () => {
  test('владелец назначает админа', async () => {
    await assertSucceeds(
      updateDoc(teamRef('owner'), { 'roles.member': 'admin', updatedAt: NOW }),
    );
  });

  test('админ назначает тимлида и понижает другого админа', async () => {
    await assertSucceeds(
      updateDoc(teamRef('admin'), { 'roles.member': 'lead', updatedAt: NOW }),
    );
    await seed(`teams/${TEAM_ID}`, baseTeam({ roles: { owner: 'owner', admin: 'admin', lead: 'admin' } }));
    await assertSucceeds(
      updateDoc(teamRef('admin'), { 'roles.lead': deleteField(), updatedAt: NOW }),
    );
  });

  test('админ не может трогать владельца и себя', async () => {
    await assertFails(
      updateDoc(teamRef('admin'), { 'roles.owner': 'member', updatedAt: NOW }),
    );
    await assertFails(
      updateDoc(teamRef('admin'), { 'roles.admin': 'lead', updatedAt: NOW }),
    );
  });

  test('нельзя выдать роль owner через карту ролей', async () => {
    await assertFails(
      updateDoc(teamRef('owner'), { 'roles.member': 'owner', updatedAt: NOW }),
    );
  });

  test('тимлид и участник не назначают роли', async () => {
    await assertFails(
      updateDoc(teamRef('lead'), { 'roles.member': 'lead', updatedAt: NOW }),
    );
    await assertFails(
      updateDoc(teamRef('member'), { 'roles.member': 'admin', updatedAt: NOW }),
    );
  });

  test('нельзя менять две роли за раз', async () => {
    await assertFails(
      updateDoc(teamRef('owner'), {
        'roles.member': 'lead',
        'roles.lead': 'admin',
        updatedAt: NOW,
      }),
    );
  });
});

describe('исключение и выход', () => {
  test('админ исключает участника', async () => {
    await assertSucceeds(updateDoc(teamRef('admin'), removePatch('member')));
  });

  test('админ исключает тимлида вместе с его ролью', async () => {
    await assertSucceeds(updateDoc(teamRef('admin'), removePatch('lead')));
  });

  test('нельзя исключить владельца', async () => {
    await assertFails(updateDoc(teamRef('admin'), removePatch('owner')));
  });

  test('роль исключённого обязана удалиться', async () => {
    const patch = removePatch('lead');
    delete patch['roles.lead'];
    await assertFails(updateDoc(teamRef('owner'), patch));
  });

  test('тимлид не может исключать', async () => {
    await assertFails(updateDoc(teamRef('lead'), removePatch('member')));
  });

  test('участник может выйти сам', async () => {
    await assertSucceeds(updateDoc(teamRef('member'), removePatch('member')));
  });

  test('владелец не может выйти без передачи владения', async () => {
    await assertFails(updateDoc(teamRef('owner'), removePatch('owner')));
  });
});

describe('передача владения и удаление', () => {
  test('владелец передаёт владение и становится админом', async () => {
    await assertSucceeds(
      updateDoc(teamRef('owner'), {
        ownerId: 'member',
        'roles.member': 'owner',
        'roles.owner': 'admin',
        updatedAt: NOW,
      }),
    );
    // Бывший владелец теперь админ и может быть понижен новым владельцем.
    await assertSucceeds(
      updateDoc(teamRef('member'), { 'roles.owner': deleteField(), updatedAt: NOW }),
    );
  });

  test('админ не может передать владение', async () => {
    await assertFails(
      updateDoc(teamRef('admin'), {
        ownerId: 'admin',
        'roles.admin': 'owner',
        'roles.owner': 'admin',
        updatedAt: NOW,
      }),
    );
  });

  test('удалить команду может только владелец', async () => {
    await assertFails(deleteDoc(teamRef('admin')));
    await assertSucceeds(deleteDoc(teamRef('owner')));
  });

  test('при удалении выключается код, созданный админом', async () => {
    await seed(`teams/${TEAM_ID}`, baseTeam({ joinCode: 'CODE1234' }));
    await seed('teamJoinCodes/CODE1234', {
      code: 'CODE1234',
      teamId: TEAM_ID,
      teamName: 'Команда',
      teamDescription: 'Описание',
      teamGoal: 'Работа',
      createdBy: 'admin',
      createdByName: 'admin',
      createdByAvatarInitials: 'A',
      active: true,
      createdAt: NOW,
      updatedAt: NOW,
    });

    const firestore = db('owner');
    const batch = writeBatch(firestore);
    batch.delete(doc(firestore, 'teams', TEAM_ID));
    batch.update(doc(firestore, 'teamJoinCodes', 'CODE1234'), {
      active: false,
      updatedAt: NOW,
    });
    await assertSucceeds(batch.commit());
  });
});

describe('старые команды без ownerId и roles', () => {
  beforeEach(async () => {
    const legacy = baseTeam();
    delete legacy.ownerId;
    delete legacy.roles;
    await seed(`teams/${TEAM_ID}`, legacy);
  });

  test('создатель считается владельцем', async () => {
    await assertSucceeds(
      updateDoc(teamRef('owner'), { 'roles.member': 'admin', updatedAt: NOW }),
    );
    await assertSucceeds(updateDoc(teamRef('owner'), { name: 'Новое', updatedAt: NOW }));
  });

  test('остальные считаются участниками', async () => {
    await assertFails(updateDoc(teamRef('admin'), { name: 'Новое', updatedAt: NOW }));
  });
});

describe('приглашения', () => {
  function directInvite(fromUid, toUid) {
    return {
      teamId: TEAM_ID,
      teamName: 'Команда',
      teamDescription: 'Описание',
      teamGoal: 'Работа',
      fromUid,
      fromName: fromUid,
      fromAvatarInitials: 'X',
      toUid,
      toName: toUid,
      toAvatarInitials: 'Y',
      status: 'pending',
      source: 'direct',
      joinCode: null,
      createdAt: NOW,
      updatedAt: NOW,
    };
  }

  test('админ приглашает в существующую команду, тимлид — нет', async () => {
    await assertSucceeds(
      setDoc(doc(db('admin'), 'teamInvites', `${TEAM_ID}_newbie`), directInvite('admin', 'newbie')),
    );
    await assertFails(
      setDoc(doc(db('lead'), 'teamInvites', `${TEAM_ID}_other`), directInvite('lead', 'other')),
    );
  });

  test('нельзя пригласить того, кто уже в команде', async () => {
    await assertFails(
      setDoc(doc(db('owner'), 'teamInvites', `${TEAM_ID}_member`), directInvite('owner', 'member')),
    );
  });

  test('повторное приглашение после отказа', async () => {
    await seed(`teamInvites/${TEAM_ID}_newbie`, {
      ...directInvite('owner', 'newbie'),
      status: 'declined',
    });
    await assertSucceeds(
      setDoc(doc(db('admin'), 'teamInvites', `${TEAM_ID}_newbie`), directInvite('admin', 'newbie')),
    );
  });

  test('админ создаёт код команды', async () => {
    const firestore = db('admin');
    const batch = writeBatch(firestore);
    batch.set(doc(firestore, 'teams', TEAM_ID), { joinCode: 'NEWCODE1', updatedAt: NOW }, { merge: true });
    batch.set(doc(firestore, 'teamJoinCodes', 'NEWCODE1'), {
      code: 'NEWCODE1',
      teamId: TEAM_ID,
      teamName: 'Команда',
      teamDescription: 'Описание',
      teamGoal: 'Работа',
      createdBy: 'admin',
      createdByName: 'admin',
      createdByAvatarInitials: 'A',
      active: true,
      createdAt: NOW,
      updatedAt: NOW,
    });
    await assertSucceeds(batch.commit());
  });

  test('исключённый не может читать команду, но может заново подать заявку по коду', async () => {
    await seed(`teams/${TEAM_ID}`, baseTeam({
      joinCode: 'CODE1234',
      memberIds: ['owner', 'admin', 'lead'],
      memberSnapshots: ['owner', 'admin', 'lead'].map(snapshot),
    }));
    await seed('teamJoinCodes/CODE1234', {
      code: 'CODE1234',
      teamId: TEAM_ID,
      teamName: 'Команда',
      teamDescription: 'Описание',
      teamGoal: 'Работа',
      createdBy: 'owner',
      createdByName: 'owner',
      createdByAvatarInitials: 'O',
      active: true,
      createdAt: NOW,
      updatedAt: NOW,
    });
    await seed(`teamInvites/${TEAM_ID}_member`, {
      ...directInvite('owner', 'member'),
      status: 'accepted',
    });

    await assertFails(getDoc(teamRef('member')));
    await assertSucceeds(
      setDoc(doc(db('member'), 'teamInvites', `${TEAM_ID}_member`), {
        ...directInvite('owner', 'member'),
        fromName: 'owner',
        fromAvatarInitials: 'O',
        source: 'code',
        joinCode: 'CODE1234',
      }),
    );
  });
});

describe('синхронизация профиля участника', () => {
  test('участник обновляет свой снапшот', async () => {
    await assertSucceeds(
      updateDoc(teamRef('member'), {
        memberSnapshots: ['owner', 'admin', 'lead'].map(snapshot).concat({ userId: 'member', name: 'Новое имя' }),
        analysis: null,
        updatedAt: NOW,
      }),
    );
  });
});
