// modules/reading.js — Reading Module (Ava BRIDGE Learning Agent)
// Built fresh (per the audit, ava-word-bridge's reading.html had no real
// diagnostic branching to reuse — only its content-array-separation pattern
// was worth carrying forward, which the intake schema already generalizes).
// Runs on Core's generic checkpoint UI — no bespoke Experience skin, per the
// MVP boundary. Pathway (simplified from SKILL.md's Reading pathway
// WORD -> CHUNK -> SENTENCE -> MEANING -> GIST -> RESPONSE -> INDEPENDENCE):
// UNDERSTAND_GIST -> (isolation: LANGUAGE vs CONCEPT/RETENTION) -> EVIDENCE_CHECK -> RETURN_TO_TASK.

const READING_DIMENSIONS = [
  { key: 'gistComprehension', category: ROADBLOCK_CATEGORY.CONCEPT },
  { key: 'evidenceUse', category: ROADBLOCK_CATEGORY.REASONING },
  { key: 'independence', category: ROADBLOCK_CATEGORY.INDEPENDENCE }
];

const READING_INTAKE_SCHEMA = [
  { id: 'taskText', type: 'textarea', label: 'Authentic Task (passage + the actual comprehension question, paste verbatim)', required: true },
  { id: 'actionWords', type: 'checklist', label: 'What is the question asking Ava to do?',
    options: ['SUMMARIZE', 'DESCRIBE', 'EXPLAIN', 'ARGUE', 'NARRATE'], required: true },
  { id: 'keyWords', type: 'chipList', label: 'Key academic words in this passage (2-4)', required: true, min: 2 },
  { id: 'mainIdeaSentence', type: 'text', label: 'The expected main-idea / gist answer', required: true },
  { id: 'evidenceIdea', type: 'text', label: 'One idea from the text needing evidence', required: true },
  { id: 'evidenceChoices', type: 'repeatable', label: 'Evidence sentence candidates (mark the one that is real evidence)',
    fields: [{ id: 'text', type: 'text' }, { id: 'isEvidence', type: 'checkbox' }], min: 3, required: true }
];

function significantWords(sentence) {
  return (sentence || '').toLowerCase().split(/\W+/).filter(w => w.length > 3);
}

function evalGist(responseText, taskRecord) {
  const text = (responseText || '').trim();
  const expected = significantWords(taskRecord.moduleIntakeData.mainIdeaSentence);
  const responseWords = new Set(significantWords(text));
  const overlap = expected.length ? expected.filter(w => responseWords.has(w)).length / expected.length : 0;
  const substantial = text.length > 15;

  if (!substantial) {
    return { succeeded: false, statusAfter: BRIDGE_STATUS.UNKNOWN, confidence: 'LOW', responseSummary: text,
      ruleId: 'ruleGistTooShort', evidenceNote: 'Response too short to evaluate — running the isolation check.' };
  }
  if (overlap >= 0.5) {
    return { succeeded: true, understands: true, statusAfter: BRIDGE_STATUS.INDEPENDENT, confidence: 'HIGH', responseSummary: text,
      ruleId: 'ruleGistIndependent', evidenceNote: 'Evidence weakens Gist Comprehension as a barrier — the response covers the main idea unaided.' };
  }
  if (overlap >= 0.2) {
    return { succeeded: false, understands: false, statusAfter: BRIDGE_STATUS.NEEDS_SUPPORT, confidence: 'MEDIUM', responseSummary: text,
      ruleId: 'ruleGistPartial', evidenceNote: 'Evidence suggests partial gist comprehension.' };
  }
  return { succeeded: false, understands: false, statusAfter: BRIDGE_STATUS.NEEDS_EVIDENCE, confidence: 'LOW', responseSummary: text,
    ruleId: 'ruleGistNoOverlap', evidenceNote: 'Evidence is ambiguous — running the isolation check to see whether this is a language or a concept gap.' };
}

