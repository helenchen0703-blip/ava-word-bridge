// modules/writing.js — Writing Module (Ava BRIDGE Learning Agent)
// Migrated from bridge-rules.js / bridge-agent.js (BRIDGE Writing Agent v1).
// Every literal that used to be a global constant (PROMPT_TEXT, IDEA_CHIPS,
// the /athens/i regex, etc.) now comes from taskRecord.moduleIntakeData —
// this file is the same code whether the task is Athens/Sparta or the water
// cycle vs. the rock cycle. The route graph and NODE-shaped checkpoint ids
// are legitimately Module-owned (Core never sees them by name).

const WRITING_DIMENSIONS = [
  { key: 'taskMeaning', category: ROADBLOCK_CATEGORY.LANGUAGE },
  { key: 'compareContrastConcept', category: ROADBLOCK_CATEGORY.CONCEPT },
  { key: 'evidenceUse', category: ROADBLOCK_CATEGORY.REASONING },
  { key: 'organization', category: ROADBLOCK_CATEGORY.ORGANIZATION },
  { key: 'independence', category: ROADBLOCK_CATEGORY.INDEPENDENCE }
];

const WRITING_INTAKE_SCHEMA = [
  { id: 'taskText', type: 'textarea', label: 'Authentic Task (paste verbatim)', required: true },
  { id: 'keyTermsExpected', type: 'chipList', label: 'Key terms she should reference (2-4, e.g. the two things being compared)', required: true, min: 2 },
  { id: 'actionWords', type: 'checklist', label: 'Action word(s) in the task',
    options: ['COMPARE', 'CONTRAST', 'EXPLAIN', 'DESCRIBE', 'SUMMARIZE'], required: true },
  { id: 'evidenceIdea', type: 'text', label: 'One idea from the text needing evidence', required: true },
  { id: 'evidenceChoices', type: 'repeatable', label: 'Evidence sentence candidates (mark the one that is real evidence)',
    fields: [{ id: 'text', type: 'text' }, { id: 'isEvidence', type: 'checkbox' }], min: 3, required: true },
  { id: 'ideaChips', type: 'repeatable', label: 'Beginning / Middle / Middle / Middle / Ending idea sentences',
    fields: [{ id: 'text', type: 'text' }, { id: 'role', type: 'select', options: ['nose', 'body1', 'body2', 'body3', 'tail'] }],
    min: 3, required: true }
];

const ACTION_WORD_PATTERNS = Object.freeze({
  COMPARE: /compare|similar|alike/i,
  CONTRAST: /contrast|different/i,
  EXPLAIN: /explain|because|reason/i,
  DESCRIBE: /describe|what.*(look|happen)/i,
  SUMMARIZE: /summar(y|ize)|overall|main idea/i
});

function mentionsSelectedActions(text, actionWords) {
  return (actionWords || []).some(w => ACTION_WORD_PATTERNS[w] && ACTION_WORD_PATTERNS[w].test(text));
}
function mentionsAllKeyTerms(text, keyTerms) {
  return (keyTerms || []).length > 0 && (keyTerms || []).every(term => new RegExp(term, 'i').test(text));
}

function evalExplainTask(responseText, taskRecord) {
  const text = (responseText || '').trim();
  const { actionWords, keyTermsExpected } = taskRecord.moduleIntakeData;
  const mentionsAction = mentionsSelectedActions(text, actionWords);
  const mentionsBothSides = mentionsAllKeyTerms(text, keyTermsExpected);
  const substantial = text.length > 20;
  const understands = mentionsAction && mentionsBothSides && substantial;

  return {
    succeeded: understands,
    understands,
    statusAfter: understands ? BRIDGE_STATUS.INDEPENDENT
      : (mentionsAction ? BRIDGE_STATUS.NEEDS_SUPPORT : BRIDGE_STATUS.NEEDS_EVIDENCE),
    confidence: understands ? 'HIGH' : 'LOW', // any non-understanding response triggers the isolation check, never a guess
    responseSummary: text,
    ruleId: understands ? 'ruleTaskMeaningIndependent' : (mentionsAction ? 'ruleTaskMeaningPartialAction' : 'ruleTaskMeaningNoAction'),
    evidenceNote: understands
      ? 'Evidence weakens Task Meaning as a barrier — she named the required action and referenced the key terms unaided.'
      : 'Evidence is not yet conclusive on Task Meaning — running the isolation check to localize the layer.'
  };
}

