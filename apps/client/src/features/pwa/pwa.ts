// Android: la app ya está instalada; la web instalable vive en `pwa.web.ts`.

export function startPwa(): void {}

export interface InstallPrompt {
  install: () => Promise<void>;
}

export function useInstallPrompt(): InstallPrompt | null {
  return null;
}
