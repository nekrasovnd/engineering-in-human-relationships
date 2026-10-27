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
];

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
      createdAt: NOW,
      updatedAt: NOW,
    });
  }

  const byLogin = Object.fromEntries(profiles.map((item) => [item.login, item]));
  const snapshotOf = ({ login, answers, questionnaireCompleted, discoverVisible, age, gender, createdAt, updatedAt, ...rest }) => rest;
  const discoverOf = ({ login, answers, ...rest }) => rest;
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
      memberIds: teamMembers.map((item) => item.userId),
      memberSnapshots: teamMembers.map(snapshotOf),
      analysis: null,
      createdAt: NOW,
      updatedAt: NOW,
    });
  });

  await testEnv.cleanup();
  console.log(`Готово. Логины: ${USERS.map((item) => `${item.login}@kod.test`).join(', ')}`);
  console.log(`Пароль: ${TEST_PASSWORD}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
