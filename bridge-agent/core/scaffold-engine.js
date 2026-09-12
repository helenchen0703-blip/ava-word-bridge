// core/scaffold-engine.js — Ava BRIDGE Learning Agent, Core scaffold ladder
// Universal 6-level ladder (0-5). Core enforces the STRUCTURE (level is earned
// by attempts, never jumped to, never regresses within a checkpoint; level 5
// is gated behind real evidence of a genuine stall). The CONTENT at each level
// is always Module-supplied (scaffoldContent(checkpointId, level, taskRecord))
// — Core never invents scaffold text/visuals itself.
//
// Level 5 ("strong support, last resort only") did not exist in the prior
// 5-level (0-4) ladder — it is a new tier, not a renumbering. LAST_RESORT_
// ACTIONS_LEVEL_5 replaces the old FORBIDDEN_DEFAULT_ACTIONS ban list: those
// actions (translation, model-answer, default sentence frame, simplified
// text, game, full explanation) are never a default at levels 1-4, and are
// only legitimate at level 5 once genuinely earned — never silent even then.

const LEVEL_RULE_IDS = Object.freeze({
  0: 'ruleAlreadyIndependentNoHint',
  1: 'ruleFirstMissThinkingQuestion',
  2: 'ruleSecondMissVisualOrChunking',
  3: 'ruleThirdMissGuidedChoiceOrOrganizer',
  4: 'ruleFourthMissStarterOrRehearsal',
  5: 'ruleFifthMissLastResortSupport'
});

const LAST_RESORT_ACTIONS_LEVEL_5 = Object.freeze([
  'TRANSLATION', 'MODEL_ANSWER', 'DEFAULT_SENTENCE_FRAME', 'SIMPLIFIED_TEXT', 'GAME', 'FULL_EXPLANATION'
]);

// Returns { level, ruleId, lastResortAllowed }. `lastResortAllowed` is true
// only when hintLevel has already reached 4, the attempt still failed, and
// confidence is not LOW (i.e., a real stall, not ambiguity) — the Module's
// scaffoldContent() should consult this before offering a LAST_RESORT action.
function chooseScaffoldLevel(dim, ladderLength) {
  ladderLength = ladderLength || LADDER_LENGTH;
  if (dim.status === BRIDGE_STATUS.INDEPENDENT) {
    return { level: 0, ruleId: LEVEL_RULE_IDS[0], lastResortAllowed: false };
  }
  const earnedLevel = Math.min(ladderLength, Math.max(1, dim.attempts));
  const level = Math.max(earnedLevel, dim.hintLevel); // never regress within a checkpoint
  const lastResortAllowed = dim.hintLevel >= 4 && level >= 5 && dim.confidence !== 'LOW';
  return { level, ruleId: LEVEL_RULE_IDS[level] || LEVEL_RULE_IDS[1], lastResortAllowed };
}
