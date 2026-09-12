// core/evidence-engine.js — Ava BRIDGE Learning Agent, Evidence Collector
// Thin, generic glue: takes a Module's evaluator result and applies it to a
// dimension in the learnerState. The evaluator itself (Module-owned, pure
// function) is where the real per-subject logic lives — this file never
// contains subject content, only the universal bookkeeping every checkpoint
// needs (attempts, response, status, confidence, needsTeacherReview).

function applyEvidence(dim, { statusAfter, confidence, responseSummary, succeeded }) {
  dim.attempts += 1;
  if (responseSummary !== undefined) dim.response = responseSummary;
  dim.status = statusAfter;
  dim.confidence = confidence || 'UNKNOWN';
  dim.needsTeacherReview = dim.confidence === 'LOW';
  // Accuracy x Support x Transfer (SKILL.md's evidence model): a checkpoint
  // that succeeds records WHICH of these two it is, generically, so Teacher
  // View doesn't depend on a Module remembering to set this itself.
  if (succeeded === true) {
    if (dim.hintLevel > 0) dim.successfulAfterSupport = true;
    else dim.successfulWithoutSupport = true;
  }
  return dim;
}
