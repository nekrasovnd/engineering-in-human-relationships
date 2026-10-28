/**
 * Тесты правил Firestore для друзей по коду.
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
  updateDoc,
  where,
} = require('firebase/firestore');

// Ожидаемые PERMISSION_DENIED не засоряют вывод.
setLogLevel('silent');

const NOW = '2026-10-28T00:00:00.000Z';
const PAIR = 'anna_boris';
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

let testEnv;

function snapshot(userId) {
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
  };
}

// Анна знает код Бориса и отправляет заявку.
function request(overrides = {}) {
  return {
    userIds: ['anna', 'boris'],
    requesterId: 'anna',
    addresseeId: 'boris',
    status: 'pending',
    code: 'BORIS777',
    snapshots: { anna: snapshot('anna') },
    createdAt: NOW,
    updatedAt: NOW,
    acceptedAt: '',
    ...overrides,
  };
}

function db(uid) {
  return testEnv.authenticatedContext(uid).firestore();
}

async function seed(path, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-kod-friends',
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
  await seed('friendCodes/BORIS777', { code: 'BORIS777', userId: 'boris', createdAt: NOW });
});

describe('коды друзей', () => {
  test('можно создать свой код и найти его', async () => {
    await assertSucceeds(
      setDoc(doc(db('anna'), 'friendCodes', 'ANNA1234'), {
        code: 'ANNA1234',
        userId: 'anna',
        createdAt: NOW,
      }),
    );
    await assertSucceeds(
      getDocs(query(collection(db('anna'), 'friendCodes'), where('userId', '==', 'anna'))),
    );
  });

  test('нельзя занять чужой код или выписать код на другого', async () => {
    await assertFails(
      setDoc(doc(db('anna'), 'friendCodes', 'BORIS777'), {
        code: 'BORIS777',
        userId: 'anna',
        createdAt: NOW,
      }),
    );
    await assertFails(
      setDoc(doc(db('anna'), 'friendCodes', 'FAKE1234'), {
        code: 'FAKE1234',
        userId: 'boris',
        createdAt: NOW,
      }),
    );
  });

  test('код читается по значению, но список чужих кодов закрыт', async () => {
    await assertSucceeds(getDoc(doc(db('anna'), 'friendCodes', 'BORIS777')));
    await assertFails(getDocs(collection(db('anna'), 'friendCodes')));
  });
});

describe('заявки в друзья', () => {
  test('заявка по верному коду', async () => {
    await assertSucceeds(setDoc(doc(db('anna'), 'friendships', PAIR), request()));
  });

  test('без кода адресата заявка не проходит', async () => {
    await assertFails(
      setDoc(doc(db('anna'), 'friendships', PAIR), request({ code: 'WRONG000' })),
    );
  });

  test('нельзя сразу создать дружбу или подложить чужой снапшот', async () => {
    await assertFails(
      setDoc(doc(db('anna'), 'friendships', PAIR), request({ status: 'accepted' })),
    );
    await assertFails(
      setDoc(
        doc(db('anna'), 'friendships', PAIR),
        request({ snapshots: { anna: snapshot('anna'), boris: snapshot('boris') } }),
      ),
    );
  });

  test('адресат принимает, отправитель — нет', async () => {
    await seed(`friendships/${PAIR}`, request());
    const accept = {
      status: 'accepted',
      'snapshots.boris': snapshot('boris'),
      acceptedAt: NOW,
      updatedAt: NOW,
    };
    await assertFails(updateDoc(doc(db('anna'), 'friendships', PAIR), accept));
    await assertSucceeds(updateDoc(doc(db('boris'), 'friendships', PAIR), accept));
  });

  test('при принятии нельзя менять снапшот другого', async () => {
    await seed(`friendships/${PAIR}`, request());
    await assertFails(
      updateDoc(doc(db('boris'), 'friendships', PAIR), {
        status: 'accepted',
        'snapshots.boris': snapshot('boris'),
        'snapshots.anna': snapshot('boris'),
        acceptedAt: NOW,
        updatedAt: NOW,
      }),
    );
  });

  test('друзья обновляют только свой снапшот', async () => {
    await seed(
      `friendships/${PAIR}`,
      request({
        status: 'accepted',
        acceptedAt: NOW,
        snapshots: { anna: snapshot('anna'), boris: snapshot('boris') },
      }),
    );
    await assertSucceeds(
      updateDoc(doc(db('anna'), 'friendships', PAIR), {
        'snapshots.anna': { ...snapshot('anna'), name: 'Анна' },
        updatedAt: NOW,
      }),
    );
    await assertFails(
      updateDoc(doc(db('anna'), 'friendships', PAIR), {
        'snapshots.boris': { ...snapshot('boris'), name: 'Подмена' },
        updatedAt: NOW,
      }),
    );
  });

  test('читают и удаляют только двое', async () => {
    await seed(`friendships/${PAIR}`, request());
    await assertSucceeds(
      getDocs(
        query(collection(db('boris'), 'friendships'), where('userIds', 'array-contains', 'boris')),
      ),
    );
    await assertFails(getDoc(doc(db('carl'), 'friendships', PAIR)));
    await assertFails(deleteDoc(doc(db('carl'), 'friendships', PAIR)));
    await assertSucceeds(deleteDoc(doc(db('boris'), 'friendships', PAIR)));
  });
});
