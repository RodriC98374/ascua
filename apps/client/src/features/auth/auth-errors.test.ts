import { describe, expect, it } from '@jest/globals';

import { passwordResetErrorMessage, signInErrorMessage } from './auth-errors';

const firebaseError = (code: string) => Object.assign(new Error(code), { code });

describe('signInErrorMessage', () => {
  it('uses one message for a wrong email or password, without saying which', () => {
    const message = 'El correo o la contraseña no son correctos.';
    expect(signInErrorMessage(firebaseError('auth/invalid-credential'))).toBe(message);
    expect(signInErrorMessage(firebaseError('auth/wrong-password'))).toBe(message);
    expect(signInErrorMessage(firebaseError('auth/user-not-found'))).toBe(message);
  });

  it('explains an email with an invalid format', () => {
    expect(signInErrorMessage(firebaseError('auth/invalid-email'))).toBe(
      'Revisa el correo: no tiene un formato válido.',
    );
  });

  it('asks to wait after too many attempts', () => {
    expect(signInErrorMessage(firebaseError('auth/too-many-requests'))).toBe(
      'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.',
    );
  });

  it('points to the connection when the network fails', () => {
    expect(signInErrorMessage(firebaseError('auth/network-request-failed'))).toBe(
      'No hay conexión. Revisa tu internet y vuelve a intentarlo.',
    );
  });

  it('falls back to a generic message for anything else', () => {
    const generic = 'No se pudo iniciar sesión. Vuelve a intentarlo.';
    expect(signInErrorMessage(firebaseError('auth/internal-error'))).toBe(generic);
    expect(signInErrorMessage(new Error('boom'))).toBe(generic);
    expect(signInErrorMessage('texto')).toBe(generic);
  });
});

describe('passwordResetErrorMessage', () => {
  it('reports problems the user can fix', () => {
    expect(passwordResetErrorMessage(firebaseError('auth/invalid-email'))).toBe(
      'Revisa el correo: no tiene un formato válido.',
    );
    expect(passwordResetErrorMessage(firebaseError('auth/network-request-failed'))).toBe(
      'No hay conexión. Revisa tu internet y vuelve a intentarlo.',
    );
  });

  it('treats an unknown account as success, so it never reveals which emails exist', () => {
    expect(passwordResetErrorMessage(firebaseError('auth/user-not-found'))).toBeNull();
  });

  it('falls back to a generic message for anything else', () => {
    expect(passwordResetErrorMessage(new Error('boom'))).toBe(
      'No se pudo enviar el correo. Vuelve a intentarlo.',
    );
  });
});
