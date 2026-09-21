import type { User } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { db } from '@/lib/firebase';
import { initializeAccount } from '@/operations/initialize-account';

export type AccountStatus = 'initializing' | 'ready' | 'error';

/** Ejecuta initializeAccount al entrar; la app no se muestra hasta que la cuenta está lista. */
export function useAccountInitialization(user: User) {
  const [status, setStatus] = useState<AccountStatus>('initializing');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    initializeAccount(db, { uid: user.uid, email: user.email ?? '' }).then(
      () => isCurrent && setStatus('ready'),
      (error: unknown) => {
        console.error('initializeAccount falló', error);
        if (isCurrent) setStatus('error');
      },
    );
    return () => {
      isCurrent = false;
    };
  }, [user.uid, user.email, attempt]);

  function retry() {
    setStatus('initializing');
    setAttempt((value) => value + 1);
  }

  return { status, retry };
}
