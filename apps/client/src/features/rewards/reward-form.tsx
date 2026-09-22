import {
  REWARD_DESCRIPTION_MAX_LENGTH,
  REWARD_NAME_MAX_LENGTH,
  REWARD_TIER_COST_RANGES,
  type RewardRecord,
  type RewardTier,
} from '@ascua/shared';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import type { RewardInput } from '@/operations/rewards';

import { TIER_LABELS, tierRange } from './reward-catalog';
import { hasErrors, validateReward, type RewardDraft } from './reward-validation';

interface RewardFormProps {
  /** Todas las recompensas, para no repetir nombres. */
  rewards: readonly RewardRecord[];
  /** Al editar: la recompensa actual. */
  reward?: RewardRecord;
  onSubmit: (input: RewardInput) => void;
}

const TIERS: RewardTier[] = ['small', 'medium', 'large'];

export function RewardForm({ rewards, reward, onSubmit }: RewardFormProps) {
  const [draft, setDraft] = useState<RewardDraft>({
    name: reward?.name ?? '',
    description: reward?.description ?? '',
    tier: reward?.tier ?? 'small',
    cost: reward ? String(reward.cost) : '',
  });
  const [touched, setTouched] = useState<Partial<Record<keyof RewardDraft, boolean>>>({});
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  const { errors, cost } = validateReward(draft, { rewards, rewardId: reward?.id });
  const visibleError = (field: keyof RewardDraft) =>
    hasTriedSubmit || touched[field] ? errors[field] : undefined;
  const touch = (field: keyof RewardDraft) => () =>
    setTouched((current) => ({ ...current, [field]: true }));

  function update<Field extends keyof RewardDraft>(field: Field, value: RewardDraft[Field]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit() {
    setHasTriedSubmit(true);
    if (hasErrors(errors) || cost === null) return;
    onSubmit({ name: draft.name, description: draft.description, tier: draft.tier, cost });
  }

  const range = REWARD_TIER_COST_RANGES[draft.tier];

  return (
    <View className="gap-6">
      <View className="gap-4">
        <TextField
          label="Nombre"
          value={draft.name}
          onChangeText={(value) => update('name', value)}
          onBlur={touch('name')}
          maxLength={REWARD_NAME_MAX_LENGTH}
          placeholder="Ej.: Ir al cine"
          autoCapitalize="sentences"
          error={visibleError('name')}
          hint={`${draft.name.trim().length}/${REWARD_NAME_MAX_LENGTH}`}
        />
        <TextField
          label="Descripción (opcional)"
          value={draft.description}
          onChangeText={(value) => update('description', value)}
          onBlur={touch('description')}
          maxLength={REWARD_DESCRIPTION_MAX_LENGTH}
          multiline
          autoCapitalize="sentences"
          error={visibleError('description')}
          hint={`${draft.description.trim().length}/${REWARD_DESCRIPTION_MAX_LENGTH}`}
        />
      </View>

      <View className="gap-2">
        <Text className="font-body-bold text-caption text-ink-muted">Nivel</Text>
        <View accessibilityRole="radiogroup" className="flex-row gap-2">
          {TIERS.map((tier) => {
            const isSelected = tier === draft.tier;
            return (
              <Pressable
                key={tier}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                onPress={() => update('tier', tier)}
                className={`min-h-14 flex-1 items-center justify-center rounded-md border-2 px-1 py-2 active:opacity-85 ${isSelected ? 'border-ember-strong bg-warning-soft' : 'border-border bg-surface-200'}`}
              >
                <Text
                  className={`font-body-extrabold text-button ${isSelected ? 'text-ember-strong' : 'text-ink-muted'}`}
                >
                  {TIER_LABELS[tier].singular}
                </Text>
                <Text className="font-body-semibold text-caption text-ink-muted">
                  {tierRange(tier)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <TextField
        label="Costo en puntos"
        value={draft.cost}
        onChangeText={(value) => update('cost', value.replace(/[^\d]/g, ''))}
        onBlur={touch('cost')}
        keyboardType="number-pad"
        placeholder={`Sugerido: ${range.min}–${range.max}`}
        error={visibleError('cost')}
        hint="El rango del nivel es una sugerencia"
      />

      <View className="gap-2">
        {hasTriedSubmit && hasErrors(errors) && (
          <Text accessibilityRole="alert" className="font-body-bold text-caption text-error">
            Revisa los campos marcados antes de guardar.
          </Text>
        )}
        <Button label="Guardar" onPress={handleSubmit} />
      </View>
    </View>
  );
}