function isolationMatcher(jsonPayload) {
  let payload;
  try { payload = JSON.parse(jsonPayload); } catch (e) { payload = {}; }
  const same = (payload.sameResponse || '').trim();
  const different = (payload.differentResponse || '').trim();
  const freeTextOk = same.length > 1 && different.length > 1 && same.toLowerCase() !== different.toLowerCase();
  const bothCorrect = payload.compareCorrect === true && payload.contrastCorrect === true;
  const firstTryBoth = (payload.compareAttempts || 0) <= 1 && (payload.contrastAttempts || 0) <= 1;
  const conceptIntact = bothCorrect && freeTextOk;
  return {
    matchesA: conceptIntact,          // A = TASK_LANGUAGE gap (concept intact)
    matchesB: !conceptIntact,         // B = CONCEPT gap
    confidence: (bothCorrect || freeTextOk) ? (firstTryBoth ? 'HIGH' : 'MEDIUM') : 'LOW'
  };
}

function evalBridgeRetry(dimensionKey) {
  return function (responseText, taskRecord) {
    const text = (responseText || '').trim();
    if (dimensionKey === 'taskMeaning') {
      const result = evalExplainTask(text, taskRecord);
      return Object.assign(result, { confidence: 'HIGH' }); // practiced retry, no longer ambiguous
    }
    // CONCEPT_BRIDGE: any substantive explanation counts as a genuine attempt;
    // this checkpoint teaches the word meanings, it isn't re-testing comprehension.
    const succeeded = text.length > 3;
    return {
      succeeded, statusAfter: succeeded ? BRIDGE_STATUS.EMERGING : BRIDGE_STATUS.NEEDS_SUPPORT,
      confidence: 'HIGH', responseSummary: text,
      ruleId: succeeded ? 'ruleConceptBridgeAttempted' : 'ruleConceptBridgeNoResponse',
      evidenceNote: 'Concept Bridge attempt recorded.'
    };
  };
}

function evalEvidenceChoice(responseData) {
  const { correct, attempts } = responseData;
  return {
    succeeded: correct === true,
    hintLevel: attempts > 1 ? 1 : 0,
    statusAfter: correct ? (attempts <= 1 ? BRIDGE_STATUS.INDEPENDENT : BRIDGE_STATUS.EMERGING) : BRIDGE_STATUS.NEEDS_EVIDENCE,
    confidence: 'HIGH',
    responseSummary: `correct=${correct} attempts=${attempts}`,
    attempts,
    ruleId: correct && attempts <= 1 ? 'ruleEvidenceChoiceIndependent' : 'ruleEvidenceChoiceNeededRetries',
    evidenceNote: correct
      ? (attempts <= 1 ? 'Evidence weakens Evidence Use as a barrier — chosen correctly on the first try.' : 'Evidence suggests Evidence Use needed more than one try.')
      : 'Still gathering evidence on Evidence Use.'
  };
}

function evalEvidenceBridge(responseText) {
  const text = (responseText || '').trim();
  const succeeded = text.length > 3;
  return {
    succeeded, statusAfter: succeeded ? BRIDGE_STATUS.EMERGING : BRIDGE_STATUS.NEEDS_SUPPORT,
    confidence: 'HIGH', responseSummary: text,
    ruleId: 'ruleEvidenceBridgeAttempted', evidenceNote: 'Evidence Bridge attempt recorded.'
  };
}

function evalOrganizeCheck(responseData) {
  const { totalAttempts, chipCount } = responseData;
  const organizedWell = totalAttempts <= chipCount;
  return {
    succeeded: organizedWell,
    hintLevel: organizedWell ? 0 : 1,
    statusAfter: organizedWell ? BRIDGE_STATUS.INDEPENDENT : BRIDGE_STATUS.NEEDS_SUPPORT,
    confidence: 'HIGH', responseSummary: `attempts=${totalAttempts} chips=${chipCount}`,
    ruleId: organizedWell ? 'ruleOrganizationIndependent' : 'ruleOrganizationNeedsSupport',
    evidenceNote: organizedWell
      ? 'Evidence weakens Organization as a barrier — every idea was placed correctly on the first try.'
      : 'Evidence suggests Organization needs support.'
  };
}

function evalOrganizationBridge(responseText) {
  const text = (responseText || '').trim();
  const succeeded = text.length > 0;
  return {
    succeeded, statusAfter: succeeded ? BRIDGE_STATUS.EMERGING : BRIDGE_STATUS.NEEDS_SUPPORT,
    confidence: 'HIGH', responseSummary: text,
    ruleId: 'ruleOrganizationBridgeAttempted', evidenceNote: 'Organization Bridge attempt recorded.'
  };
}

function evalReturnToTask(responseText, taskRecord, state) {
  const result = evalExplainTask(responseText, taskRecord);
  const indep = state.dimensions.independence;
  indep.status = result.understands ? BRIDGE_STATUS.INDEPENDENT : indep.status;
  indep.successfulWithoutSupport = result.understands;
  indep.transferBackToAuthenticTask = result.understands;
  return Object.assign(result, { confidence: 'HIGH' });
}

