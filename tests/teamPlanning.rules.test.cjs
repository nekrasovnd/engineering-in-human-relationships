/**
 * Тесты правил Firestore для итераций и задач команды.
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
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  setLogLevel,
  updateDoc,
} = require('firebase/firestore');

// Ожидаемые PERMISSION_DENIED не засоряют вывод.
setLogLevel('silent');

const NOW = '2026-10-28T00:00:00.000Z';
const TEAM_ID = 'team1';
const TASK_PATH = `teams/${TEAM_ID}/tasks/task1`;
const ITERATION_PATH = `teams/${TEAM_ID}/iterations/iter1`;

let testEnv;

const team = {
  name: 'Команда',
  description: 'Описание',
  goal: 'Работа',
  joinCode: '',
  createdBy: 'owner',
  ownerId: 'owner',
  roles: { owner: 'owner', admin: 'admin', lead: 'lead' },
  memberIds: ['owner', 'admin', 'lead', 'member', 'other'],
  memberSnapshots: [],
  analysis: null,
  createdAt: NOW,
  updatedAt: NOW,
};

function iteration(overrides = {}) {
  return {
    title: 'Итерация 1',
    goal: '',
    startDate: '2026-10-28',
    deadline: '2026-11-11',
    status: 'active',
    createdBy: 'lead',
    createdAt: NOW,
    updatedAt: NOW,
    closedAt: '',
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    title: 'Сделать прототип',
    description: '',
    status: 'todo',
    priority: 'medium',
    assigneeIds: ['member'],
    iterationId: 'iter1',
    deadline: '',
    createdBy: 'lead',
    createdAt: NOW,
    updatedAt: NOW,
    completedAt: '',
    ...overrides,
  };
}

async function seed(path, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
}

function ref(uid, path) {
  return doc(testEnv.authenticatedContext(uid).firestore(), path);
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-kod-planning',
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
  await seed(`teams/${TEAM_ID}`, team);
  await seed(ITERATION_PATH, iteration());
  await seed(TASK_PATH, task());
});

describe('итерации', () => {
  test('тимлид, админ и владелец создают итерации', async () => {
    for (const uid of ['lead', 'admin', 'owner']) {
      await assertSucceeds(
        setDoc(ref(uid, `teams/${TEAM_ID}/iterations/new-${uid}`), iteration({ createdBy: uid })),
      );
    }
  });

  test('участник не создаёт итерации', async () => {
    await assertFails(
      setDoc(ref('member', `teams/${TEAM_ID}/iterations/new`), iteration({ createdBy: 'member' })),
    );
  });

  test('итерация без дедлайна или с кривой датой запрещена', async () => {
    await assertFails(
      setDoc(ref('lead', `teams/${TEAM_ID}/iterations/new`), iteration({ deadline: '' })),
    );
    await assertFails(
      setDoc(ref('lead', `teams/${TEAM_ID}/iterations/new`), iteration({ deadline: '11.11.2026' })),
    );
  });

  test('тимлид закрывает итерацию, участник — нет', async () => {
    const patch = { status: 'closed', closedAt: NOW, updatedAt: NOW };
    await assertFails(updateDoc(ref('member', ITERATION_PATH), patch));
    await assertSucceeds(updateDoc(ref('lead', ITERATION_PATH), patch));
  });

  test('участники читают итерации, посторонние — нет', async () => {
    await assertSucceeds(getDoc(ref('member', ITERATION_PATH)));
    await assertFails(getDoc(ref('stranger', ITERATION_PATH)));
  });

  test('участник не удаляет итерацию', async () => {
    await assertFails(deleteDoc(ref('member', ITERATION_PATH)));
    await assertSucceeds(deleteDoc(ref('admin', ITERATION_PATH)));
  });
});

describe('задачи', () => {
  test('тимлид создаёт и назначает задачу участнику', async () => {
    await assertSucceeds(
      setDoc(ref('lead', `teams/${TEAM_ID}/tasks/new`), task({ assigneeIds: ['member', 'other'] })),
    );
  });

  test('нельзя назначить того, кто не в команде', async () => {
    await assertFails(
      setDoc(ref('lead', `teams/${TEAM_ID}/tasks/new`), task({ assigneeIds: ['stranger'] })),
    );
  });

  test('участник не создаёт задачи', async () => {
    await assertFails(
      setDoc(ref('member', `teams/${TEAM_ID}/tasks/new`), task({ createdBy: 'member' })),
    );
  });

  test('исполнитель двигает статус своей задачи', async () => {
    await assertSucceeds(
      updateDoc(ref('member', TASK_PATH), { status: 'done', completedAt: NOW, updatedAt: NOW }),
    );
  });

  test('исполнитель не меняет остальные поля', async () => {
    await assertFails(
      updateDoc(ref('member', TASK_PATH), { title: 'Своё', updatedAt: NOW }),
    );
    await assertFails(
      updateDoc(ref('member', TASK_PATH), { deadline: '2027-01-01', updatedAt: NOW }),
    );
  });

  test('чужую задачу участник не трогает', async () => {
    await assertFails(
      updateDoc(ref('other', TASK_PATH), { status: 'done', completedAt: NOW, updatedAt: NOW }),
    );
  });

  test('тимлид переназначает и ставит дедлайн', async () => {
    await assertSucceeds(
      updateDoc(ref('lead', TASK_PATH), {
        assigneeIds: ['other'],
        deadline: '2026-11-05',
        priority: 'high',
        updatedAt: NOW,
      }),
    );
  });

  test('ушедший исполнитель может остаться в задаче, но нового постороннего не добавить', async () => {
    await seed(TASK_PATH, task({ assigneeIds: ['gone'] }));
    await assertSucceeds(
      updateDoc(ref('lead', TASK_PATH), { title: 'Переименовали', updatedAt: NOW }),
    );
    await assertFails(
      updateDoc(ref('lead', TASK_PATH), { assigneeIds: ['gone', 'stranger'], updatedAt: NOW }),
    );
  });

  test('ушедший исполнитель больше не меняет статус', async () => {
    await seed(TASK_PATH, task({ assigneeIds: ['gone'] }));
    await assertFails(
      updateDoc(ref('gone', TASK_PATH), { status: 'done', completedAt: NOW, updatedAt: NOW }),
    );
  });

  test('удаляет задачу только планирующая роль', async () => {
    await assertFails(deleteDoc(ref('member', TASK_PATH)));
    await assertSucceeds(deleteDoc(ref('lead', TASK_PATH)));
  });
});
