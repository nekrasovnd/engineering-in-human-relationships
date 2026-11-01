/**
 * Математика модели из методички по ТАУ.
 * Запуск: npm run test:unit (эмулятор не нужен).
 */
const { before, describe, test } = require('node:test');
const assert = require('node:assert/strict');

let dynamics;

before(async () => {
  dynamics = await import('../../src/utils/psychDynamics.js');
});

function assertClose(actual, expected, tolerance, message) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message || 'значение'}: ${actual}, ожидалось ${expected} ± ${tolerance}`,
  );
}

/** Прямое интегрирование исходного уравнения методом Рунге — Кутты. */
function integrate({ a2, a1, a0 }, force, endTime, steps = 20000) {
  const dt = endTime / steps;
  const derivative = (time, y, velocity) => (force(time) - a1 * velocity - a0 * y) / a2;
  let y = 0;
  let velocity = 0;

  for (let index = 0; index < steps; index += 1) {
    const time = index * dt;
    const k1y = velocity;
    const k1v = derivative(time, y, velocity);
    const k2y = velocity + (dt / 2) * k1v;
    const k2v = derivative(time + dt / 2, y + (dt / 2) * k1y, velocity + (dt / 2) * k1v);
    const k3y = velocity + (dt / 2) * k2v;
    const k3v = derivative(time + dt / 2, y + (dt / 2) * k2y, velocity + (dt / 2) * k2v);
    const k4y = velocity + dt * k3v;
    const k4v = derivative(time + dt, y + dt * k3y, velocity + dt * k3v);
    y += (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
    velocity += (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
  }

  return y;
}

describe('параметры звена', () => {
  test('совпадают с формулами методички', () => {
    const parameters = dynamics.getDynamicsParameters({ R: 16, F: 5, A: 4 }, 2);

    assert.equal(parameters.xi, 0.5);
    assert.equal(parameters.T, 4);
    assert.equal(parameters.k, 1);
    assert.equal(parameters.a2, 16);
    assert.equal(parameters.a1, 4);
    assert.equal(parameters.a0, 1);
  });

  test('коэффициенты дают ту же форму T²Y″ + 2ξTY′ + Y = kX', () => {
    const { T, xi, k, a2, a1, a0 } = dynamics.getDynamicsParameters({ R: 9, F: 14, A: 11 });

    assertClose(a2 * k, T * T, 1e-9, 'T²');
    assertClose(a1 * k, 2 * xi * T, 1e-9, '2ξT');
    assertClose(a0 * k, 1, 1e-9, 'коэффициент при Y');
  });

  test('шкалы в пределах 1–20 при любых факторах', () => {
    const extreme = (value) => ({
      neuroticism: value,
      extraversion: value,
      dominance: value,
      ruleAdaptation: value,
      empathy: value,
      stressResponse: value,
      feedbackNeed: value,
      cooperation: value,
    });

    [0, 10].forEach((value) => {
      Object.values(dynamics.getPsychMap(extreme(value))).forEach((score) => {
        assert.ok(score >= 1 && score <= 20, `балл ${score}`);
      });
    });
  });
});

describe('решение уравнения', () => {
  const maps = {
    'колебательный режим': { R: 12, F: 3, A: 8 },
    'критический режим': { R: 10, F: 10, A: 10 },
    'вязкий режим': { R: 6, F: 18, A: 14 },
  };

  Object.entries(maps).forEach(([name, map]) => {
    test(`${name}: скачок совпадает с численным интегрированием`, () => {
      const parameters = dynamics.getDynamicsParameters(map);
      const signal = { type: 'step', duration: 0, amplitude: 10 };

      [0.5, 2, 5, 12].forEach((time) => {
        assertClose(
          dynamics.getReactionAt(time, parameters, signal),
          integrate(parameters, () => 10, time),
          1e-4,
          `t=${time}`,
        );
      });
    });

    test(`${name}: импульс совпадает с численным интегрированием`, () => {
      const parameters = dynamics.getDynamicsParameters(map);
      const signal = { type: 'pulse', duration: 3, amplitude: 10 };

      [1, 3, 4, 10].forEach((time) => {
        assertClose(
          dynamics.getReactionAt(time, parameters, signal),
          integrate(parameters, (moment) => (moment < 3 ? 10 : 0), time),
          2e-2,
          `t=${time}`,
        );
      });
    });
  });
});

describe('показатели процесса', () => {
  test('перехлёст при ξ < 1 совпадает с формулой теории', () => {
    const parameters = dynamics.getDynamicsParameters({ R: 10, F: 3, A: 10 });
    const analysis = dynamics.analyzeReaction(parameters, { type: 'step', duration: 0, amplitude: 10 });
    const expected = 100 * Math.exp((-Math.PI * 0.3) / Math.sqrt(1 - 0.09));

    assertClose(analysis.overshootPercent, expected, 1, 'перехлёст');
    assert.ok(analysis.oscillations >= 1);
  });

  test('при F не ниже порога нет колебаний и перехлёста', () => {
    [10, 16].forEach((F) => {
      const parameters = dynamics.getDynamicsParameters({ R: 10, F, A: 10 });
      const analysis = dynamics.analyzeReaction(parameters, { type: 'step', duration: 0, amplitude: 10 });

      assert.equal(analysis.overshootPercent, 0);
      assert.equal(analysis.oscillations, 0);
    });
  });

  test('после импульса реакция возвращается к нулю', () => {
    const parameters = dynamics.getDynamicsParameters({ R: 12, F: 6, A: 8 });
    const signal = { type: 'pulse', duration: 4, amplitude: 10 };
    const { settlingTime } = dynamics.analyzeReaction(parameters, signal);

    assert.ok(settlingTime > 4);
    assertClose(dynamics.getReactionAt(settlingTime * 3, parameters, signal), 0, 1e-3, 'остаток');
  });

  test('режимы делятся по ξ', () => {
    assert.equal(dynamics.getDynamicsRegime(0.3).key, 'oscillating');
    assert.equal(dynamics.getDynamicsRegime(0.7).key, 'balanced');
    assert.equal(dynamics.getDynamicsRegime(1).key, 'aperiodic');
  });
});

describe('замечания по группе', () => {
  const row = (name, map, analysis) => ({
    userId: name,
    name,
    map,
    analysis: { settlingTime: 5, overshootPercent: 0, oscillations: 0, peak: 1, ...analysis },
  });

  test('одному человеку замечания по группе не нужны', () => {
    assert.deepEqual(dynamics.buildGroupDynamicsNotes([row('А', { R: 5, F: 5, A: 5 })]), []);
  });

  test('называет высокую фрустрацию и самого медленного', () => {
    const notes = dynamics.buildGroupDynamicsNotes([
      row('Анна', { R: 5, F: 16, A: 5 }, { settlingTime: 9 }),
      row('Борис', { R: 5, F: 5, A: 5 }, { settlingTime: 3 }),
    ]);
    const text = notes.map((note) => note.text).join(' ');

    assert.match(text, /Высокая фрустрация: Анна/);
    assert.match(text, /Дольше всех приходит в норму Анна/);
  });
});
