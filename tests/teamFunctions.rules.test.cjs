/**
 * Тесты правил Firestore для ролей в работе и квалификации.
 * Запуск: npm run test:rules.
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
  deleteField,
  doc,
  setDoc,
  setLogLevel,
  updateDoc,
} = require('firebase/firestore');

// Ожидаемые PERMISSION_DENIED не засоряют вывод.
setLogLevel('silent');

const NOW = '2026-10-28T00:00:00.000Z';
const TEAM_ID = 'team1';
const MEMBERS = ['owner', 'admin', 'lead', 'member'];

let testEnv;

const team = {
  name: 'Команда',
  description: 'Описание',
  goal: 'Работа',
  joinCode: '',
  createdBy: 'owner',
  ownerId: 'owner',
  roles: { owner: 'owner', admin: 'admin', lead: 'lead' },
  functionalRoles: { lead: 'analyst' },
  qualifications: { lead: 'middle' },
  memberIds: MEMBERS,
  memberSnapshots: MEMBERS.map((userId) => ({ userId, name: userId })),
  analysis: null,
  createdAt: NOW,
  updatedAt: NOW,
};

function teamRef(uid) {
  return doc(testEnv.authenticatedContext(uid).firestore(), 'teams', TEAM_ID);
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-kod-functions',
    firestore: {
      rules: readFileSync('firebase/firestore.rules', 'utf8'),
    },
  });
});

after(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'teams', TEAM_ID), team);
  });
});

describe('роли в работе', () => {
  test('владелец и админ назначают роль и уровень', async () => {
    await assertSucceeds(
      updateDoc(teamRef('owner'), {
        'functionalRoles.member': 'developer',
        'qualifications.member': 'junior',
        updatedAt: NOW,
      }),
    );
    await assertSucceeds(
      updateDoc(teamRef('admin'), {
        'functionalRoles.owner': 'hr',
        'qualifications.owner': 'senior',
        updatedAt: NOW,
      }),
    );
  });

  test('можно распределить сразу нескольких и снять роль', async () => {
    await assertSucceeds(
      updateDoc(teamRef('admin'), {
        'functionalRoles.admin': 'researcher',
        'functionalRoles.member': 'developer',
        'functionalRoles.lead': deleteField(),
        updatedAt: NOW,
      }),
    );
  });

  test('работает для старой команды без карт', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const { functionalRoles, qualifications, ...legacy } = team;
      await setDoc(doc(context.firestore(), 'teams', TEAM_ID), legacy);
    });
    await assertSucceeds(
      updateDoc(teamRef('owner'), { 'functionalRoles.member': 'analyst', updatedAt: NOW }),
    );
  });

  test('тимлид и участник не назначают', async () => {
    await assertFails(
      updateDoc(teamRef('lead'), { 'functionalRoles.member': 'developer', updatedAt: NOW }),
    );
    await assertFails(
      updateDoc(teamRef('member'), { 'qualifications.member': 'senior', updatedAt: NOW }),
    );
  });

  test('неизвестные роль и уровень запрещены', async () => {
    await assertFails(
      updateDoc(teamRef('owner'), { 'functionalRoles.member': 'designer', updatedAt: NOW }),
    );
    await assertFails(
      updateDoc(teamRef('owner'), { 'qualifications.member': 'lead', updatedAt: NOW }),
    );
  });

  test('нельзя назначить не участнику', async () => {
    await assertFails(
      updateDoc(teamRef('owner'), { 'functionalRoles.stranger': 'analyst', updatedAt: NOW }),
    );
  });

  test('нельзя заодно поменять права или название', async () => {
    await assertFails(
      updateDoc(teamRef('owner'), {
        'functionalRoles.member': 'analyst',
        'roles.member': 'admin',
        updatedAt: NOW,
      }),
    );
    await assertFails(
      updateDoc(teamRef('owner'), {
        'functionalRoles.member': 'analyst',
        name: 'Другое',
        updatedAt: NOW,
      }),
    );
  });

  test('при исключении роль в работе удаляется вместе с участником', async () => {
    await assertSucceeds(
      updateDoc(teamRef('admin'), {
        memberIds: MEMBERS.filter((item) => item !== 'lead'),
        memberSnapshots: team.memberSnapshots.filter((item) => item.userId !== 'lead'),
        analysis: null,
        'roles.lead': deleteField(),
        'functionalRoles.lead': deleteField(),
        'qualifications.lead': deleteField(),
        updatedAt: NOW,
      }),
    );
  });

  test('при исключении нельзя трогать роли других', async () => {
    await assertFails(
      updateDoc(teamRef('admin'), {
        memberIds: MEMBERS.filter((item) => item !== 'member'),
        memberSnapshots: team.memberSnapshots.filter((item) => item.userId !== 'member'),
        analysis: null,
        'functionalRoles.lead': deleteField(),
        updatedAt: NOW,
      }),
    );
  });
});
