// Suscripciones en tiempo real (onSnapshot). Incluyen los cambios de metadatos para saber si hay
// escrituras locales pendientes de sincronizar.
import { onSnapshot, type DocumentReference, type Query } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export interface DocumentState<T> {
  data: T | undefined;
  exists: boolean;
  isLoading: boolean;
  hasPendingWrites: boolean;
}

/** `key` identifica la referencia: las referencias se recrean en cada render. */
export function useDocument<T>(ref: DocumentReference<T>, key: string): DocumentState<T> {
  const [state, setState] = useState<DocumentState<T> & { key: string }>({
    key,
    data: undefined,
    exists: false,
    isLoading: true,
    hasPendingWrites: false,
  });

  useEffect(
    () =>
      onSnapshot(
        ref,
        { includeMetadataChanges: true },
        (snapshot) =>
          setState({
            key,
            data: snapshot.data(),
            exists: snapshot.exists(),
            isLoading: false,
            hasPendingWrites: snapshot.metadata.hasPendingWrites,
          }),
        (error) => console.error(`Suscripción a ${key} falló`, error),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` identifica a `ref`.
    [key],
  );

  // Al cambiar de documento (p. ej. a medianoche), no mostrar datos del anterior.
  if (state.key !== key) {
    return { data: undefined, exists: false, isLoading: true, hasPendingWrites: false };
  }
  return state;
}

export interface QueryState<T> {
  data: T[];
  isLoading: boolean;
  hasPendingWrites: boolean;
}

export function useQuery<T>(query: Query<T>, key: string): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({
    data: [],
    isLoading: true,
    hasPendingWrites: false,
  });

  useEffect(
    () =>
      onSnapshot(
        query,
        { includeMetadataChanges: true },
        (snapshot) =>
          setState({
            data: snapshot.docs.map((document) => document.data()),
            isLoading: false,
            hasPendingWrites: snapshot.metadata.hasPendingWrites,
          }),
        (error) => console.error(`Suscripción a ${key} falló`, error),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` identifica a `query`.
    [key],
  );

  return state;
}
