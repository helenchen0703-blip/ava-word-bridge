// modules/math.js — Math Module STUB (Ava BRIDGE Learning Agent)
// Registered but not built end-to-end in v1 (see plan's MVP boundary). This
// exists so ModuleRegistry/task-analyzer/intake-form-renderer can be proven
// generic across all five subjects without special-casing any of them — a
// teacher can pick Math today and get an honest "coming soon," not a crash
// or a fake diagnostic.

const MATH_DIMENSIONS = [
  { key: 'taskLanguage', category: ROADBLOCK_CATEGORY.LANGUAGE },
  { key: 'independence', category: ROADBLOCK_CATEGORY.INDEPENDENCE }
];

const MATH_INTAKE_SCHEMA = [
  { id: 'taskText', type: 'textarea', label: 'Authentic Task (paste the word problem verbatim)', required: true },
  { id: 'actionWords', type: 'checklist', label: 'What is the problem asking Ava to do?',
    options: ['EXPLAIN', 'ARGUE', 'DESCRIBE'], required: true },
  { id: 'literalQuestion', type: 'text', label: 'The literal question being asked', required: true },
  { id: 'expectedOperations', type: 'checklist', label: 'Expected operation(s)', options: ['+', '-', '×', '÷'], required: true }
];

ModuleRegistry.register({
  subject: 'MATH',
  label: 'Math',
  intakeSchema: MATH_INTAKE_SCHEMA,
  dimensionManifest: MATH_DIMENSIONS,
  experienceId: 'math.generic',
  firstCheckpointId: 'COMING_SOON',
  checkpoints: {
    COMING_SOON: {
      dimensionKey: 'taskLanguage',
      prompt: () => 'The Math Module is registered but not yet built end-to-end — this task is saved and will run once it is.',
      evaluator: () => ({ succeeded: false, statusAfter: BRIDGE_STATUS.UNKNOWN, confidence: 'HIGH', responseSummary: '', ruleId: 'ruleModuleNotYetBuilt', evidenceNote: 'Math Module stub — schema and registry wiring only.' })
    }
  },
  route: { COMING_SOON: () => null },
  scaffoldContent: () => ({ text: '', action: 'NONE' })
});
