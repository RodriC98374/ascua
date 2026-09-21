import { describe, expect, it } from '@jest/globals';

import { emulatorConfig, firebaseConfig } from './firebase';

describe('firebase config', () => {
  it('points to the ascua project', () => {
    expect(firebaseConfig.projectId).toBe('ascua-a9e27');
  });

  it('keeps emulators disabled unless explicitly requested', () => {
    expect(emulatorConfig.enabled).toBe(false);
  });
});
