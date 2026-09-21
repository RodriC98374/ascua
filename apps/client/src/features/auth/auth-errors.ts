// Traduce los errores de Firebase Auth a mensajes para el usuario.

const WRONG_CREDENTIALS = 'El correo o la contraseña no son correctos.';

const SIGN_IN_MESSAGES: Readonly<Record<string, string>> = {
  // Sin distinguir cuál de los dos falló: así no se revela qué correos existen.
  'auth/invalid-credential': WRONG_CREDENTIALS,
  'auth/wrong-password': WRONG_CREDENTIALS,
  'auth/user-not-found': WRONG_CREDENTIALS,
  'auth/invalid-email': 'Revisa el correo: no tiene un formato válido.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.',
  'auth/network-request-failed': 'No hay conexión. Revisa tu internet y vuelve a intentarlo.',
};

function errorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return typeof error.code === 'string' ? error.code : undefined;
  }
  return undefined;
}

export function signInErrorMessage(error: unknown): string {
  const code = errorCode(error);
  return (code && SIGN_IN_MESSAGES[code]) || 'No se pudo iniciar sesión. Vuelve a intentarlo.';
}

/**
 * Mensaje para un error al pedir el correo de recuperación, o `null` si la pantalla debe
 * mostrarse como enviada: una cuenta inexistente no se revela.
 */
export function passwordResetErrorMessage(error: unknown): string | null {
  const code = errorCode(error);
  if (code === 'auth/user-not-found') return null;
  if (
    code === 'auth/invalid-email' ||
    code === 'auth/too-many-requests' ||
    code === 'auth/network-request-failed'
  ) {
    return SIGN_IN_MESSAGES[code] ?? null;
  }
  return 'No se pudo enviar el correo. Vuelve a intentarlo.';
}
