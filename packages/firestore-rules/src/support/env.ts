// Entorno de pruebas contra el emulador de Firestore (lo levanta `firebase emulators:exec`).
import { readFileSync } from 'node:fs';

import {
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import type { Firestore } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll } from 'vitest';

/** Usuario dueño de los datos en los tests. */
export const OWNER = 'owner-uid';
export const OWNER_EMAIL = 'owner@example.com';
/** Otro usuario permitido: sirve para probar el aislamiento entre cuentas. */
export const OTHER = 'other-uid';
/** Usuario autenticado pero fuera de la lista de permitidos. */
export const STRANGER = 'stranger-uid';

const RULES_PATH = new URL('../../../../firestore.rules', import.meta.url);

/** Sondas para probar funciones internas de las reglas. Solo existen en los tests. */
const TEST_PROBES = `
    match /probes/dateKeyOf/cases/{id} {
      allow get: if dateKeyOf(resource.data.at) == resource.data.expected;
    }
    match /probes/nextDateKey/cases/{id} {
      allow get: if nextDateKey(resource.data.input) == resource.data.expected;
    }
    match /probes/prevDateKey/cases/{id} {
      allow get: if prevDateKey(resource.data.input) == resource.data.expected;
    }
    match /probes/isDateKey/cases/{id} {
      allow get: if isDateKey(resource.data.input);
    }
    match /probes/constants/cases/{id} {
      allow get: if rulesConstants() == resource.data.expected;
    }
`;

/**
 * Las reglas reales con dos cambios: la lista de permitidos pasa a tener los usuarios de prueba
 * y se agregan las sondas. Todo lo demás es exactamente lo que se despliega.
 */
export function rulesForTests(): string {
  const source = readFileSync(RULES_PATH, 'utf8');
  const allowlist = /function allowedUids\(\) \{\s*return \[[^\]]*\];/;
  const probes = '// ascua:test-probes';
  if (!allowlist.test(source) || !source.includes(probes)) {
    throw new Error('firestore.rules no tiene los marcadores que usan los tests.');
  }
  return source
    .replace(allowlist, `function allowedUids() {\n      return ['${OWNER}', '${OTHER}'];`)
    .replace(probes, TEST_PROBES);
}

let env: RulesTestEnvironment;

/** Registra el ciclo de vida del emulador en el archivo de test que la llama. */
export function useRulesTestEnvironment(): () => RulesTestEnvironment {
  beforeAll(async () => {
    env = await initializeTestEnvironment({
      projectId: 'demo-ascua',
      firestore: { rules: rulesForTests() },
    });
  });
  afterEach(async () => {
    await env.clearFirestore();
  });
  afterAll(async () => {
    await env.cleanup();
  });
  return () => env;
}

// El contexto devuelve la API compat; las funciones modulares la aceptan porque la desenvuelven.
function modular(context: RulesTestContext): Firestore {
  return context.firestore() as unknown as Firestore;
}

export function ownerDb(): Firestore {
  return modular(env.authenticatedContext(OWNER, { email: OWNER_EMAIL }));
}

export function otherDb(): Firestore {
  return modular(env.authenticatedContext(OTHER, { email: 'other@example.com' }));
}

export function strangerDb(): Firestore {
  return modular(env.authenticatedContext(STRANGER, { email: 'stranger@example.com' }));
}

export function anonymousDb(): Firestore {
  return modular(env.unauthenticatedContext());
}

/** Escribe datos saltándose las reglas (estado previo de cada caso). */
export async function seed(write: (db: Firestore) => Promise<unknown>): Promise<void> {
  await env.withSecurityRulesDisabled(async (context) => {
    await write(modular(context));
  });
}
