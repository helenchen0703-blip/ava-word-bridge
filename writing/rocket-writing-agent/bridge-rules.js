// bridge-rules.js — BRIDGE Writing Agent v1
// Pure decision logic. No DOM access, no localStorage, no network calls.
// Every rule/route function has a stable, grep-able name used verbatim as its
// ruleId in the decision trace — that is what makes the trace inspectable:
// open this file, find the id, read the guard that fired.

// ---------- Route graph ----------
// EXPLAIN_TASK
//  |- understands        -> EVIDENCE_CHECK
//  |     |- can use evidence (Yes) -> ORGANIZE_CHECK
//  |     |                              |- Yes -> REDUCE_SUPPORT
//  |     |                              |- No  -> ORGANIZATION_BRIDGE -> REDUCE_SUPPORT
//  |     |- can't use evidence (No)  -> EVIDENCE_BRIDGE -> REDUCE_SUPPORT
//  |- doesn't understand -> ISOLATION_CHECK (Same/Different concept?)
//        |- Yes (concept intact) -> TASK_MEANING_BRIDGE -> REDUCE_SUPPORT
//        |- No  (concept gap)    -> CONCEPT_BRIDGE       -> REDUCE_SUPPORT
// REDUCE_SUPPORT -> ORIGINAL_TASK -> DONE
//
// Exactly one bridge fires per session (whichever layer the evidence points to first).
// Organize Check is only ever reached once Evidence Check already came back clean —
// testing organization only makes sense once we know she can find the right evidence
// to organize (SKILL.md: don't scaffold or test a layer she hasn't reached yet).

const NODE = Object.freeze({
  EXPLAIN_TASK: 'EXPLAIN_TASK',
  ISOLATION_CHECK: 'ISOLATION_CHECK',
  EVIDENCE_CHECK: 'EVIDENCE_CHECK',
  ORGANIZE_CHECK: 'ORGANIZE_CHECK',
  TASK_MEANING_BRIDGE: 'TASK_MEANING_BRIDGE',
  CONCEPT_BRIDGE: 'CONCEPT_BRIDGE',
  EVIDENCE_BRIDGE: 'EVIDENCE_BRIDGE',
  ORGANIZATION_BRIDGE: 'ORGANIZATION_BRIDGE',
  REDUCE_SUPPORT: 'REDUCE_SUPPORT',
  ORIGINAL_TASK: 'ORIGINAL_TASK',
  DONE: 'DONE'
});

// ---------- Universal 5-level scaffold ladder (Ava BRIDGE Learning Agent, section E) ----------
// Levels are fixed and Core-enforced; a Module may only pick a named VARIANT within a
// level (e.g. level 2's MEANING variant vs its EXPRESSION variant), never invent a new
// level or skip one. This collapses BRIDGE Writing Agent v1's 7-tier ACTION_ORDER —
// levels 2 and 4 each absorb two old tiers as MEANING/EXPRESSION variants of the same
// tier; level 3 needed one genuinely NEW variant (PARTIAL_SENTENCE_FRAME) that didn't
// exist before, since the old ladder let ACTION_MODEL and SENTENCE_STARTER share a tier
// but the new ladder does not.
const LADDER_LENGTH = 4; // highest level index; level 0 is "independent, no scaffold"
const LADDER_VARIANTS = Object.freeze({
  1: { MEANING: 'THINKING_QUESTION', EXPRESSION: 'THINKING_QUESTION' },
  2: { MEANING: 'VISUAL_CUE', EXPRESSION: 'HIGHLIGHT' },
  3: { MEANING: 'ACTION_MODEL', EXPRESSION: 'PARTIAL_SENTENCE_FRAME' },
  4: { MEANING: 'ORAL_REHEARSAL', EXPRESSION: 'SENTENCE_STARTER' }
});
// Structural ban (Ava BRIDGE Learning Agent, section E): a Module's scaffold variants
// must never default to one of these — they are only legitimate as a LAST resort after
// the graduated ladder above has already been exhausted with evidence, never as the
// first or only scaffold offered.
const FORBIDDEN_DEFAULT_ACTIONS = Object.freeze([
  'TRANSLATION', 'MODEL_ANSWER', 'DEFAULT_SENTENCE_FRAME', 'SIMPLIFIED_TEXT', 'GAME', 'FULL_EXPLANATION'
]);

