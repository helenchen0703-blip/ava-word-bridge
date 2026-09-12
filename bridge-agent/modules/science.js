// modules/science.js — Science Module STUB (Ava BRIDGE Learning Agent)
// See modules/math.js for why this is a registered stub in v1, not a full pathway.

const SCIENCE_DIMENSIONS = [
  { key: 'concept', category: ROADBLOCK_CATEGORY.CONCEPT },
  { key: 'independence', category: ROADBLOCK_CATEGORY.INDEPENDENCE }
];

const SCIENCE_INTAKE_SCHEMA = [
  { id: 'taskText', type: 'textarea', label: 'Authentic Task (paste verbatim)', required: true },
  { id: 'keyTermsExpected', type: 'chipList', label: 'Key science terms (2-4)', required: true, min: 2 }
];

ModuleRegistry.register({
  subject: 'SCIENCE',
  label: 'Science',
  intakeSchema: SCIENCE_INTAKE_SCHEMA,
  dimensionManifest: SCIENCE_DIMENSIONS,
  experienceId: 'science.generic',
  firstCheckpointId: 'COMING_SOON',
  checkpoints: {
    COMING_SOON: {
      dimensionKey: 'concept',
      prompt: () => 'The Science Module is registered but not yet built end-to-end — this task is saved and will run once it is.',
      evaluator: () => ({ succeeded: false, statusAfter: BRIDGE_STATUS.UNKNOWN, confidence: 'HIGH', responseSummary: '', ruleId: 'ruleModuleNotYetBuilt', evidenceNote: 'Science Module stub — schema and registry wiring only.' })
    }
  },
  route: { COMING_SOON: () => null },
  scaffoldContent: () => ({ text: '', action: 'NONE' })
});
