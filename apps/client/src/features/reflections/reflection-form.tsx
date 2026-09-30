import {
  isReflectionAnswered,
  REFLECTION_ANSWER_MAX_LENGTH,
  type ReflectionQuestion,
  type WeeklyReflection,
} from '@ascua/shared';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ScreenFooter } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import type { ReflectionAnswers } from '@/operations/reflections';

const QUESTIONS: { key: ReflectionQuestion; label: string; placeholder: string }[] = [
  {
    key: 'wentWell',
    label: '¿Qué salió bien?',
    placeholder: 'Ej.: Leí todas las noches, aunque fuera poco.',
  },
  {
    key: 'wasHard',
    label: '¿Qué te costó?',
    placeholder: 'Ej.: El miércoles se me cruzaron las entregas.',
  },
  {
    key: 'nextFocus',
    label: '¿En qué te enfocas la próxima semana?',
    placeholder: 'Ej.: Acostarme antes de las 23:00.',
  },
];

/** Las tres preguntas. Basta con contestar una; guardar vuelve a Metas. */
export function ReflectionForm({
  reflection,
  onSubmit,
}: {
  reflection: WeeklyReflection | undefined;
  onSubmit: (answers: ReflectionAnswers) => void;
}) {
  const [answers, setAnswers] = useState<ReflectionAnswers>({
    wentWell: reflection?.wentWell ?? '',
    wasHard: reflection?.wasHard ?? '',
    nextFocus: reflection?.nextFocus ?? '',
  });
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const isAnswered = isReflectionAnswered(answers);

  function handleSubmit() {
    setHasTriedSubmit(true);
    if (isAnswered) onSubmit(answers);
  }

  return (
    <View className="gap-5">
      {QUESTIONS.map((question) => (
        <TextField
          key={question.key}
          label={question.label}
          value={answers[question.key]}
          onChangeText={(value) => setAnswers((current) => ({ ...current, [question.key]: value }))}
          placeholder={question.placeholder}
          maxLength={REFLECTION_ANSWER_MAX_LENGTH}
          multiline
          autoCapitalize="sentences"
          hint={`${answers[question.key].trim().length}/${REFLECTION_ANSWER_MAX_LENGTH}`}
        />
      ))}
      <ScreenFooter>
        <View className="gap-2">
          {hasTriedSubmit && !isAnswered && (
            <Text accessibilityRole="alert" className="font-body-bold text-caption text-error">
              Contesta al menos una pregunta para guardarla.
            </Text>
          )}
          <Button label="Guardar reflexión" onPress={handleSubmit} />
        </View>
      </ScreenFooter>
    </View>
  );
}
