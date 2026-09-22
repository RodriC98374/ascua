import type { RewardRecord } from '@ascua/shared';
import { describe, expect, it } from '@jest/globals';

import {
  catalogByTier,
  freezeButtonLabel,
  redeemButtonLabel,
  spendErrorMessage,
} from './reward-catalog';

function reward(id: string, tier: RewardRecord['tier'], overrides: Partial<RewardRecord> = {}) {
  return {
    id,
    name: id,
    description: null,
    icon: 'star',
    tier,
    cost: 60,
    status: 'active',
    sortOrder: 0,
    ...overrides,
  } satisfies RewardRecord;
}

describe('catalogByTier', () => {
  it('groups active rewards by tier, from small to large, with the suggested range', () => {
    const groups = catalogByTier([
      reward('cine', 'large', { cost: 550 }),
      reward('anime', 'small'),
      reward('libro', 'medium', { cost: 220 }),
      reward('serie', 'small', { cost: 50 }),
      reward('viejo', 'small', { status: 'archived' }),
    ]);
    expect(
      groups.map((group) => [group.title, group.range, group.rewards.map((r) => r.id)]),
    ).toEqual([
      ['Pequeñas', '50–80 pts', ['anime', 'serie']],
      ['Medianas', '150–250 pts', ['libro']],
      ['Grandes', '500–700 pts', ['cine']],
    ]);
  });

  it('leaves out tiers without rewards', () => {
    expect(catalogByTier([reward('anime', 'small')]).map((group) => group.tier)).toEqual(['small']);
  });
});

describe('button labels', () => {
  it('lets you redeem when the balance is enough, otherwise says how much is missing', () => {
    expect(redeemButtonLabel({ ok: true })).toBe('Canjear');
    expect(redeemButtonLabel({ ok: false, reason: 'insufficient_points', missingPoints: 80 })).toBe(
      'Te faltan 80 pts',
    );
  });

  it('shows the freeze price, the missing points or that the maximum is reached', () => {
    expect(freezeButtonLabel({ ok: true })).toBe('Comprar · 150 pts');
    expect(freezeButtonLabel({ ok: false, reason: 'insufficient_points', missingPoints: 30 })).toBe(
      'Te faltan 30 pts',
    );
    expect(freezeButtonLabel({ ok: false, reason: 'max_freezes_reached' })).toBe(
      'Ya tienes el máximo',
    );
  });
});

describe('spendErrorMessage', () => {
  it('asks for a connection when offline', () => {
    const offline = Object.assign(new Error('offline'), { code: 'unavailable' });
    expect(spendErrorMessage(offline)).toBe(
      'Necesitas conexión a internet para gastar puntos. Vuelve a intentarlo cuando tengas señal.',
    );
  });

  it('explains a spend that is no longer allowed', () => {
    const notAllowed = Object.assign(new Error('insufficient_points'), {
      check: { ok: false, reason: 'insufficient_points', missingPoints: 10 },
    });
    expect(spendErrorMessage(notAllowed)).toBe('Te faltan 10 pts para esto.');
  });

  it('falls back to a generic message', () => {
    expect(spendErrorMessage(new Error('boom'))).toBe(
      'No se pudo completar. Tus puntos no cambiaron; vuelve a intentarlo.',
    );
  });
});
