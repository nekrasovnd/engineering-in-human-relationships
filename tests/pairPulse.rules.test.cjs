/**
 * Тесты правил Firestore: опрос пары, Большая пятёрка в снапшоте друга,
 * новые вопросы опроса недели.
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

const NOW = '2026-11-01T00:00:00.000Z';
const PAIR = 'anna_boris';
const WEEK = '2026-W44';
const ANSWERS = { appreciation: 4, commitment: 5, closeness: 4, conflict: 2 };

let testEnv;

const FACTORS = {
  neuroticism: 4,
  extraversion: 6,
  dominance: 5,
  ruleAdaptation: 6,
  empathy: 7,
  stressResponse: 6,
  feedbackNeed: 5,
  cooperation: 7,
};

function snapshot(userId, extra = {}) {
  return {
    userId,
    name: userId,
    avatarInitials: 'A',
    avatarUrl: '',
    egoState: 'Взрослый',
    factorScores: FACTORS,
    factorReliability: FACTORS,
    systemIndices: {
      conflictLoad: 4,
      teamStabilityReserve: 6,
      communicationClarity: 6,
      autonomyBalance: 6,
      profileIntegrity: 7,
    },
    profileIntegrity: 7,
    ...extra,
  };
}

function friendship(overrides = {}) {
  return {
    userIds: ['anna', 'boris'],
    requesterId: 'anna',
    addresseeId: 'boris',
    status: 'accepted',
    code: 'BORIS777',
    snapshots: { anna: snapshot('anna'), boris: snapshot('boris') },
    createdAt: NOW,
    updatedAt: NOW,
    acceptedAt: NOW,
    ...overrides,
  };
}

function pulseRef(uid, author = uid, week = WEEK) {
  return doc(
    testEnv.authenticatedContext(uid).firestore(),
    'friendships',
    PAIR,
    'pulses',
    `${week}_${author}`,
  );
}

const pulse = (uid, overrides = {}) => ({
  userId: uid,
  weekKey: WEEK,
  answers: ANSWERS,
  createdAt: NOW,
  ...overrides,
});

async function seed(path, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-kod-pair',
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
  await seed(`friendships/${PAIR}`, friendship());
});

describe('опрос пары', () => {
  test('каждый из пары отвечает за себя один раз', async () => {
    await assertSucceeds(setDoc(pulseRef('anna'), pulse('anna')));
    await assertFails(setDoc(pulseRef('anna'), pulse('anna', { answers: { ...ANSWERS, conflict: 5 } })));
    await assertSucceeds(setDoc(pulseRef('boris'), pulse('boris')));
  });

  test('нельзя ответить за партнёра', async () => {
    await assertFails(setDoc(pulseRef('anna', 'boris'), pulse('boris')));
  });

  test('посторонний не отвечает и не читает', async () => {
    await seed(`friendships/${PAIR}/pulses/${WEEK}_anna`, pulse('anna'));
    await assertFails(setDoc(pulseRef('carl'), pulse('carl')));
    await assertFails(getDoc(pulseRef('carl', 'anna')));
    await assertSucceeds(getDoc(pulseRef('boris', 'anna')));
  });

  test('до принятия заявки опрос недоступен', async () => {
    await seed(`friendships/${PAIR}`, friendship({ status: 'pending', acceptedAt: '' }));
    await assertFails(setDoc(pulseRef('anna'), pulse('anna')));
  });

  test('проверяются значения и лишние поля', async () => {
    await assertFails(setDoc(pulseRef('anna'), pulse('anna', { answers: { ...ANSWERS, conflict: 9 } })));
    await assertFails(setDoc(pulseRef('anna'), pulse('anna', { note: 'лишнее' })));
    await assertFails(setDoc(pulseRef('anna'), pulse('anna', { weekKey: 'неделя' })));
  });

  test('при удалении дружбы опросы могут удалить оба', async () => {
    await seed(`friendships/${PAIR}/pulses/${WEEK}_anna`, pulse('anna'));
    await assertSucceeds(deleteDoc(pulseRef('boris', 'anna')));
  });
});

describe('Большая пятёрка в снапшоте друга', () => {
  const scores = {
    extraversion: 5,
    agreeableness: 6,
    conscientiousness: 7,
    stability: 5,
    openness: 6,
  };

  function friendRef(uid) {
    return doc(testEnv.authenticatedContext(uid).firestore(), 'friendships', PAIR);
  }

  test('баллы проходят', async () => {
    await assertSucceeds(
      updateDoc(friendRef('anna'), {
        'snapshots.anna': snapshot('anna', { bigFive: { scores } }),
        updatedAt: NOW,
      }),
    );
  });

  test('ответы и неверные баллы не проходят', async () => {
    await assertFails(
      updateDoc(friendRef('anna'), {
        'snapshots.anna': snapshot('anna', { bigFive: { scores, answers: { e1: 5 } } }),
        updatedAt: NOW,
      }),
    );
    await assertFails(
      updateDoc(friendRef('anna'), {
        'snapshots.anna': snapshot('anna', { bigFive: { scores: { ...scores, openness: 11 } } }),
        updatedAt: NOW,
      }),
    );
  });
});

describe('новые вопросы опроса недели', () => {
  const team = {
    name: 'Команда',
    description: '',
    goal: 'Работа',
    joinCode: '',
    createdBy: 'owner',
    ownerId: 'owner',
    roles: { owner: 'owner' },
    memberIds: ['owner', 'member'],
    memberSnapshots: [],
    analysis: null,
    createdAt: NOW,
    updatedAt: NOW,
  };
  const base = { tension: 2, workload: 2, clarity: 4, support: 4, mood: 4 };

  function teamPulse(answers) {
    return {
      userId: 'member',
      weekKey: WEEK,
      answers,
      frictionWith: [],
      comment: '',
      createdAt: NOW,
    };
  }

  function teamPulseRef() {
    return doc(
      testEnv.authenticatedContext('member').firestore(),
      'teams',
      'team1',
      'pulseSurveys',
      `${WEEK}_member`,
    );
  }

  beforeEach(async () => {
    await seed('teams/team1', team);
  });

  test('восемь ответов проходят', async () => {
    await assertSucceeds(
      setDoc(teamPulseRef(), teamPulse({ ...base, process: 2, taskDebate: 4, safety: 5 })),
    );
  });

  test('старая форма с пятью ответами проходит', async () => {
    await assertSucceeds(setDoc(teamPulseRef(), teamPulse(base)));
  });

  test('неверное значение и лишний вопрос не проходят', async () => {
    await assertFails(setDoc(teamPulseRef(), teamPulse({ ...base, safety: 6 })));
    await assertFails(setDoc(teamPulseRef(), teamPulse({ ...base, extra: 3 })));
  });
});
