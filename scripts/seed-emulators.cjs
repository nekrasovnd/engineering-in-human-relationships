/**
 * Наполняет локальные эмуляторы тестовыми пользователями и командой.
 *
 *   npm run emulators        — в одном терминале
 *   npm run seed:emulators   — в другом
 *   npm run dev:emulators    — сайт, подключённый к эмуляторам
 *
 * Все аккаунты: <login>@kod.test, пароль TEST_PASSWORD ниже.
 * Работает только с эмуляторами проекта demo-kod, боевую базу не трогает.
 */
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc } = require('firebase/firestore');

const PROJECT_ID = 'demo-kod';
const AUTH_URL = 'http://127.0.0.1:9099';
const TEST_PASSWORD = 'kod-test-2026';
const NOW = new Date().toISOString();

// Ответы по Лайкерту 1–5 на 40 вопросов: у каждого свой «характер».
const USERS = [
  { login: 'owner', name: 'Анна Руководитель', bias: [5, 4, 5, 4, 3, 4, 3, 4] },
  { login: 'admin', name: 'Борис Админ', bias: [4, 3, 4, 5, 3, 4, 2, 3] },
  { login: 'lead', name: 'Вера Тимлид', bias: [3, 4, 3, 4, 4, 3, 4, 4] },
  { login: 'member', name: 'Глеб Участник', bias: [2, 2, 2, 3, 5, 2, 5, 5] },
  { login: 'guest', name: 'Дина Кандидат', bias: [4, 5, 3, 2, 4, 4, 3, 4] },
  // Друзья владельца — кандидаты для «Подбора команды».
  { login: 'evgeny', name: 'Евгений Аналитик', bias: [2, 2, 3, 5, 3, 4, 2, 4] },
  { login: 'zhanna', name: 'Жанна Исследователь', bias: [3, 4, 3, 2, 5, 3, 3, 4] },
  { login: 'zoya', name: 'Зоя Разработчик', bias: [2, 2, 3, 4, 3, 5, 2, 3] },
  { login: 'ilya', name: 'Илья Спорщик', bias: [4, 4, 5, 2, 1, 3, 4, 1] },
];

