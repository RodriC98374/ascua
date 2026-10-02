import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { closingErrorKind } from './closing-summary';
import { CLOSING_RETRY_DELAYS_MS, closingRetryDelayMs, withTimeout } from './closing-retry';

describe('closingRetryDelayMs', () => {
  it('waits a little after the first failure and longer after each one', () => {
    const delays = CLOSING_RETRY_DELAYS_MS.map((_, failures) => closingRetryDelayMs(failures));

    expect(delays).toEqual([...CLOSING_RETRY_DELAYS_MS]);
    expect(delays).toEqual([...delays].sort((a, b) => (a ?? 0) - (b ?? 0)));
  });

  it('gives up once every delay was used', () => {
    expect(closingRetryDelayMs(CLOSING_RETRY_DELAYS_MS.length)).toBeNull();
    expect(closingRetryDelayMs(CLOSING_RETRY_DELAYS_MS.length + 5)).toBeNull();
  });
});

describe('withTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves with the value when the promise settles in time', async () => {
    await expect(withTimeout(Promise.resolve('closed'), 1000)).resolves.toBe('closed');
  });

  it('passes the original error through when the promise fails in time', async () => {
    const failure = Object.assign(new Error('rules'), { code: 'permission-denied' });

    await expect(withTimeout(Promise.reject(failure), 1000)).rejects.toBe(failure);
  });

  it('rejects as unavailable when the promise never settles, so it is retried like a lost connection', async () => {
    const result = withTimeout(new Promise<never>(() => {}), 1000);
    const assertion = result.catch((error: unknown) => closingErrorKind(error));

    jest.advanceTimersByTime(1000);

    await expect(assertion).resolves.toBe('offline');
  });

  it('does not leave a pending timer after the promise settles', async () => {
    await withTimeout(Promise.resolve('closed'), 1000);

    expect(jest.getTimerCount()).toBe(0);
  });
});
