import type { RewardRecord } from '@ascua/shared';
import { describe, expect, it } from '@jest/globals';

import { hasErrors, validateReward } from './reward-validation';

const existing = {
  id: 'r1',
  name: 'Ir al cine',
  description: null,
  icon: 'star',
  tier: 'large',
  cost: 550,
  status: 'active',
  sortOrder: 0,
} satisfies RewardRecord;

const valid = { name: 'Pedir delivery', description: '', tier: 'medium' as const, cost: '200' };

describe('validateReward', () => {
  it('accepts a valid reward and returns the parsed cost', () => {
    const result = validateReward(valid, { rewards: [existing] });
    expect(result.errors).toEqual({});
    expect(result.cost).toBe(200);
    expect(hasErrors(result.errors)).toBe(false);
  });

  it('requires a name of at least 2 characters and at most 60', () => {
    expect(validateReward({ ...valid, name: '  ' }, { rewards: [] }).errors.name).toBe(
      'Escribe un nombre para tu recompensa.',
    );
    expect(validateReward({ ...valid, name: 'a' }, { rewards: [] }).errors.name).toBe(
      'El nombre necesita al menos 2 caracteres.',
    );
    expect(validateReward({ ...valid, name: 'a'.repeat(61) }, { rewards: [] }).errors.name).toBe(
      'El nombre puede tener hasta 60 caracteres.',
    );
  });

  it('rejects the name of another active reward, but not when editing that one', () => {
    const duplicate = { ...valid, name: ' ir al CINE ' };
    expect(validateReward(duplicate, { rewards: [existing] }).errors.name).toBe(
      'Ya tienes una recompensa activa con ese nombre.',
    );
    expect(validateReward(duplicate, { rewards: [existing], rewardId: 'r1' }).errors).toEqual({});
  });

  it('asks for a whole, positive cost', () => {
    const message = 'Escribe un costo en puntos: un número entero mayor que 0.';
    for (const cost of ['', '0', '-5', '12.5', 'diez']) {
      expect(validateReward({ ...valid, cost }, { rewards: [] }).errors.cost).toBe(message);
    }
  });

  it('limits the cost to one million points', () => {
    expect(validateReward({ ...valid, cost: '1000001' }, { rewards: [] }).errors.cost).toBe(
      'El costo puede ser de hasta 1000000 pts.',
    );
  });

  it('limits the description to 200 characters', () => {
    expect(
      validateReward({ ...valid, description: 'a'.repeat(201) }, { rewards: [] }).errors
        .description,
    ).toBe('La descripción puede tener hasta 200 caracteres.');
  });
});
