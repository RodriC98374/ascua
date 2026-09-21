// Referencias tipadas a los documentos de Firestore y los campos comunes de todo documento.
// Sin imports con alias (`@/`): las operaciones se prueban también desde packages/firestore-rules.
import type { GamificationState, UserProfile } from '@ascua/shared';
import {
  doc,
  serverTimestamp,
  type DocumentData,
  type DocumentReference,
  type Firestore,
  type FirestoreDataConverter,
} from 'firebase/firestore';

/** Versión del esquema de los documentos que escribe esta versión de la app. */
export const SCHEMA_VERSION = 1;

/** Campos que las reglas exigen al crear un documento (timestamps del servidor). */
export function newDocumentFields() {
  return {
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    schemaVersion: SCHEMA_VERSION,
  };
}

/**
 * Traduce un documento a su tipo de dominio de `@ascua/shared`, quitando los metadatos.
 * Las escrituras las arman las operaciones (con `newDocumentFields`), así que `toFirestore`
 * deja pasar los datos tal cual.
 */
function domainConverter<T extends object>(): FirestoreDataConverter<T, DocumentData> {
  return {
    toFirestore: (data) => data as DocumentData,
    fromFirestore: (snapshot, options) => {
      const {
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        schemaVersion: _schemaVersion,
        ...data
      } = snapshot.data(options);
      return data as T;
    },
  };
}

export const userProfileConverter = domainConverter<UserProfile>();
export const gamificationConverter = domainConverter<GamificationState>();

export function userProfileRef(db: Firestore, uid: string): DocumentReference<UserProfile> {
  return doc(db, 'users', uid).withConverter(userProfileConverter);
}

export function gamificationRef(db: Firestore, uid: string): DocumentReference<GamificationState> {
  return doc(db, 'users', uid, 'meta', 'gamification').withConverter(gamificationConverter);
}
