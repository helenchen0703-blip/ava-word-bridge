// core/task-analyzer.js — Ava BRIDGE Learning Agent, Step 1 "Understand the Task"
// No NLP claim is made anywhere in this file. Two mechanical steps only:
//   1. Schema validation — every required/min constraint on the Module's
//      intakeSchema must be satisfied before a task is READY.
//   2. Subject routing — direct registry lookup on an explicit subject; for
//      AUTO_UNSURE, Core asks the teacher to confirm rather than guessing.
// "If uncertain: ASK THE TEACHER. Do not pretend certainty" is enforced here,
// structurally, before Ava ever sees the task.

function validateAgainstSchema(schema, moduleIntakeData) {
  const missing = [];
  schema.forEach(field => {
    const value = moduleIntakeData[field.id];
    if (field.required) {
      const isEmpty =
        value === undefined || value === null ||
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0);
      if (isEmpty) { missing.push(field.label); return; }
    }
    if (field.min && Array.isArray(value) && value.length < field.min) {
      missing.push(`${field.label} (need at least ${field.min})`);
    }
  });
  return { valid: missing.length === 0, missing };
}

// Returns { status: 'READY' | 'NEEDS_TEACHER_INPUT' | 'NEEDS_SUBJECT_CONFIRMATION',
//           module, missingFields }
function analyzeTask(taskRecord) {
  if (!taskRecord.subject || taskRecord.subject === 'AUTO_UNSURE') {
    return { status: 'NEEDS_SUBJECT_CONFIRMATION', module: null, missingFields: [] };
  }
  const module = ModuleRegistry.get(taskRecord.subject);
  if (!module) {
    return { status: 'NEEDS_TEACHER_INPUT', module: null, missingFields: [`Unknown subject: ${taskRecord.subject}`] };
  }
  const { valid, missing } = validateAgainstSchema(module.intakeSchema, taskRecord.moduleIntakeData || {});
  if (!valid) {
    return { status: 'NEEDS_TEACHER_INPUT', module, missingFields: missing };
  }
  return { status: 'READY', module, missingFields: [] };
}
