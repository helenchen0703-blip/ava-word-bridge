// modules/social-studies.js — Social Studies Module STUB (Ava BRIDGE Learning Agent)
// See modules/math.js for why this is a registered stub in v1, not a full pathway.

const SOCIAL_STUDIES_DIMENSIONS = [
  { key: 'concept', category: ROADBLOCK_CATEGORY.CONCEPT },
  { key: 'independence', category: ROADBLOCK_CATEGORY.INDEPENDENCE }
];

const SOCIAL_STUDIES_INTAKE_SCHEMA = [
  { id: 'taskText', type: 'textarea', label: 'Authentic Task (paste verbatim)', required: true },
  { id: 'actionWords', type: 'checklist', label: 'What is the task asking Ava to do?',
    options: ['EXPLAIN', 'ARGUE', 'DESCRIBE'], required: true },
  { id: 'keyTermsExpected', type: 'chipList', label: 'Key terms (2-4)', required: true, min: 2 }
];

ModuleRegistry.register({
  subject: 'SOCIAL_STUDIES',
  label: 'Social Studies',
  intakeSchema: SOCIAL_STUDIES_INTAKE_SCHEMA,
  dimensionManifest: SOCIAL_STUDIES_DIMENSIONS,
  experienceId: 'socialStudies.generic',
  firstCheckpointId: 'COMING_SOON',
  checkpoints: {
    COMING_SOON: {
      dimensionKey: 'concept',
      prompt: () => 'The Social Studies Module is registered but not yet built end-to-end — this task is saved and will run once it is.',
      evaluator: () => ({ succeeded: false, statusAfter: BRIDGE_STATUS.UNKNOWN, confidence: 'HIGH', responseSummary: '', ruleId: 'ruleModuleNotYetBuilt', evidenceNote: 'Social Studies Module stub — schema and registry wiring only.' })
    }
  },
  route: { COMING_SOON: () => null },
  scaffoldContent: () => ({ text: '', action: 'NONE' })
});