// Writing Module's dimension manifest (Ava BRIDGE Learning Agent, section D)
// — the six BRIDGE Writing Agent v1 dimensions, each tagged with the universal
// roadblock category it evidences. compareContrastConcept is a discriminator:
// the Isolation Check's whole job is deciding whether a gap belongs to CONCEPT
// or to LANGUAGE, not asserting a single fixed category up front.
const WRITING_DIMENSIONS = [
  { key: 'taskMeaning', category: ROADBLOCK_CATEGORY.LANGUAGE },
  { key: 'compareContrastConcept', category: ROADBLOCK_CATEGORY.CONCEPT },
  { key: 'evidenceUse', category: ROADBLOCK_CATEGORY.EVIDENCE_REASONING },
  { key: 'organization', category: ROADBLOCK_CATEGORY.ORGANIZATION },
  { key: 'languageExpression', category: ROADBLOCK_CATEGORY.EXPRESSION },
  { key: 'independence', category: ROADBLOCK_CATEGORY.INDEPENDENCE }
];

// ---------- Checkpoint evaluators (EVIDENCE) ----------
// Each takes the raw response data for one checkpoint and returns a routing
// signal plus a status/evidenceNote pair, in the same cautious language used
// throughout Teacher View ("Evidence suggests/weakens/remains inconclusive").

function evalExplainTask(responseText) {
  const text = (responseText || '').trim();
  const mentionsAction = /compare|contrast|similar|alike|different/i.test(text);
  const mentionsBothSides = /athens/i.test(text) && /sparta/i.test(text);
  const substantial = text.length > 20;

  if (mentionsAction && mentionsBothSides && substantial) {
    return {
      understands: true,
      statusAfter: BRIDGE_STATUS.INDEPENDENT,
      ruleId: 'ruleTaskMeaningIndependent',
      evidenceNote: 'Evidence weakens Task Meaning as a barrier — she named the compare/contrast action and both texts unaided.'
    };
  }
  if (mentionsAction && !mentionsBothSides) {
    return {
      understands: false,
      statusAfter: BRIDGE_STATUS.NEEDS_SUPPORT,
      ruleId: 'ruleTaskMeaningPartialAction',
      evidenceNote: 'Evidence suggests an action was named but not the full scope of the task — running the Isolation Check next to localize the layer.'
    };
  }
  return {
    understands: false,
    statusAfter: BRIDGE_STATUS.NEEDS_EVIDENCE,
    ruleId: 'ruleTaskMeaningNoAction',
    evidenceNote: 'Evidence remains inconclusive — the response did not name a compare/contrast action. Running the Isolation Check next.'
  };
}

function evalIsolationCheck({ sameResponse, differentResponse, compareCheck, contrastCheck }) {
  const same = (sameResponse || '').trim();
  const different = (differentResponse || '').trim();
  const freeTextOk = same.length > 1 && different.length > 1 && same.toLowerCase() !== different.toLowerCase();
  const bothCorrect = compareCheck.correct === true && contrastCheck.correct === true;
  const firstTryBoth = compareCheck.attempts <= 1 && contrastCheck.attempts <= 1;

  if (bothCorrect && freeTextOk) {
    return {
      conceptIntact: true,
      statusAfter: firstTryBoth ? BRIDGE_STATUS.INDEPENDENT : BRIDGE_STATUS.EMERGING,
      ruleId: firstTryBoth ? 'ruleConceptIntactFirstTry' : 'ruleConceptIntactWithRetry',
      evidenceNote: firstTryBoth
        ? 'Evidence weakens Comparison Concept as a barrier — she named a real similarity/difference and matched COMPARE/CONTRAST correctly on the first try.'
        : 'Evidence weakens Comparison Concept as the primary barrier, though the interactive check needed more than one try — concept is intact enough to route to Task Meaning, not Concept.'
    };
  }
  return {
    conceptIntact: false,
    statusAfter: BRIDGE_STATUS.NEEDS_SUPPORT,
    ruleId: 'ruleConceptGap',
    evidenceNote: 'Evidence suggests the Comparison Concept itself — not just the task language around it — is where support is needed.'
  };
}

