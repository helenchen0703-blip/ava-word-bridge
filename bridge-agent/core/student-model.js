// core/student-model.js — BRIDGE Learning Agent, Longitudinal Student Model
// Additive across tasks and subjects. Stores EVIDENCE, never identity labels —
// never write something like "organization: weak"; only ever push a dated,
// task-attributed tuple. This is separate storage from bridgeCoreData_v2
// (per-task learnerState) — the student model outlives any single task.
//
// Shared by BOTH the BRIDGE Learning Agent and the English Growth Agent
// (English Growth Agent V1, Option C) — this file is the seam. Nothing
// here is BRIDGE-specific or Growth-specific; both write evidence tuples,
// neither owns the schema.

const STUDENT_MODEL_KEY = 'bridgeStudentModel_v1';
const STUDENT_MODEL_VERSION = 2;

// v1 -> v2 status rename: BRIDGE-era 3-tier progression -> English Growth's
// 4-tier NEW/LEARNING/ALMOST_MINE/INDEPENDENT scale (a LEARNING tier is new;
// no v1 data ever used it, so no v1 value maps to it).
const LEGACY_STATUS_MAP = Object.freeze({ INTRODUCED: 'NEW', PRACTICED: 'ALMOST_MINE', RETAINED: 'INDEPENDENT' });

function freshStudentModel() {
  return {
    version: STUDENT_MODEL_VERSION,
    wordBank: [],      // see freshWordBankEntry() below for the full v2 shape
    chunkBank: [],     // see freshChunkBankEntry() below
    fluencyWords: [],  // { word, correctCount, incorrectCount, markingHistory, lastTestedAt }
    evidenceHistory: {} // { [subject]: { [dimensionKey]: [ {taskId, date, evidenceNote, status} ] } }
  };
}

// Additive-only migration: every existing field survives under its original
// value; only missing v2 fields are backfilled with empty defaults, and
// `status` is renamed (not dropped) to `currentLearningStatus`. Never
// deletes or resets a store — a model that fails to parse still falls back
// to freshStudentModel(), never to clearing what's on disk.
function migrateStudentModel(model) {
  if (!model) return freshStudentModel();
  if (model.version === STUDENT_MODEL_VERSION) return model;

  const migrateBankEntry = (e) => Object.assign(
    {
      meaning: '', chineseScaffold: '', partOfSpeech: '', morphologyNote: '', pronunciationNote: '',
      firstSeen: e.firstSeenAt || null, lastSeen: e.lastConfirmedAt || e.firstSeenAt || null,
      sourceTextIds: e.firstSeenTaskId ? [e.firstSeenTaskId] : [],
      encounterHistory: [], retrievalHistory: [], supportHistory: [], transferEvidence: []
    },
    e, // e's own existing fields win over the defaults above — nothing already stored is lost
    { currentLearningStatus: LEGACY_STATUS_MAP[e.status] || e.status || 'NEW' }
  );

  return {
    version: STUDENT_MODEL_VERSION,
    wordBank: (model.wordBank || []).map(migrateBankEntry),
    chunkBank: (model.chunkBank || []).map(migrateBankEntry),
    fluencyWords: (model.fluencyWords || []).map(e => Object.assign({ markingHistory: [] }, e)),
    evidenceHistory: model.evidenceHistory || {}
  };
}

function loadStudentModel() {
  try {
    const raw = localStorage.getItem(STUDENT_MODEL_KEY);
    if (!raw) return freshStudentModel();
    const migrated = migrateStudentModel(JSON.parse(raw));
    saveStudentModel(migrated); // persist the migration once, not on every load
    return migrated;
  } catch (e) {
    return freshStudentModel();
  }
}

function saveStudentModel(model) {
  try {
    localStorage.setItem(STUDENT_MODEL_KEY, JSON.stringify(model));
  } catch (e) {
    // Storage unavailable — session continues in memory only.
  }
}

// Learning-status progression: NEW -> LEARNING -> ALMOST_MINE -> INDEPENDENT.
// Never overwritten backward — an item already INDEPENDENT stays INDEPENDENT
// even if a later text re-introduces it (a dip shows up as new evidence
// tuples, never as erasing the rank already earned).
const WORD_STATUS_RANK = Object.freeze({ NEW: 0, LEARNING: 1, ALMOST_MINE: 2, INDEPENDENT: 3 });

function freshBankEntry() {
  return {
    meaning: '', chineseScaffold: '', partOfSpeech: '', morphologyNote: '', pronunciationNote: '',
    firstSeen: null, lastSeen: null,
    sourceTextIds: [], encounterHistory: [], retrievalHistory: [], supportHistory: [], transferEvidence: [],
    currentLearningStatus: 'NEW'
  };
}