function gistIsolationMatcher(responseText) {
  const text = (responseText || '').trim();
  const nonTrivial = text.length > 8; // any language accepted — presence of *some* content is the signal
  return {
    matchesA: nonTrivial,   // A = LANGUAGE (gist understood, can't express it in English)
    matchesB: !nonTrivial,  // B = CONCEPT/RETENTION (gist not grasped at all)
    confidence: text.length > 20 ? 'HIGH' : (text.length > 0 ? 'MEDIUM' : 'LOW')
  };
}

function evalExpressionBridge(responseText) {
  const text = (responseText || '').trim();
  const succeeded = text.length > 10;
  return { succeeded, statusAfter: succeeded ? BRIDGE_STATUS.EMERGING : BRIDGE_STATUS.NEEDS_SUPPORT, confidence: 'HIGH',
    responseSummary: text, ruleId: 'ruleExpressionBridgeAttempted', evidenceNote: 'Expression Bridge attempt recorded.' };
}

function evalConceptBridgeReading(responseText) {
  const text = (responseText || '').trim();
  const succeeded = text.length > 3;
  return { succeeded, statusAfter: succeeded ? BRIDGE_STATUS.EMERGING : BRIDGE_STATUS.NEEDS_SUPPORT, confidence: 'HIGH',
    responseSummary: text, ruleId: 'ruleConceptBridgeReadingAttempted', evidenceNote: 'Concept/Retention Bridge attempt recorded.' };
}

function evalEvidenceChoiceReading(responseData) {
  const { correct, attempts } = responseData;
  return {
    succeeded: correct === true, hintLevel: attempts > 1 ? 1 : 0,
    statusAfter: correct ? (attempts <= 1 ? BRIDGE_STATUS.INDEPENDENT : BRIDGE_STATUS.EMERGING) : BRIDGE_STATUS.NEEDS_EVIDENCE,
    confidence: 'HIGH', responseSummary: `correct=${correct} attempts=${attempts}`, attempts,
    ruleId: correct && attempts <= 1 ? 'ruleEvidenceChoiceIndependent' : 'ruleEvidenceChoiceNeededRetries',
    evidenceNote: correct ? 'Evidence on Evidence Use recorded.' : 'Still gathering evidence on Evidence Use.'
  };
}

function evalEvidenceBridgeReading(responseText) {
  const text = (responseText || '').trim();
  const succeeded = text.length > 3;
  return { succeeded, statusAfter: succeeded ? BRIDGE_STATUS.EMERGING : BRIDGE_STATUS.NEEDS_SUPPORT, confidence: 'HIGH',
    responseSummary: text, ruleId: 'ruleEvidenceBridgeAttempted', evidenceNote: 'Evidence Bridge attempt recorded.' };
}

function evalReturnToTaskReading(responseText, taskRecord, state) {
  const result = evalGist(responseText, taskRecord);
  const indep = state.dimensions.independence;
  indep.status = result.understands ? BRIDGE_STATUS.INDEPENDENT : indep.status;
  indep.successfulWithoutSupport = !!result.understands;
  indep.transferBackToAuthenticTask = !!result.understands;
  return Object.assign(result, { confidence: 'HIGH' });
}

function scaffoldContentReading(checkpointId, level, taskRecord) {
  const { keyWords, evidenceIdea } = taskRecord.moduleIntakeData;
  const words = (keyWords || []).join(', ');
  const CONTENT = {
    UNDERSTAND_GIST: ['', 'What happened in this passage? Tell me the main idea.',
      `Look for these key words: ${words}.`, 'Try starting with: "This passage is about ______."',
      'Try saying it out loud first, any language is okay, then type it in English.',
      'Main idea modeled directly, as a last resort.'],
    EXPRESSION_BRIDGE: ['', 'Tell me again, in English this time, even a little bit.',
      `Key words to use: ${words}.`, 'Sentence starter: "This passage is about ______."',
      'Try saying it out loud first, then type it.', 'Model sentence given, as a last resort.'],
    CONCEPT_BRIDGE_READING: ['', 'Let\'s go back through the passage one part at a time.',
      `Look for these key words: ${words}.`, 'What happened first? What happened next?',
      'Try retelling just the first sentence.', 'Gist modeled directly, as a last resort.'],
    EVIDENCE_BRIDGE: ['', 'Does this sentence help prove your idea?', `Useful idea: ${evidenceIdea || ''}`,
      'Try starting with: "because..."', 'Try saying your reason out loud first.', 'Model explanation given, as a last resort.']
  };
  const arr = CONTENT[checkpointId] || CONTENT.UNDERSTAND_GIST;
  return { text: arr[level] || arr[arr.length - 1], action: `LEVEL_${level}_${checkpointId}` };
}