function daysFromToday(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

// Копия getWeekKey из src/utils/teamFeedback.js (Node не резолвит импорты Vite без расширений).
function getWeekKey(date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target - yearStart) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

// Баллы Большой пятёрки у владельца и части его друзей — для «Подбора команды».
const BIG_FIVE = {
  owner: { extraversion: 7, agreeableness: 6.5, conscientiousness: 8, stability: 5, openness: 6 },
  evgeny: { extraversion: 3, agreeableness: 6, conscientiousness: 9, stability: 7, openness: 7 },
  zoya: { extraversion: 4, agreeableness: 7, conscientiousness: 8, stability: 7.5, openness: 6.5 },
  admin: { extraversion: 6, agreeableness: 5.5, conscientiousness: 7.5, stability: 6, openness: 5 },
};

async function createAuthUser(email) {
  const response = await fetch(
    `${AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: TEST_PASSWORD, returnSecureToken: true }),
    },
  );
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`${email}: ${payload.error?.message || response.status}`);
  }

  return payload.localId;
}

function buildAnswers(questionnaire, bias) {
  const answers = {};

  questionnaire.FACTOR_CONFIG.forEach((factor, factorIndex) => {
    factor.questions.forEach((question) => {
      const value = bias[factorIndex];
      answers[question.id] = question.reverse ? 6 - value : value;
    });
  });

  return answers;
}

async function main() {
  const questionnaire = await import('../src/data/questionnaire.js');
  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: '127.0.0.1', port: 8080 },
  });

  const profiles = [];

  for (const user of USERS) {
    const userId = await createAuthUser(`${user.login}@kod.test`);
    const answers = buildAnswers(questionnaire, user.bias);
    const result = questionnaire.calculateQuestionnaireResult(answers);
    const initials = user.name
      .split(' ')
      .map((part) => part[0])
      .join('');

    profiles.push({
      login: user.login,
      userId,
      name: user.name,
      age: 30,
      gender: '',
      avatarInitials: initials,
      avatarUrl: '',
      answers,
      factorScores: result.factorScores,
      factorReliability: result.factorReliability,
      egoState: result.egoState,
      systemIndices: result.systemIndices,
      profileIntegrity: result.profileIntegrity,
      questionnaireCompleted: true,
      discoverVisible: true,
      ...(BIG_FIVE[user.login]
        ? { bigFive: { scores: BIG_FIVE[user.login], answers: {}, completedAt: NOW } }
        : {}),
      createdAt: NOW,
      updatedAt: NOW,
    });
  }

  const byLogin = Object.fromEntries(profiles.map((item) => [item.login, item]));
  const snapshotOf = ({ login, answers, questionnaireCompleted, discoverVisible, age, gender, createdAt, updatedAt, ...rest }) => rest;
  const discoverOf = ({ login, answers, bigFive, ...rest }) => rest;
  // В снапшот попадают только баллы, как в buildMemberSnapshot.
  const friendSnapshotOf = (profile) => ({
    ...snapshotOf(profile),
    ...(profile.bigFive ? { bigFive: { scores: profile.bigFive.scores } } : {}),
  });
  const teamMembers = ['owner', 'admin', 'lead', 'member'].map((login) => byLogin[login]);

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    for (const profile of profiles) {
      const { login, ...data } = profile;
      await setDoc(doc(db, 'profiles', profile.userId), data);
      await setDoc(doc(db, 'discoverProfiles', profile.userId), discoverOf(profile));
    }

    // Взаимная симпатия владельца и кандидата — чтобы было кого пригласить.
    for (const [from, to] of [['owner', 'guest'], ['guest', 'owner']]) {
      const id = `${byLogin[from].userId}_${byLogin[to].userId}`;
      await setDoc(doc(db, 'matchActions', id), {
        id,
        fromUid: byLogin[from].userId,
        toUid: byLogin[to].userId,
        decision: 'like',
        compatibility: 72,
        conflictRisk: 'Низкий',
        createdAt: NOW,
        updatedAt: NOW,
      });
    }

    // Код друга владельца, его друзья и входящая заявка от Дины.
    await setDoc(doc(db, 'friendCodes', 'ANNA2026'), {
      code: 'ANNA2026',
      userId: byLogin.owner.userId,
      createdAt: NOW,
    });

    const friendPairs = [
      ['evgeny', 'accepted'],
      ['zhanna', 'accepted'],
      ['zoya', 'accepted'],
      ['ilya', 'accepted'],
      ['admin', 'accepted'],
      ['guest', 'pending'],
    ];

    for (const [login, status] of friendPairs) {
      const friend = byLogin[login];
      const owner = byLogin.owner;
      const userIds = [owner.userId, friend.userId].sort();
      await setDoc(doc(db, 'friendships', userIds.join('_')), {
        userIds,
        requesterId: friend.userId,
        addresseeId: owner.userId,
        status,
        code: 'ANNA2026',
        snapshots:
          status === 'accepted'
            ? { [owner.userId]: friendSnapshotOf(owner), [friend.userId]: friendSnapshotOf(friend) }
            : { [friend.userId]: friendSnapshotOf(friend) },
        createdAt: NOW,
        updatedAt: NOW,
        acceptedAt: status === 'accepted' ? NOW : '',
      });
    }

    // Опрос пары владельца и Евгения: две прошлые недели, на этой ответил только Евгений.
    const evgenyPair = [byLogin.owner.userId, byLogin.evgeny.userId].sort().join('_');
    const pairAnswers = [
      { offset: -14, answers: { appreciation: 4, commitment: 5, closeness: 4, conflict: 2 } },
      { offset: -7, answers: { appreciation: 2, commitment: 3, closeness: 2, conflict: 4 } },
    ];

    for (const { offset, answers } of pairAnswers) {
      const weekDate = new Date();
      weekDate.setDate(weekDate.getDate() + offset);
      const weekKey = getWeekKey(weekDate);

      for (const login of ['owner', 'evgeny']) {
        const userId = byLogin[login].userId;
        await setDoc(doc(db, 'friendships', evgenyPair, 'pulses', `${weekKey}_${userId}`), {
          userId,
          weekKey,
          answers,
          createdAt: NOW,
        });
      }
    }

    const currentWeek = getWeekKey(new Date());
    await setDoc(
      doc(db, 'friendships', evgenyPair, 'pulses', `${currentWeek}_${byLogin.evgeny.userId}`),
      {
        userId: byLogin.evgeny.userId,
        weekKey: currentWeek,
        answers: { appreciation: 4, commitment: 4, closeness: 4, conflict: 2 },
        createdAt: NOW,
      },
    );

    await setDoc(doc(db, 'teams', 'demo-team'), {
      name: 'Экипаж проектного старта',
      description: 'Демо-команда для проверки ролей и прав.',
      goal: 'Работа',
      joinCode: '',
      createdBy: byLogin.owner.userId,
      ownerId: byLogin.owner.userId,
      roles: {
        [byLogin.owner.userId]: 'owner',
        [byLogin.admin.userId]: 'admin',
        [byLogin.lead.userId]: 'lead',
      },
      // Админ без роли в работе — чтобы на вкладке «Роли» была подсказка.
      functionalRoles: {
        [byLogin.owner.userId]: 'hr',
        [byLogin.lead.userId]: 'analyst',
        [byLogin.member.userId]: 'developer',
      },
      qualifications: {
        [byLogin.owner.userId]: 'senior',
        [byLogin.lead.userId]: 'middle',
        [byLogin.member.userId]: 'junior',
      },
      memberIds: teamMembers.map((item) => item.userId),
      memberSnapshots: teamMembers.map(snapshotOf),
      analysis: null,
      createdAt: NOW,
      updatedAt: NOW,
    });

    const iterationBase = {
      goal: '',
      createdBy: byLogin.lead.userId,
      createdAt: NOW,
      updatedAt: NOW,
    };
    await setDoc(doc(db, 'teams', 'demo-team', 'iterations', 'iter-1'), {
      ...iterationBase,
      title: 'Итерация 1 — исследование',
      startDate: daysFromToday(-21),
      deadline: daysFromToday(-8),
      status: 'closed',
      closedAt: NOW,
    });
    await setDoc(doc(db, 'teams', 'demo-team', 'iterations', 'iter-2'), {
      ...iterationBase,
      title: 'Итерация 2 — прототип',
      goal: 'Показать кликабельный прототип экрана команды.',
      startDate: daysFromToday(-7),
      deadline: daysFromToday(6),
      status: 'active',
      closedAt: '',
    });

    const tasks = [
      ['Интервью с пользователями', 'iter-1', 'done', 'high', ['member'], ''],
      ['Собрать макет экрана команды', 'iter-2', 'in_progress', 'high', ['member'], daysFromToday(1)],
      ['Описать роли и права', 'iter-2', 'review', 'medium', ['admin'], ''],
      ['Подготовить демо для заказчика', 'iter-2', 'todo', 'medium', ['lead', 'member'], ''],
      ['Починить вёрстку на телефоне', 'iter-2', 'todo', 'low', ['member'], daysFromToday(-1)],
    ];

    for (const [index, [title, iterationId, status, priority, assignees, deadline]] of tasks.entries()) {
      await setDoc(doc(db, 'teams', 'demo-team', 'tasks', `task-${index + 1}`), {
        title,
        description: '',
        status,
        priority,
        assigneeIds: assignees.map((login) => byLogin[login].userId),
        iterationId,
        deadline,
        createdBy: byLogin.lead.userId,
        createdAt: NOW,
        updatedAt: NOW,
        completedAt: status === 'done' ? NOW : '',
      });
    }

    // Пульс за три прошлые недели: трение растёт, Глеб «сложный» для Веры.
    const weekly = [
      { offset: -21, base: [2, 3, 4, 4, 4] },
      { offset: -14, base: [3, 4, 3, 3, 3] },
      { offset: -7, base: [4, 5, 2, 2, 2] },
    ];

    for (const { offset, base } of weekly) {
      const weekDate = new Date();
      weekDate.setDate(weekDate.getDate() + offset);
      const weekKey = getWeekKey(weekDate);

      for (const member of teamMembers) {
        const [tension, workload, clarity, support, mood] = base;
        await setDoc(doc(db, 'teams', 'demo-team', 'pulseSurveys', `${weekKey}_${member.userId}`), {
          userId: member.userId,
          weekKey,
          answers: { tension, workload, clarity, support, mood },
          frictionWith: member.login === 'lead' ? [byLogin.member.userId] : [],
          comment: '',
          createdAt: NOW,
        });
      }
    }

    // Оценки по закрытой итерации 1 оставили админ и тимлид; остальным — предложит сайт.
    for (const reviewerLogin of ['admin', 'lead']) {
      const reviewer = byLogin[reviewerLogin];
      const ratings = Object.fromEntries(
        teamMembers
          .filter((member) => member.userId !== reviewer.userId)
          .map((member) => [
            member.userId,
            member.login === 'member'
              ? { contribution: 3, quality: 2, communication: 2, reliability: 2 }
              : { contribution: 5, quality: 4, communication: 4, reliability: 5 },
          ]),
      );
      await setDoc(doc(db, 'teams', 'demo-team', 'peerReviews', `iter-1_${reviewer.userId}`), {
        reviewerId: reviewer.userId,
        iterationId: 'iter-1',
        ratings,
        comments: {},
        createdAt: NOW,
      });
    }
  });

  await testEnv.cleanup();
  console.log(`Готово. Логины: ${USERS.map((item) => `${item.login}@kod.test`).join(', ')}`);
  console.log(`Пароль: ${TEST_PASSWORD}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
