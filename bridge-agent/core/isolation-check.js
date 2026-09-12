// core/isolation-check.js — Ava BRIDGE Learning Agent, Core Isolation Check primitive
// "If the roadblock is unclear: run the SHORTEST check that can distinguish
// between competing explanations." The MECHANISM (ask one short thing, branch
// on the answer, update exactly the two competing dimensions) is Core. The
// CONTENT (which two hypotheses, what question, how to match the response) is
// always supplied by the Module/checkpoint that invoked it — never hardcoded
// here. Generalized from BRIDGE Writing Agent v1's evalIsolationCheck, whose
// branch-and-update-two-dimensions shape is exactly this, just parameterized.

function runIsolationCheck({ hypothesisA, hypothesisB, discriminatingQuestion, studentResponse, matcher, dimA, dimB }) {
  const { matchesA, matchesB, confidence } = matcher(studentResponse);

  let resolvedTo = null;
  if (matchesA && !matchesB) resolvedTo = 'A';
  else if (matchesB && !matchesA) resolvedTo = 'B';
  else resolvedTo = null; // ambiguous both-or-neither — stays unresolved, NEEDS_TEACHER_REVIEW territory

  if (dimA) { dimA.attempts += 1; dimA.confidence = confidence; dimA.needsTeacherReview = confidence === 'LOW' || resolvedTo === null; }
  if (dimB) { dimB.attempts += 1; dimB.confidence = confidence; dimB.needsTeacherReview = confidence === 'LOW' || resolvedTo === null; }

  return {
    resolvedTo,
    confidence,
    hypothesisA, hypothesisB, discriminatingQuestion,
    ruleId: resolvedTo ? 'ruleIsolationCheckResolved' : 'ruleIsolationCheckInconclusive',
    evidenceNote: resolvedTo
      ? `Isolation check resolved toward ${resolvedTo === 'A' ? hypothesisA : hypothesisB}.`
      : 'Isolation check was inconclusive — response did not clearly discriminate between the two hypotheses.'
  };
}