ModuleRegistry.register({
  subject: 'READING',
  label: 'Reading',
  intakeSchema: READING_INTAKE_SCHEMA,
  dimensionManifest: READING_DIMENSIONS,
  experienceId: 'reading.generic',
  firstCheckpointId: 'UNDERSTAND_GIST',
  checkpoints: {
    UNDERSTAND_GIST: {
      dimensionKey: 'gistComprehension',
      prompt: taskRecord => 'What happened in this passage? Tell me the main idea.',
      evaluator: evalGist,
      isolationPair: {
        hypothesisA: 'LANGUAGE (gist understood, can\'t express it in English)',
        hypothesisB: 'CONCEPT/RETENTION (gist not grasped)',
        discriminatingQuestion: 'Tell me in your own words, any language, what happened.',
        dimAKey: 'gistComprehension', dimBKey: 'gistComprehension',
        matcher: gistIsolationMatcher,
        routeOnResolution: resolvedTo => resolvedTo === 'A' ? 'EXPRESSION_BRIDGE' : 'CONCEPT_BRIDGE_READING'
      }
    },
    EXPRESSION_BRIDGE: { dimensionKey: 'gistComprehension', prompt: () => 'Tell me again, in English this time.', evaluator: evalExpressionBridge },
    CONCEPT_BRIDGE_READING: { dimensionKey: 'gistComprehension', prompt: () => 'Let\'s go back through the passage together.', evaluator: evalConceptBridgeReading },
    EVIDENCE_CHECK: {
      dimensionKey: 'evidenceUse',
      prompt: taskRecord => `Here is an idea from the text: "${taskRecord.moduleIntakeData.evidenceIdea}". Which sentence is evidence for it? (type the sentence you choose)`,
      evaluator: (responseText, taskRecord, state) => {
        const choices = taskRecord.moduleIntakeData.evidenceChoices || [];
        const attemptsSoFar = (state.dimensions.evidenceUse.attempts || 0) + 1;
        const match = choices.find(c => (c.text || '').trim().toLowerCase() === (responseText || '').trim().toLowerCase());
        return evalEvidenceChoiceReading({ correct: !!(match && match.isEvidence), attempts: attemptsSoFar });
      }
    },
    EVIDENCE_BRIDGE: { dimensionKey: 'evidenceUse', prompt: () => 'Does this sentence help prove the idea? Tell me why.', evaluator: evalEvidenceBridgeReading },
    RETURN_TO_TASK: { dimensionKey: 'gistComprehension', prompt: () => 'One more time: what is the main idea of the passage?', evaluator: evalReturnToTaskReading }
  },
  route: {
    UNDERSTAND_GIST: evalResult => evalResult.understands ? 'EVIDENCE_CHECK' : null,
    EXPRESSION_BRIDGE: () => 'EVIDENCE_CHECK',
    CONCEPT_BRIDGE_READING: () => 'EVIDENCE_CHECK',
    EVIDENCE_CHECK: evalResult => (evalResult.attempts || 1) <= 1 ? 'RETURN_TO_TASK' : 'EVIDENCE_BRIDGE',
    EVIDENCE_BRIDGE: () => 'RETURN_TO_TASK',
    RETURN_TO_TASK: () => null
  },
  scaffoldContent: scaffoldContentReading
});
