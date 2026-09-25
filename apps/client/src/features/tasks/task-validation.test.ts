import { TASK_TITLE_MAX_LENGTH, TASK_TITLE_MIN_LENGTH } from '@ascua/shared';
import { describe, expect, it } from '@jest/globals';

import { hasTaskErrors, validateTask, type TaskDraft } from './task-validation';

const TODAY = '2026-09-25';

function draft(overrides: Partial<TaskDraft> = {}): TaskDraft {
  return { title: 'Pagar la luz', size: 'medium', dueDateKey: TODAY, ...overrides };
}

describe('validateTask', () => {
  it('accepts a task for today or later', () => {
    expect(hasTaskErrors(validateTask(draft(), TODAY))).toBe(false);
    expect(hasTaskErrors(validateTask(draft({ dueDateKey: '2026-10-01' }), TODAY))).toBe(false);
  });

  it('asks for a title of the right length', () => {
    expect(validateTask(draft({ title: '   ' }), TODAY).title).toBe(
      'Escribe qué tienes que hacer.',
    );
    expect(validateTask(draft({ title: 'a' }), TODAY).title).toBe(
      `El título necesita al menos ${TASK_TITLE_MIN_LENGTH} caracteres.`,
    );
    expect(validateTask(draft({ title: 'x'.repeat(TASK_TITLE_MAX_LENGTH + 1) }), TODAY).title).toBe(
      `El título puede tener hasta ${TASK_TITLE_MAX_LENGTH} caracteres.`,
    );
  });

  it('rejects a date in the past, unless it is the one the task already had', () => {
    expect(validateTask(draft({ dueDateKey: '2026-09-24' }), TODAY).dueDateKey).toBe(
      'Elige hoy o un día que venga.',
    );
    // Editar una vencida sin moverla: conserva su fecha.
    expect(validateTask(draft({ dueDateKey: '2026-09-20' }), TODAY, '2026-09-20').dueDateKey).toBe(
      undefined,
    );
  });
});
