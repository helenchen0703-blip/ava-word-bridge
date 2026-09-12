// core/fading-engine.js — Ava BRIDGE Learning Agent, Fading + progress
// Fixes the one confirmed near-miss in the prior Bridge.progressEstimate():
// it hardcoded NODE.REDUCE_SUPPORT/NODE.ORIGINAL_TASK by name, which only
// worked for Writing's specific route graph. This version is computed purely
// off BRIDGE_STATUS, so it is safe for any current or future Module.

function genericProgressEstimate(learnerState) {
  const dims = Object.values(learnerState.dimensions);
  if (dims.length === 0) return { current: 0, total: 1 };
  const independent = dims.filter(d => d.status === BRIDGE_STATUS.INDEPENDENT).length;
  return { current: independent, total: dims.length };
}

// Records a zero-scaffold retest attempt on a dimension. Independence is
// reachable ONLY through a recorded successful retest at hintLevel 0 — this
// is a structural Core guarantee, not a per-Module convention. If the retest
// fails, status stays whatever the evaluator says (typically EMERGING), never
// silently promoted to INDEPENDENT.
function retestAtZeroScaffold(dim, succeeded) {
  dim.successfulWithoutSupport = succeeded;
  dim.transferBackToAuthenticTask = succeeded;
  if (succeeded) dim.status = BRIDGE_STATUS.INDEPENDENT;
  return dim;
}