function scaffoldContent(checkpointId, level, taskRecord, lastResortAllowed) {
  const { keyTermsExpected, evidenceIdea } = taskRecord.moduleIntakeData;
  const terms = (keyTermsExpected || []).join(' and ');
  const CONTENT = {
    EXPLAIN_TASK: ['', 'What is this assignment asking you to do?',
      `Break it into parts: think about ${terms}.`,
      `Try starting with: "This assignment is asking me to ______."`,
      `Try saying the whole assignment out loud first, then type it.`,
      'Model sentence: "This assignment is asking me to compare and contrast ' + terms + '."'],
    TASK_MEANING_BRIDGE: ['', 'What TWO things does this assignment want you to look at, and what should you DO with them?',
      `Break it into parts: think about ${terms}.`,
      `Try starting with: "This assignment is asking me to ______."`,
      `Try saying it out loud first, then type it.`,
      'Model sentence given directly, as a last resort.'],
    CONCEPT_BRIDGE: ['', 'What do you think this word means?', 'Look for what is the SAME/DIFFERENT between two things.',
      'A detail is a small, exact fact — not a big idea.', 'Try saying it out loud in your own words first.',
      'Direct definition given, as a last resort.'],
    EVIDENCE_BRIDGE: ['', 'Does this sentence help prove your idea?', `Useful idea: ${evidenceIdea || ''}`,
      'Try starting with: "because..."', 'Try saying your reason out loud first, then type it.',
      'Model explanation given, as a last resort.'],
    ORGANIZATION_BRIDGE: ['', 'Which part tells the main idea, and which are details?',
      'A big shared idea usually starts the paragraph; specific facts go in the middle; a wrap-up ends it.',
      'Try sorting your ideas into Beginning / Middle / Ending before placing them.',
      'Try saying the order out loud first.', 'Placement modeled directly, as a last resort.']
  };
  const arr = CONTENT[checkpointId] || CONTENT.EXPLAIN_TASK;
  const text = level === 5 && !lastResortAllowed ? arr[4] : (arr[level] || arr[arr.length - 1]);
  return { text, action: `LEVEL_${level}_${checkpointId}` };
}

ModuleRegistry.register({
  subject: 'WRITING',
  label: 'Writing',
  intakeSchema: WRITING_INTAKE_SCHEMA,
  dimensionManifest: WRITING_DIMENSIONS,
  experienceId: 'writing.rocketWriting',
  firstCheckpointId: 'EXPLAIN_TASK',
  checkpoints: {
    EXPLAIN_TASK: {
      dimensionKey: 'taskMeaning',
      evaluator: evalExplainTask,
      isolationPair: {
        hypothesisA: 'TASK_LANGUAGE (concept intact, task language is the gap)',
        hypothesisB: 'CONCEPT (the comparison concept itself is the gap)',
        discriminatingQuestion: 'Tell me one way the two things are the SAME, then one way they are DIFFERENT (and try the quick Compare/Contrast check).',
        dimAKey: 'taskMeaning', dimBKey: 'compareContrastConcept',
        matcher: isolationMatcher,
        routeOnResolution: (resolvedTo) => resolvedTo === 'A' ? 'TASK_MEANING_BRIDGE' : 'CONCEPT_BRIDGE'
      }
    },
    TASK_MEANING_BRIDGE: { dimensionKey: 'taskMeaning', evaluator: evalBridgeRetry('taskMeaning') },
    CONCEPT_BRIDGE: { dimensionKey: 'compareContrastConcept', evaluator: evalBridgeRetry('compareContrastConcept') },
    EVIDENCE_CHECK: { dimensionKey: 'evidenceUse', evaluator: evalEvidenceChoice },
    EVIDENCE_BRIDGE: { dimensionKey: 'evidenceUse', evaluator: evalEvidenceBridge },
    ORGANIZE_CHECK: { dimensionKey: 'organization', evaluator: evalOrganizeCheck },
    ORGANIZATION_BRIDGE: { dimensionKey: 'organization', evaluator: evalOrganizationBridge },
    RETURN_TO_TASK: { dimensionKey: 'taskMeaning', evaluator: evalReturnToTask }
  },
  route: {
    EXPLAIN_TASK: evalResult => evalResult.understands ? 'EVIDENCE_CHECK' : null, // isolation handles the other branch
    TASK_MEANING_BRIDGE: () => 'RETURN_TO_TASK',
    CONCEPT_BRIDGE: () => 'RETURN_TO_TASK',
    EVIDENCE_CHECK: evalResult => (evalResult.attempts || 1) <= 1 ? 'ORGANIZE_CHECK' : 'EVIDENCE_BRIDGE',
    EVIDENCE_BRIDGE: () => 'RETURN_TO_TASK',
    ORGANIZE_CHECK: evalResult => evalResult.succeeded ? 'RETURN_TO_TASK' : 'ORGANIZATION_BRIDGE',
    ORGANIZATION_BRIDGE: () => 'RETURN_TO_TASK',
    RETURN_TO_TASK: () => null
  },
  scaffoldContent,
  renderExperience: renderRocketWritingExperience
});
