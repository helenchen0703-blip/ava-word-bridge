// core/student-state.js — Ava BRIDGE Learning Agent, Core state shape
// Subject-agnostic. No content literals live here — a Module supplies its
// own dimension list; this file only knows the universal shape every
// dimension shares and the universal status/category vocabulary.

const BRIDGE_STATUS = Object.freeze({
  UNKNOWN: 'UNKNOWN',
  NEEDS_EVIDENCE: 'NEEDS_EVIDENCE',
  NEEDS_SUPPORT: 'NEEDS_SUPPORT',
  EMERGING: 'EMERGING',
  INDEPENDENT: 'INDEPENDENT'
});

// The 10 universal roadblock categories (reconciled from the 9-category v2
// taxonomy: EVIDENCE_REASONING -> REASONING; STAMINA -> FLUENCY + RETENTION,
// since STAMINA was an unused placeholder with no rules ever acting on it).
const ROADBLOCK_CATEGORY = Object.freeze({
  LANGUAGE: 'LANGUAGE',
  CONCEPT: 'CONCEPT',
  REPRESENTATION: 'REPRESENTATION',
  STRATEGY: 'STRATEGY',
  REASONING: 'REASONING',
  ORGANIZATION: 'ORGANIZATION',
  EXPRESSION: 'EXPRESSION',
  FLUENCY: 'FLUENCY',
  RETENTION: 'RETENTION',
  INDEPENDENCE: 'INDEPENDENCE'
});

const CONFIDENCE = Object.freeze({
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  UNKNOWN: 'UNKNOWN'
});

function freshDimension() {
  return {
    status: BRIDGE_STATUS.UNKNOWN,
    attempts: 0,
    hintLevel: 0,
    response: '',
    successfulAfterSupport: false,
    successfulWithoutSupport: false,
    transferBackToAuthenticTask: null,
    confidence: CONFIDENCE.UNKNOWN,
    needsTeacherReview: false,
    teacherOverride: null // { decision, note, teacher, timestamp } | null
  };
}

// Core primitive: a Module declares which dimensions it evidences and which
// universal category each belongs to; Core builds the rest. No Module-specific
// literals live here.
function freshLearnerState({ dimensions }) {
  const dims = {};
  dimensions.forEach(d => {
    dims[d.key] = Object.assign(freshDimension(), { category: d.category });
  });
  return {
    version: 2,
    dimensions: dims,
    roadblock: {
      primary: null,
      secondary: [],
      isolationCheckResult: null
    },
    route: { currentNode: null, history: [] },
    trace: [],
    session: { checkpointsAttempted: 0, hintsRequestedTotal: 0, startedAt: new Date().toISOString() },
    createdAt: new Date().toISOString(),
    updatedAt: null
  };
}

function traceEntry({ checkpointId, dimensionKey, responseSummary, statusBefore, statusAfter,
                       evidenceNote, decision, scaffoldAction, ruleId, reason }) {
  return {
    seq: null, // filled in by appendTrace(), which knows the array length
    timestamp: new Date().toISOString(),
    checkpointId,
    dimensionKey,
    observed: { responseSummary, statusBefore },
    decision: { type: decision, scaffoldAction: scaffoldAction || null },
    result: { statusAfter, evidenceNote },
    ruleId,
    reason
  };
}

function appendTrace(state, entryFields) {
  const entry = traceEntry(entryFields);
  entry.seq = state.trace.length + 1;
  state.trace.push(entry);
  return entry;
}
