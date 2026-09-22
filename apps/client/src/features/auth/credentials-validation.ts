// Validación de los formularios de acceso antes de llamar a Firebase.

/** Formato básico: algo@algo.algo, sin espacios. Firebase hace la validación final. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (trimmed === '') return 'Escribe tu correo.';
  if (!EMAIL_PATTERN.test(trimmed)) return 'Revisa el correo: no tiene un formato válido.';
  return null;
}

export function validatePassword(password: string): string | null {
  return password === '' ? 'Escribe tu contraseña.' : null;
}
