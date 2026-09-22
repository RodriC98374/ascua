import { describe, expect, it } from '@jest/globals';

import { validateEmail, validatePassword } from './credentials-validation';

describe('validateEmail', () => {
  it('accepts a well-formed email, ignoring surrounding spaces', () => {
    expect(validateEmail('persona@ejemplo.com')).toBeNull();
    expect(validateEmail('  persona@ejemplo.com ')).toBeNull();
  });

  it('asks for an email when it is empty', () => {
    expect(validateEmail('   ')).toBe('Escribe tu correo.');
  });

  it('rejects an email without a valid format', () => {
    const message = 'Revisa el correo: no tiene un formato válido.';
    expect(validateEmail('persona')).toBe(message);
    expect(validateEmail('persona@ejemplo')).toBe(message);
    expect(validateEmail('per sona@ejemplo.com')).toBe(message);
  });
});

describe('validatePassword', () => {
  it('asks for a password when it is empty', () => {
    expect(validatePassword('')).toBe('Escribe tu contraseña.');
  });

  it('accepts any non-empty password (Firebase decides whether it is right)', () => {
    expect(validatePassword(' ')).toBeNull();
    expect(validatePassword('secreta')).toBeNull();
  });
});
