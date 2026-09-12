// core/decision-engine.js — Ava BRIDGE Learning Agent, Core Decision Engine
// 5 outcomes: CONTINUE_SUPPORT, REDUCE_SUPPORT, REMOVE_SUPPORT,
// RUN_ONE_MORE_CHECK, RETURN_TO_AUTHENTIC_TASK. Teacher override is checked
// FIRST, ahead of every rule — an override short-circuits the engine for that
// dimension rather than being layered on after the fact. RUN_ONE_MORE_CHECK
// is reachable from any checkpoint the moment confidence is low, not just
// after one fixed screen.

const LADDER_LENGTH = 5; // highest scaffold level; level 0 is "independent, no scaffold"

function decideSupportTransition({ dim, evalResult, ladderLength }) {
  ladderLength = ladderLength || LADDER_LENGTH;
  const succeeded = !!evalResult.succeeded;
  const confidence = evalResult.confidence || dim.confidence || 'UNKNOWN';

  if (dim.teacherOverride) {
    return {
      decision: dim.teacherOverride.decision,
      ruleId: 'ruleTeacherOverrideApplied',
      reason: `Teacher override recorded: ${dim.teacherOverride.note || '(no note)'}`
    };
  }
  if (confidence === 'LOW') {
    return {
      decision: 'RUN_ONE_MORE_CHECK',
      ruleId: 'ruleLowConfidenceRunCheck',
      reason: 'Response was ambiguous — running the shortest check that can distinguish the competing hypotheses before scaffolding.'
    };
  }
  if (succeeded && dim.hintLevel === 0) {
    return { decision: 'REMOVE_SUPPORT', ruleId: 'ruleSuccessNoSupportRemove',
      reason: 'Succeeded with no scaffold visible — support can be removed.' };
  }
  if (succeeded && dim.hintLevel > 0) {
    return { decision: 'REDUCE_SUPPORT', ruleId: 'ruleSuccessWithSupportReduce',
      reason: 'Succeeded, but only after a scaffold was shown — reducing support and re-testing rather than declaring independence immediately.' };
  }
  if (!succeeded && dim.hintLevel < ladderLength) {
    return { decision: 'CONTINUE_SUPPORT', ruleId: 'ruleStillStrugglingContinue',
      reason: 'Not yet successful at the current support level — continuing with the next scaffold tier.' };
  }
  return { decision: 'RETURN_TO_AUTHENTIC_TASK', ruleId: 'ruleMaxSupportReachedReturn',
    reason: 'Reached the highest scaffold tier for this checkpoint — returning to the authentic task rather than escalating indefinitely.' };
}

// Records a teacher's resolution of a NEEDS_TEACHER_REVIEW item. Confirm =
// accept the Agent's own last decision as the override (so the trace shows an
// explicit confirmation, not silence); Override = a different decision;
// "ask for more evidence" is just RUN_ONE_MORE_CHECK recorded as the override
// so the loop continues instead of stalling.
function applyTeacherOverride(dim, decision, note, teacherName) {
  dim.teacherOverride = { decision, note: note || '', teacher: teacherName || 'teacher', timestamp: new Date().toISOString() };
  dim.needsTeacherReview = false;
}