function evalEvidenceChoice({ correct, attempts }) {
  if (correct && attempts <= 1) {
    return {
      canUse: true,
      statusAfter: BRIDGE_STATUS.INDEPENDENT,
      ruleId: 'ruleEvidenceChoiceIndependent',
      evidenceNote: 'Evidence weakens Evidence Use as a barrier — she chose the correct evidence sentence on the first try.'
    };
  }
  if (correct && attempts > 1) {
    return {
      canUse: false,
      statusAfter: BRIDGE_STATUS.NEEDS_SUPPORT,
      ruleId: 'ruleEvidenceChoiceNeededRetries',
      evidenceNote: 'Evidence suggests Evidence Use needs support — the correct sentence was found only after more than one try.'
    };
  }
  return {
    canUse: false,
    statusAfter: BRIDGE_STATUS.NEEDS_EVIDENCE,
    ruleId: 'ruleEvidenceChoicePending',
    evidenceNote: 'Still gathering evidence on Evidence Use — no correct choice recorded yet.'
  };
}

function evalOrganizeCheck({ totalAttempts, chipCount }) {
  if (totalAttempts <= chipCount) {
    return {
      organizedWell: true,
      statusAfter: BRIDGE_STATUS.INDEPENDENT,
      ruleId: 'ruleOrganizationIndependent',
      evidenceNote: 'Evidence weakens Organization as a barrier — every idea was placed correctly on the first try.'
    };
  }
  return {
    organizedWell: false,
    statusAfter: BRIDGE_STATUS.NEEDS_SUPPORT,
    ruleId: 'ruleOrganizationNeedsSupport',
    evidenceNote: 'Evidence suggests Organization needs support — placement required more attempts than ideas available.'
  };
}

// ---------- Cross-cutting: language expression track (SKILL.md Rule 8) ----------
// Deliberately narrow trigger: only flips when a multiple-choice/placement part was
// ALREADY correct but the accompanying open response was minimal or code-switched —
// i.e. she demonstrated the underlying understanding, just not in English. Never
// inferred from an MC failure, so a language flag can't masquerade as a concept gap.

function detectLanguageExpressionSignal(responseText, mcWasCorrect) {
  const text = (responseText || '').trim();
  if (!text || mcWasCorrect !== true) return false;
  const veryShort = text.length < 8;
  const hasNonAsciiLetters = /[^\x00-\x7F]/.test(text);
  return veryShort || hasNonAsciiLetters;
}

function resolveScaffoldTrack(bridgeState) {
  return bridgeState.roadblock.languageExpressionTrack ? 'EXPRESSION' : 'MEANING';
}

// ---------- Scaffold selection (DECISION + SCAFFOLD) ----------
// Level is simply "how many attempts has she needed," capped at LADDER_LENGTH and
// never allowed to move backward within a checkpoint — this is the "minimum necessary
// scaffold" rule from SKILL.md made literal: the level is EARNED by an attempt, never
// jumped to. The named action at that level depends on the track (MEANING/EXPRESSION).
const LEVEL_RULE_IDS = Object.freeze({
  0: 'ruleAlreadyIndependentNoHint',
  1: 'ruleFirstMissThinkingQuestion',
  2: 'ruleSecondMissVisualOrHighlight',
  3: 'ruleThirdMissChoiceOrModel',
  4: 'ruleFourthMissStarterOrRehearsal'
});

