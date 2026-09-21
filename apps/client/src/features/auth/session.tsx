// Sesión de Firebase Auth. La persistencia (AsyncStorage en Android, navegador en web) se
// configura en src/lib/firebase*.ts; aquí solo se escucha el usuario actual.
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { auth } from '@/lib/firebase';

interface Session {
  user: User | null;
  /** true hasta que Firebase restaura (o descarta) la sesión guardada. */
  isLoading: boolean;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({ user: auth.currentUser, isLoading: true });

  useEffect(() => onAuthStateChanged(auth, (user) => setSession({ user, isLoading: false })), []);

  return <SessionContext value={session}>{children}</SessionContext>;
}

export function useSession(): Session {
  const session = use(SessionContext);
  if (!session) throw new Error('useSession se usa dentro de SessionProvider.');
  return session;
}

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}

export function sendPasswordReset(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email.trim());
}
