import { describe, expect, it } from 'vitest';

import { APP_TIME_ZONE } from './constants';

describe('APP_TIME_ZONE', () => {
  it('is a time zone the runtime recognizes', () => {
    expect(() => new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIME_ZONE })).not.toThrow();
  });
});
