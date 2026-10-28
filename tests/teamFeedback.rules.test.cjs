/**
 * Тесты правил Firestore для пульс-опросов и оценки коллег.
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
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  setLogLevel,
  where,
} = require('firebase/firestore');

// Ожидаемые PERMISSION_DENIED не засоряют вывод.
setLogLevel('silent');

const NOW = '2026-10-28T00:00:00.000Z';
const TEAM_ID = 'team1';
const WEEK = '2026-W44';

let testEnv;

const team = {
  name: 'Команда',
  description: 'Описание',
  goal: 'Работа',
  joinCode: '',
  createdBy: 'owner',
  ownerId: 'owner',
  roles: { owner: 'owner', admin: 'admin', lead: 'lead' },
  memberIds: ['owner', 'admin', 'lead', 'member'],
  memberSnapshots: [],
  analysis: null,
  createdAt: NOW,
  updatedAt: NOW,
};

const iterationBase = {
  title: 'Итерация',
  goal: '',
  startDate: '2026-10-14',
  deadline: '2026-10-27',
  createdBy: 'lead',
  createdAt: NOW,
  updatedAt: NOW,
};

function pulse(uid, overrides = {}) {
  return {
    userId: uid,
    weekKey: WEEK,
    answers: { tension: 3, workload: 4, clarity: 2, support: 3, mood: 3 },
    frictionWith: [],
    comment: '',
    createdAt: NOW,
    ...overrides,
  };
}

const rating = { contribution: 4, quality: 4, communication: 3, reliability: 5 };

function review(uid, iterationId = 'closed-iter', overrides = {}) {
  const colleagues = team.memberIds.filter((item) => item !== uid);
  return {
    reviewerId: uid,
    iterationId,
    ratings: Object.fromEntries(colleagues.map((item) => [item, rating])),
    comments: {},
    createdAt: NOW,
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

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-kod-feedback',
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
  await seed(`teams/${TEAM_ID}/iterations/closed-iter`, {
    ...iterationBase,
    status: 'closed',
    closedAt: NOW,
  });
  await seed(`teams/${TEAM_ID}/iterations/active-iter`, {
    ...iterationBase,
    status: 'active',
    closedAt: '',
  });
});

describe('пульс недели', () => {
  const pulsePath = (uid) => `teams/${TEAM_ID}/pulseSurveys/${WEEK}_${uid}`;

  test('участник отвечает за себя один раз', async () => {
    await assertSucceeds(
      setDoc(doc(db('member'), pulsePath('member')), pulse('member', { frictionWith: ['lead'] })),
    );
    await assertFails(setDoc(doc(db('member'), pulsePath('member')), pulse('member')));
  });

  test('нельзя ответить за другого или под чужим id', async () => {
    await assertFails(setDoc(doc(db('member'), pulsePath('lead')), pulse('lead')));
    await assertFails(setDoc(doc(db('member'), pulsePath('lead')), pulse('member')));
  });

  test('ответы только 1–5, все вопросы обязательны', async () => {
    await assertFails(
      setDoc(doc(db('member'), pulsePath('member')), pulse('member', {
        answers: { tension: 7, workload: 4, clarity: 2, support: 3, mood: 3 },
      })),
    );
    await assertFails(
      setDoc(doc(db('member'), pulsePath('member')), pulse('member', {
        answers: { tension: 3, workload: 4 },
      })),
    );
  });

  test('«сложно с» — только участники и не сам себя', async () => {
    await assertFails(
      setDoc(doc(db('member'), pulsePath('member')), pulse('member', { frictionWith: ['stranger'] })),
    );
    await assertFails(
      setDoc(doc(db('member'), pulsePath('member')), pulse('member', { frictionWith: ['member'] })),
    );
  });

  test('посторонний не отвечает', async () => {
    await assertFails(setDoc(doc(db('stranger'), pulsePath('stranger')), pulse('stranger')));
  });

  test('ответы видят автор и владелец/админы, но не тимлид', async () => {
    await seed(pulsePath('member'), pulse('member'));
    await assertSucceeds(getDoc(doc(db('member'), pulsePath('member'))));
    await assertSucceeds(getDoc(doc(db('owner'), pulsePath('member'))));
    await assertSucceeds(getDoc(doc(db('admin'), pulsePath('member'))));
    await assertFails(getDoc(doc(db('lead'), pulsePath('member'))));
  });

  test('участник читает список только со своим фильтром', async () => {
    await seed(pulsePath('member'), pulse('member'));
    await seed(pulsePath('lead'), pulse('lead'));
    const pulses = collection(db('member'), 'teams', TEAM_ID, 'pulseSurveys');
    await assertSucceeds(getDocs(query(pulses, where('userId', '==', 'member'))));
    await assertFails(getDocs(pulses));
    await assertSucceeds(getDocs(collection(db('admin'), 'teams', TEAM_ID, 'pulseSurveys')));
  });

  test('удалить ответы может только владелец', async () => {
    await seed(pulsePath('member'), pulse('member'));
    await assertFails(deleteDoc(doc(db('admin'), pulsePath('member'))));
    await assertSucceeds(deleteDoc(doc(db('owner'), pulsePath('member'))));
  });
});

describe('оценка коллег', () => {
  const reviewPath = (uid, iterationId = 'closed-iter') =>
    `teams/${TEAM_ID}/peerReviews/${iterationId}_${uid}`;

  test('после закрытия итерации участник оценивает коллег один раз', async () => {
    await assertSucceeds(setDoc(doc(db('member'), reviewPath('member')), review('member')));
    await assertFails(setDoc(doc(db('member'), reviewPath('member')), review('member')));
  });

  test('активную итерацию оценивать нельзя', async () => {
    await assertFails(
      setDoc(doc(db('member'), reviewPath('member', 'active-iter')), review('member', 'active-iter')),
    );
  });

  test('нельзя оценить себя или постороннего', async () => {
    await assertFails(
      setDoc(doc(db('member'), reviewPath('member')), review('member', 'closed-iter', {
        ratings: { member: rating },
      })),
    );
    await assertFails(
      setDoc(doc(db('member'), reviewPath('member')), review('member', 'closed-iter', {
        ratings: { stranger: rating },
      })),
    );
  });

  test('нельзя оставить оценку от чужого имени', async () => {
    await assertFails(setDoc(doc(db('member'), reviewPath('lead')), review('lead')));
  });

  test('оценки видят автор и владелец/админы', async () => {
    await seed(reviewPath('member'), review('member'));
    await assertSucceeds(getDoc(doc(db('member'), reviewPath('member'))));
    await assertSucceeds(getDoc(doc(db('admin'), reviewPath('member'))));
    await assertFails(getDoc(doc(db('lead'), reviewPath('member'))));
  });
});
