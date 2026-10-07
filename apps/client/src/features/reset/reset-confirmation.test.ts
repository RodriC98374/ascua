import { describe, expect, it } from '@jest/globals';

import { isResetConfirmed } from './reset-confirmation';

describe('isResetConfirmed', () => {
  it('accepts the confirmation word in any case, with spaces around it', () => {
    expect(isResetConfirmed('REINICIAR')).toBe(true);
    expect(isResetConfirmed('  reiniciar ')).toBe(true);
    expect(isResetConfirmed('Reiniciar')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isResetConfirmed('')).toBe(false);
    expect(isResetConfirmed('reinicia')).toBe(false);
    expect(isResetConfirmed('reiniciar todo')).toBe(false);
    expect(isResetConfirmed('si')).toBe(false);
  });
});