function chooseScaffold(dim, track) {
  if (dim.status === BRIDGE_STATUS.INDEPENDENT) {
    return { level: 0, action: 'INDEPENDENT', ruleId: LEVEL_RULE_IDS[0] };
  }
  const earnedLevel = Math.min(LADDER_LENGTH, Math.max(1, dim.attempts));
  const level = Math.max(earnedLevel, dim.hintLevel); // never regress within a checkpoint
  const variant = LADDER_VARIANTS[level];
  const action = variant ? (track === 'EXPRESSION' ? variant.EXPRESSION : variant.MEANING) : 'THINKING_QUESTION';
  return { level, action, ruleId: LEVEL_RULE_IDS[level] || LEVEL_RULE_IDS[1] };
}

// ---------- Support transition (NEXT DECISION) ----------

function decideSupportTransition(dim, justSucceeded, ladderLength) {
  ladderLength = ladderLength || LADDER_LENGTH;
  if (justSucceeded && dim.hintLevel === 0) {
    return { decision: 'REMOVE_SUPPORT', ruleId: 'ruleSuccessNoSupportRemove',
      reason: 'Succeeded with no scaffold visible — support can be removed.' };
  }
  if (justSucceeded && dim.hintLevel > 0) {
    return { decision: 'REDUCE_SUPPORT', ruleId: 'ruleSuccessWithSupportReduce',
      reason: 'Succeeded, but only after a scaffold was shown — reducing support and re-testing rather than declaring independence immediately.' };
  }
  if (!justSucceeded && dim.hintLevel < ladderLength) {
    return { decision: 'CONTINUE_SUPPORT', ruleId: 'ruleStillStrugglingContinue',
      reason: 'Not yet successful at the current support level — continuing with the next scaffold tier.' };
  }
  return { decision: 'RETURN_TO_AUTHENTIC_TASK', ruleId: 'ruleMaxSupportReachedReturn',
    reason: 'Reached the highest scaffold tier for this checkpoint — returning to the authentic task rather than escalating indefinitely.' };
}

// ---------- Route node functions (1:1 with the route graph above) ----------

function routeAfterExplainTask(evalResult) {
  return evalResult.understands
    ? { next: NODE.EVIDENCE_CHECK, ruleId: 'routeUnderstandsToEvidence' }
    : { next: NODE.ISOLATION_CHECK, ruleId: 'routeDoesNotUnderstandToIsolation' };
}

function routeAfterIsolationCheck(evalResult) {
  return evalResult.conceptIntact
    ? { next: NODE.TASK_MEANING_BRIDGE, ruleId: 'routeConceptIntactToTaskMeaningBridge' }
    : { next: NODE.CONCEPT_BRIDGE, ruleId: 'routeConceptGapToConceptBridge' };
}

function routeAfterEvidenceCheck(evalResult) {
  return evalResult.canUse
    ? { next: NODE.ORGANIZE_CHECK, ruleId: 'routeEvidenceOkToOrganizeCheck' }
    : { next: NODE.EVIDENCE_BRIDGE, ruleId: 'routeEvidenceGapToEvidenceBridge' };
}

function routeAfterOrganizeCheck(evalResult) {
  return evalResult.organizedWell
    ? { next: NODE.REDUCE_SUPPORT, ruleId: 'routeOrganizationOkToReduceSupport' }
    : { next: NODE.ORGANIZATION_BRIDGE, ruleId: 'routeOrganizationGapToOrganizationBridge' };
}

// Every bridge (Concept/TaskMeaning/Evidence/Organization) calls this after each
// attempt. It stays on the same bridge while CONTINUE_SUPPORT keeps firing, and
// converges to REDUCE_SUPPORT (Screen 7) the moment the retry loop resolves.
function routeAfterBridgeAttempt(supportDecision) {
  if (supportDecision === 'CONTINUE_SUPPORT') {
    return { next: null, ruleId: 'routeBridgeStillInProgress' };
  }
  return { next: NODE.REDUCE_SUPPORT, ruleId: 'routeBridgeResolvedToReduceSupport' };
}
