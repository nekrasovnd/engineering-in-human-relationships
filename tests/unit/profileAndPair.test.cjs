/**
 * Подсчёт необязательных тестов, черты состава команды и опрос пары.
 * Запуск: npm run test:unit (эмулятор не нужен).
 */
const { before, describe, test } = require('node:test');
const assert = require('node:assert/strict');

let tests;
let traits;
let pair;

before(async () => {
  tests = await import('../../src/data/optionalTests.js');
  traits = await import('../../src/utils/teamTraits.js');
  pair = await import('../../src/utils/pairPulse.js');
});

function answerAll(test, pick) {
  return Object.fromEntries(test.items.map((question) => [question.id, pick(question)]));
}

describe('необязательные тесты', () => {
  test('в Большой пятёрке по 10 вопросов на шкалу и ключи как в IPIP', () => {
    const { items } = tests.OPTIONAL_TESTS.bigFive;
    const reversedBy = { extraversion: 5, agreeableness: 4, conscientiousness: 4, stability: 8, openness: 3 };

    assert.equal(items.length, 50);
    assert.equal(new Set(items.map((question) => question.id)).size, 50);
    tests.BIG_FIVE_FACTOR_KEYS.forEach((factor) => {
      const own = items.filter((question) => question.factor === factor);
      assert.equal(own.length, 10, factor);
      assert.equal(own.filter((question) => question.reverse).length, reversedBy[factor], factor);
    });
  });

  test('обратные вопросы считаются наоборот', () => {
    const test_ = tests.OPTIONAL_TESTS.bigFive;
    const high = tests.calculateOptionalTest(test_, answerAll(test_, (q) => (q.reverse ? 1 : 5)));
    const low = tests.calculateOptionalTest(test_, answerAll(test_, (q) => (q.reverse ? 5 : 1)));
    const middle = tests.calculateOptionalTest(test_, answerAll(test_, () => 3));

    tests.BIG_FIVE_FACTOR_KEYS.forEach((factor) => {
      assert.equal(high[factor], 10);
      assert.equal(low[factor], 0);
      assert.equal(middle[factor], 5);
    });
  });

  test('без полного ответа результата нет', () => {
    const test_ = tests.OPTIONAL_TESTS.attachment;
    const answers = answerAll(test_, () => 3);
    delete answers.an1;

    assert.equal(tests.calculateOptionalTest(test_, answers), null);
    assert.equal(tests.calculateOptionalTest(test_, { ...answers, an1: 7 }), null);
  });

  test('привязанность считается по двум шкалам', () => {
    const test_ = tests.OPTIONAL_TESTS.attachment;
    const scores = tests.calculateOptionalTest(
      test_,
      answerAll(test_, (q) => (q.factor === 'anxiety' ? 5 : q.reverse ? 5 : 1)),
    );

    assert.deepEqual(scores, { avoidance: 0, anxiety: 10 });
  });
});

describe('черты состава', () => {
  const member = (conscientiousness, openness, agreeableness) => ({
    bigFive: { scores: { conscientiousness, openness, agreeableness } },
  });

  test('если тест прошли не все, оценки нет', () => {
    assert.equal(traits.getGroupTraits([member(5, 5, 5), {}]), null);
    assert.equal(traits.getGroupTraits([]), null);
  });

  test('среднее для добросовестности и открытости, минимум для доброжелательности', () => {
    const result = traits.getGroupTraits([member(8, 6, 9), member(6, 4, 2)]);

    assert.equal(result.conscientiousness, 7);
    assert.equal(result.openness, 5);
    assert.equal(result.minAgreeableness, 2);
    assert.ok(Math.abs(result.score - (14 / 3) * 10) < 1e-9);
  });
});

describe('опрос пары', () => {
  const calm = { appreciation: 5, commitment: 5, closeness: 5, conflict: 1 };
  const tense = { appreciation: 1, commitment: 1, closeness: 1, conflict: 5 };

  test('индекс напряжения идёт от 0 до 10', () => {
    assert.equal(pair.getPairTensionIndex(calm), 0);
    assert.equal(pair.getPairTensionIndex(tense), 10);
  });

  test('неделя с одним ответом в график не попадает', () => {
    const timeline = pair.buildPairTimeline([
      { weekKey: '2026-W44', answers: calm },
      { weekKey: '2026-W44', answers: tense },
      { weekKey: '2026-W43', answers: calm },
      { weekKey: '2026-W45', answers: tense },
    ]);

    assert.deepEqual(timeline, [{ weekKey: '2026-W44', responses: 2, frictionIndex: 5 }]);
  });

  test('вопрос для разговора стабилен в пределах недели', () => {
    assert.equal(pair.getPairPrompt('2026-W44'), pair.getPairPrompt('2026-W44'));
    assert.ok(pair.PAIR_CONVERSATION_PROMPTS.includes(pair.getPairPrompt('2026-W45')));
  });
});
