// bridge-storage.js — Ava BRIDGE Learning Agent, Core storage layer
// Pure state shape + localStorage persistence. No DOM access. No network calls.
//
// Storage is versioned as ONE multi-experience record so Teacher View can
// eventually reason across subjects instead of enumerating per-tool keys:
//   bridgeCoreData_v1 = { version:1, records: { "writing.rocketWriting": <learnerState>, ... } }
// A one-time migration lifts the old single-experience key (bridgeAgentData_v1,
// from BRIDGE Writing Agent v1) into records["writing.rocketWriting"] the first
// time this file runs against a browser that still has it. The deployed
// Baseline's own key (bridgePetMissionData_v1) is a completely different tool
// and is never read or written here.

const BRIDGE_STORAGE_KEY = 'bridgeCoreData_v1';
const LEGACY_WRITING_AGENT_KEY = 'bridgeAgentData_v1';

const BRIDGE_STATUS = Object.freeze({
  UNKNOWN: 'UNKNOWN',
  NEEDS_EVIDENCE: 'NEEDS_EVIDENCE',
  NEEDS_SUPPORT: 'NEEDS_SUPPORT',
  EMERGING: 'EMERGING',
  INDEPENDENT: 'INDEPENDENT'
});

// The 9 universal roadblock categories (Ava BRIDGE Learning Agent architecture,
// section D). A Module tags each of its dimensions with one of these so Teacher
// View and future Modules share one vocabulary instead of each inventing labels.
const ROADBLOCK_CATEGORY = Object.freeze({
  LANGUAGE: 'LANGUAGE',
  CONCEPT: 'CONCEPT',
  REPRESENTATION: 'REPRESENTATION',
  STRATEGY: 'STRATEGY',
  EVIDENCE_REASONING: 'EVIDENCE_REASONING',
  EXPRESSION: 'EXPRESSION',
  ORGANIZATION: 'ORGANIZATION',
  STAMINA: 'STAMINA',
  INDEPENDENCE: 'INDEPENDENCE'
});

function freshDimension() {
  return {
    status: BRIDGE_STATUS.UNKNOWN,
    attempts: 0,
    hintLevel: 0,
    response: '',
    successfulAfterSupport: false,
    successfulWithoutSupport: false,
    transferBackToAuthenticTask: null
  };
}

// Core primitive: a Module declares which dimensions it evidences and which
// universal category each belongs to; Core builds the rest. No Module-specific
// literals live here — compare freshBridgeState() in BRIDGE Writing Agent v1,
// which hardcoded exactly 6 Writing dimension names (now moved to bridge-rules.js
// as WRITING_DIMENSIONS, passed in by the caller).
function freshLearnerState({ dimensions }) {
  const dims = {};
  dimensions.forEach(d => {
    dims[d.key] = Object.assign(freshDimension(), { category: d.category });
  });
  return {
    version: 1,
    dimensions: dims,
    roadblock: {
      primary: null,
      secondary: [],
      languageExpressionTrack: false,
      isolationCheckResult: null
    },
    route: { currentNode: null, history: [] },
    trace: [],
    // Stamina/task-load placeholder (architecture section D) — tracked now,
    // no rules act on it yet until a Module actually needs one.
    session: { checkpointsAttempted: 0, hintsRequestedTotal: 0, startedAt: new Date().toISOString() },
    createdAt: new Date().toISOString(),
    updatedAt: null
  };
}

function readStorageRoot() {
  try {
    const raw = localStorage.getItem(BRIDGE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { version: 1, records: {} };
  } catch (e) {
    return { version: 1, records: {} };
  }
}

function saveLearnerState(state, experienceId) {
  state.updatedAt = new Date().toISOString();
  try {
    const root = readStorageRoot();
    root.records[experienceId] = state;
    localStorage.setItem(BRIDGE_STORAGE_KEY, JSON.stringify(root));
  } catch (e) {
    // Storage unavailable (sandboxed preview, private mode, quota) — session continues in memory only.
  }
}

function loadLearnerState(experienceId) {
  try {
    const root = readStorageRoot();
    if (root.records && root.records[experienceId]) return root.records[experienceId];
    // One-time migration from BRIDGE Writing Agent v1's single-experience key.
    const legacyRaw = localStorage.getItem(LEGACY_WRITING_AGENT_KEY);
    if (legacyRaw) {
      const legacyState = JSON.parse(legacyRaw);
      saveLearnerState(legacyState, experienceId);
      return legacyState;
    }
    return null;
  } catch (e) {
    return null;
  }
}

function traceEntry({ checkpointId, dimensionKey, responseSummary, statusBefore, statusAfter,
                       evidenceNote, decision, scaffoldAction, track, ruleId, reason }) {
  return {
    seq: null, // filled in by appendTrace(), which knows the array length
    timestamp: new Date().toISOString(),
    checkpointId,
    dimensionKey,
    observed: { responseSummary, statusBefore },
    decision: { type: decision, scaffoldAction: scaffoldAction || null, track: track || null },
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
