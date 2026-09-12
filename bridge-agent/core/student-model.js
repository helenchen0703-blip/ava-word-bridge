// core/student-model.js — Ava BRIDGE Learning Agent, Longitudinal Student Model
// Additive across tasks and subjects. Stores EVIDENCE, never identity labels —
// never write something like "organization: weak"; only ever push a dated,
// task-attributed tuple. This is separate storage from bridgeCoreData_v2
// (per-task learnerState) — the student model outlives any single task.

const STUDENT_MODEL_KEY = 'bridgeStudentModel_v1';

function freshStudentModel() {
  return {
    version: 1,
    wordBank: [],      // { word, glossOrNote, firstSeenTaskId, firstSeenAt, status, lastConfirmedAt }
    chunkBank: [],     // { chunk, firstSeenTaskId, firstSeenAt, status }
    fluencyWords: [],  // { word, correctCount, incorrectCount, lastTestedAt }
    evidenceHistory: {} // { [subject]: { [dimensionKey]: [ {taskId, date, evidenceNote, status} ] } }
  };
}

function loadStudentModel() {
  try {
    const raw = localStorage.getItem(STUDENT_MODEL_KEY);
    return raw ? JSON.parse(raw) : freshStudentModel();
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

// WORD_STATUS progression: INTRODUCED -> PRACTICED -> RETAINED. Never
// overwritten backward; a word already RETAINED stays RETAINED even if a
// later task re-introduces it.
const WORD_STATUS_RANK = Object.freeze({ INTRODUCED: 0, PRACTICED: 1, RETAINED: 2 });

function upsertWordBank(model, { word, glossOrNote, taskId, status }) {
  const lower = (word || '').trim().toLowerCase();
  if (!lower) return;
  const existing = model.wordBank.find(w => w.word.toLowerCase() === lower);
  const now = new Date().toISOString();
  if (!existing) {
    model.wordBank.push({
      word, glossOrNote: glossOrNote || '', firstSeenTaskId: taskId,
      firstSeenAt: now, status: status || 'INTRODUCED', lastConfirmedAt: now
    });
    return;
  }
  existing.lastConfirmedAt = now;
  if (status && WORD_STATUS_RANK[status] > WORD_STATUS_RANK[existing.status]) {
    existing.status = status;
  }
}

function upsertChunkBank(model, { chunk, taskId, status }) {
  const key = (chunk || '').trim();
  if (!key) return;
  const existing = model.chunkBank.find(c => c.chunk === key);
  if (!existing) {
    model.chunkBank.push({ chunk: key, firstSeenTaskId: taskId, firstSeenAt: new Date().toISOString(), status: status || 'INTRODUCED' });
    return;
  }
  if (status && WORD_STATUS_RANK[status] > WORD_STATUS_RANK[existing.status]) existing.status = status;
}

function recordFluencyAttempt(model, word, wasCorrect) {
  const lower = (word || '').trim().toLowerCase();
  if (!lower) return;
  let entry = model.fluencyWords.find(w => w.word.toLowerCase() === lower);
  if (!entry) {
    entry = { word, correctCount: 0, incorrectCount: 0, lastTestedAt: null };
    model.fluencyWords.push(entry);
  }
  if (wasCorrect) entry.correctCount += 1; else entry.incorrectCount += 1;
  entry.lastTestedAt = new Date().toISOString();
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
