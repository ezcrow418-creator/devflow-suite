/* ========================================
   DevFlow Suite — Minimal Test Runner
   No dependencies. Runs in the browser.
   ======================================== */

const TestRunner = {
  suites: [],
  _current: null,
  _passed: 0,
  _failed: 0,
  _total: 0,

  describe(name, fn) {
    this._current = { name, tests: [] };
    fn();
    this.suites.push(this._current);
    this._current = null;
  },

  it(name, fn) {
    if (!this._current) return;
    this._current.tests.push({ name, fn });
  },

  // Assertion helpers
  expect(actual) {
    return {
      toBe(expected) {
        if (actual !== expected) {
          throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        }
      },
      toEqual(expected) {
        const a = JSON.stringify(actual);
        const b = JSON.stringify(expected);
        if (a !== b) {
          throw new Error(`Expected ${b}, got ${a}`);
        }
      },
      toBeTruthy() {
        if (!actual) {
          throw new Error(`Expected truthy, got ${JSON.stringify(actual)}`);
        }
      },
      toBeFalsy() {
        if (actual) {
          throw new Error(`Expected falsy, got ${JSON.stringify(actual)}`);
        }
      },
      toContain(expected) {
        if (typeof actual === 'string') {
          if (!actual.includes(expected)) {
            throw new Error(`Expected "${actual}" to contain "${expected}"`);
          }
        } else if (Array.isArray(actual)) {
          if (!actual.includes(expected)) {
            throw new Error(`Expected array to contain ${JSON.stringify(expected)}`);
          }
        }
      },
      toThrow() {
        if (typeof actual !== 'function') {
          throw new Error(`Expected a function, got ${typeof actual}`);
        }
        try {
          actual();
          throw new Error('Expected function to throw, but it did not');
        } catch (e) {
          if (e.message === 'Expected function to throw, but it did not') throw e;
          // Threw as expected
        }
      },
      not: {
        toBe(expected) {
          if (actual === expected) {
            throw new Error(`Expected NOT ${JSON.stringify(expected)}, but got it`);
          }
        },
        toContain(expected) {
          if (typeof actual === 'string' && actual.includes(expected)) {
            throw new Error(`Expected "${actual}" NOT to contain "${expected}"`);
          }
        },
      },
    };
  },

  // Run all tests
  async run(containerId = 'test-results') {
    const container = document.getElementById(containerId);
    if (!container) return;

    this._passed = 0;
    this._failed = 0;
    this._total = 0;

    container.innerHTML = '';

    for (const suite of this.suites) {
      const suiteEl = document.createElement('div');
      suiteEl.className = 'suite';
      suiteEl.innerHTML = `<h3 class="suite-name">${suite.name}</h3>`;
      container.appendChild(suiteEl);

      for (const test of suite.tests) {
        this._total++;
        const testEl = document.createElement('div');
        testEl.className = 'test';

        try {
          await test.fn();
          this._passed++;
          testEl.classList.add('pass');
          testEl.innerHTML = `<span class="icon">✓</span> ${test.name}`;
        } catch (e) {
          this._failed++;
          testEl.classList.add('fail');
          testEl.innerHTML = `<span class="icon">✗</span> ${test.name}<span class="error">${e.message}</span>`;
        }
        suiteEl.appendChild(testEl);
      }
    }

    // Summary
    const summary = document.createElement('div');
    summary.className = 'summary';
    summary.innerHTML = `
      <span class="passed">${this._passed} passed</span>
      ${this._failed > 0 ? `<span class="failed">${this._failed} failed</span>` : ''}
      <span class="total">${this._total} total</span>
    `;
    container.appendChild(summary);

    // Update page title
    document.title = `Tests: ${this._passed}/${this._total}` + (this._failed > 0 ? ' ✗' : ' ✓');

    return { passed: this._passed, failed: this._failed, total: this._total };
  }
};

// Shorthand aliases
const describe = (name, fn) => TestRunner.describe(name, fn);
const it = (name, fn) => TestRunner.it(name, fn);
const expect = (actual) => TestRunner.expect(actual);