function upsertWordBank(model, { word, taskId, textId, meaning, chineseScaffold, partOfSpeech, morphologyNote, pronunciationNote, status }) {
  const lower = (word || '').trim().toLowerCase();
  if (!lower) return null;
  const now = new Date().toISOString();
  const sourceId = textId || taskId || null;
  let existing = model.wordBank.find(w => w.word.toLowerCase() === lower);
  if (!existing) {
    existing = Object.assign(freshBankEntry(), { word, firstSeen: now, firstSeenTaskId: taskId || textId });
    model.wordBank.push(existing);
  }
  existing.lastSeen = now;
  existing.lastConfirmedAt = now; // legacy field, kept for anything still reading it
  if (sourceId && !existing.sourceTextIds.includes(sourceId)) existing.sourceTextIds.push(sourceId);
  if (meaning) existing.meaning = meaning;
  if (chineseScaffold) existing.chineseScaffold = chineseScaffold;
  if (partOfSpeech) existing.partOfSpeech = partOfSpeech;
  if (morphologyNote) existing.morphologyNote = morphologyNote;
  if (pronunciationNote) existing.pronunciationNote = pronunciationNote;
  if (status && WORD_STATUS_RANK[status] > WORD_STATUS_RANK[existing.currentLearningStatus]) {
    existing.currentLearningStatus = status;
  }
  return existing;
}

function upsertChunkBank(model, { chunk, taskId, textId, meaning, functionOrUse, status }) {
  const key = (chunk || '').trim();
  if (!key) return null;
  const now = new Date().toISOString();
  const sourceId = textId || taskId || null;
  let existing = model.chunkBank.find(c => c.chunk === key);
  if (!existing) {
    existing = Object.assign(freshBankEntry(), { chunk: key, firstSeen: now, firstSeenTaskId: taskId || textId });
    model.chunkBank.push(existing);
  }
  existing.lastSeen = now;
  if (sourceId && !existing.sourceTextIds.includes(sourceId)) existing.sourceTextIds.push(sourceId);
  if (meaning) existing.meaning = meaning;
  if (functionOrUse) existing.functionOrUse = functionOrUse;
  if (status && WORD_STATUS_RANK[status] > WORD_STATUS_RANK[existing.currentLearningStatus]) {
    existing.currentLearningStatus = status;
  }
  return existing;
}

// Records one encounter (a Cold Read marking event) against a bank entry —
// the exact-location context guardrail: every mark stays linked to which
// text, which sentence, and where. Call after upsertWordBank/upsertChunkBank
// so `entry` already exists.
function recordEncounter(entry, { textId, sentence, wordIndex, marking }) {
  if (!entry) return;
  entry.encounterHistory.push({ textId, date: new Date().toISOString(), sentence: sentence || '', wordIndex: wordIndex != null ? wordIndex : null, marking });
}

function recordSupport(entry, { textId, hintLevel }) {
  if (!entry) return;
  entry.supportHistory.push({ date: new Date().toISOString(), textId, hintLevel });
}

function recordRetrieval(entry, { textId, itemType, succeeded, supportLevelAtTime }) {
  if (!entry) return;
  entry.retrievalHistory.push({ date: new Date().toISOString(), textId, itemType, succeeded, supportLevelAtTime });
}

// The single most important English-growth signal: a previously-banked item
// succeeded UNAIDED in a later, different text — never triggered by re-teach,
// only by testing retrieval first. See growth-session.js's transfer check.
function recordTransfer(entry, { textId, succeededUnaided }) {
  if (!entry) return;
  entry.transferEvidence.push({ date: new Date().toISOString(), textId, succeededUnaided });
}

function recordFluencyAttempt(model, word, wasCorrect, { textId, marking } = {}) {
  const lower = (word || '').trim().toLowerCase();
  if (!lower) return null;
  let entry = model.fluencyWords.find(w => w.word.toLowerCase() === lower);
  if (!entry) {
    entry = { word, correctCount: 0, incorrectCount: 0, markingHistory: [], lastTestedAt: null };
    model.fluencyWords.push(entry);
  }
  if (!entry.markingHistory) entry.markingHistory = []; // defensive, in case of a pre-migration entry slipping through
  if (wasCorrect) entry.correctCount += 1; else entry.incorrectCount += 1;
  entry.lastTestedAt = new Date().toISOString();
  if (marking) entry.markingHistory.push({ date: entry.lastTestedAt, textId: textId || null, marking });
  return entry;
}

// Runs once, after a task's fading loop completes. Pushes one evidence tuple
// per dimension the task evidenced — never a scalar trait, always a dated,
// task-attributed record a teacher can read chronologically.
function commitEvidenceToStudentModel(model, { taskId, subject, finalDimensions, languageDemand }) {
  if (!model.evidenceHistory[subject]) model.evidenceHistory[subject] = {};
  const subjectHistory = model.evidenceHistory[subject];
  const date = new Date().toISOString();
  Object.keys(finalDimensions).forEach(dimKey => {
    const dim = finalDimensions[dimKey];
    if (!subjectHistory[dimKey]) subjectHistory[dimKey] = [];
    subjectHistory[dimKey].push({
      taskId, date,
      evidenceNote: dim.response ? dim.response.slice(0, 140) : '',
      status: dim.status,
      // Optional — lets a teacher eventually see a pattern like "Explain /
      // Expressive shows INDEPENDENT across 3 tasks." Never a scalar trait
      // on its own; always attached to a dated, task-attributed tuple.
      languageDemand: languageDemand ? { discipline: languageDemand.discipline, klu: languageDemand.klu } : null
    });
  });
}
