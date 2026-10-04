// Автоматичні тести етапу 1. Не змінюйте цей файл.
// Запуск: npm test
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const CLI = path.join(__dirname, '..', 'src', 'cli.js');
const run = (...args) => {
  const r = spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', timeout: 5000 });
  return { code: r.status, out: r.stdout.trim(), err: r.stderr.trim() };
};
const ok = (args, expected) => {
  const r = run(...args);
  assert.equal(r.code, 0, `код виходу для «${args.join(' ')}» має бути 0, stderr: ${r.err}`);
  assert.equal(r.out, expected, `вивід для «${args.join(' ')}»`);
};
const fail = (args, code) => {
  const r = run(...args);
  assert.equal(r.code, code, `код виходу для «${args.join(' ')}» має бути ${code}`);
  assert.equal(r.out, '', 'при помилці stdout має бути порожнім');
  assert.match(r.err, /^Error:/, 'повідомлення про помилку має починатися з «Error:» і виводитися в stderr');
};

describe('операції', () => {
  test('sum', () => { ok(['sum', '1', '2', '3'], '6'); ok(['sum', '-5', '5'], '0'); ok(['sum', '0.1', '0.2'], '0.3'); });
  test('avg', () => { ok(['avg', '2', '4', '9'], '5'); ok(['avg', '1', '2'], '1.5'); ok(['avg', '1', '1', '2'], '1.33'); });
  test('min', () => { ok(['min', '3', '-1', '2'], '-1'); ok(['min', '7'], '7'); });
  test('max', () => { ok(['max', '3', '-1', '2'], '3'); ok(['max', '2.5', '2.49'], '2.5'); });
  test('median (непарна кількість)', () => { ok(['median', '5', '1', '3'], '3'); });
  test('median (парна кількість)', () => { ok(['median', '4', '1', '3', '2'], '2.5'); });
  test('одне число', () => { ok(['avg', '42'], '42'); ok(['median', '-7'], '-7'); });
});

describe('довідка', () => {
  for (const flag of ['--help', '-h']) {
    test(flag, () => {
      const r = run(flag);
      assert.equal(r.code, 0);
      assert.match(r.out, /Usage:/, 'довідка має містити рядок «Usage:»');
      for (const op of ['sum', 'avg', 'min', 'max', 'median']) assert.match(r.out, new RegExp(op), `довідка має згадувати ${op}`);
    });
  }
});

describe('помилки та коди виходу', () => {
  test('немає аргументів → код 1', () => fail([], 1));
  test('невідома операція → код 1', () => { fail(['mul', '1', '2'], 1); fail(['SUM', '1'], 1); });
  test('немає чисел → код 2', () => { fail(['sum'], 2); fail(['median'], 2); });
  test('некоректне число → код 3', () => {
    fail(['sum', '1', 'abc'], 3);
    fail(['avg', '1,5'], 3);
    fail(['max', '12px'], 3);
    fail(['min', ''], 3);
    fail(['sum', 'NaN'], 3);
    fail(['sum', 'Infinity'], 3);
  });
});
