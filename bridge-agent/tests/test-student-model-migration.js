// Regression test for core/student-model.js's v1 -> v2 migration.
// Guardrail: student-model.js is shared with the BRIDGE Agent — existing
// wordBank/chunkBank/fluencyWords/evidenceHistory must survive untouched in
// value, only reshaped additively. Run with: node tests/test-student-model-migration.js
global.localStorage = (function () {
  let store = {};
  return {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    clear: () => { store = {}; }
  };
})();

const fs = require('fs');
const path = require('path');
eval(fs.readFileSync(path.join(__dirname, '..', 'core/student-model.js'), 'utf8'));

let failures = 0;
function check(label, condition) {
  console.log((condition ? 'PASS' : 'FAIL') + ' — ' + label);
  if (!condition) failures++;
}

localStorage.setItem('bridgeStudentModel_v1', JSON.stringify({
  version: 1,
  wordBank: [{ word: 'government', glossOrNote: 'a group that runs a country', firstSeenTaskId: 'task_old1', firstSeenAt: '2026-01-01T00:00:00.000Z', status: 'PRACTICED', lastConfirmedAt: '2026-01-02T00:00:00.000Z' }],
  chunkBank: [{ chunk: 'in charge of', firstSeenTaskId: 'task_old1', firstSeenAt: '2026-01-01T00:00:00.000Z', status: 'INTRODUCED' }],
  fluencyWords: [{ word: 'because', correctCount: 2, incorrectCount: 1, lastTestedAt: '2026-01-01T00:00:00.000Z' }],
  evidenceHistory: { WRITING: { taskMeaning: [{ taskId: 'task_old1', date: '2026-01-01T00:00:00.000Z', evidenceNote: 'old evidence', status: 'INDEPENDENT' }] } }
}));

const migrated = loadStudentModel();
check('version bumped to 2', migrated.version === 2);
check('word value preserved', migrated.wordBank[0].word === 'government');
check('legacy glossOrNote preserved', migrated.wordBank[0].glossOrNote === 'a group that runs a country');
check('status renamed PRACTICED->ALMOST_MINE', migrated.wordBank[0].currentLearningStatus === 'ALMOST_MINE');
check('sourceTextIds backfilled from firstSeenTaskId', JSON.stringify(migrated.wordBank[0].sourceTextIds) === JSON.stringify(['task_old1']));
check('chunk status INTRODUCED->NEW', migrated.chunkBank[0].currentLearningStatus === 'NEW');
check('fluency correctCount preserved', migrated.fluencyWords[0].correctCount === 2);
check('fluency markingHistory backfilled as empty array', Array.isArray(migrated.fluencyWords[0].markingHistory));
check('evidenceHistory untouched', migrated.evidenceHistory.WRITING.taskMeaning[0].evidenceNote === 'old evidence');
check('re-loading an already-migrated model is a no-op (idempotent)', loadStudentModel().version === 2);

// Write functions
const model = freshStudentModel();
const entry = upsertWordBank(model, { word: 'Government', textId: 'text_1', meaning: 'a group that runs a country' });
recordEncounter(entry, { textId: 'text_1', sentence: 'The government makes laws.', wordIndex: 1, marking: 'UNKNOWN_MEANING' });
recordSupport(entry, { textId: 'text_1', hintLevel: 2 });
recordRetrieval(entry, { textId: 'text_1', itemType: 'MEANING', succeeded: true, supportLevelAtTime: 2 });
const entry2 = upsertWordBank(model, { word: 'government', textId: 'text_2', status: 'INDEPENDENT' });
recordTransfer(entry2, { textId: 'text_2', succeededUnaided: true });
check('case-insensitive upsert does not duplicate', model.wordBank.length === 1);
check('sourceTextIds accumulates across texts', JSON.stringify(entry2.sourceTextIds) === JSON.stringify(['text_1', 'text_2']));
check('status upgrades to INDEPENDENT', entry2.currentLearningStatus === 'INDEPENDENT');
const entry3 = upsertWordBank(model, { word: 'government', textId: 'text_3', status: 'NEW' });
check('status never downgrades', entry3.currentLearningStatus === 'INDEPENDENT');
const chunkEntry = upsertChunkBank(model, { chunk: 'in charge of', textId: 'text_1', meaning: 'responsible for' });
check('chunk stored as one entry, not split', model.chunkBank.length === 1 && chunkEntry.chunk === 'in charge of');
const flu = recordFluencyAttempt(model, 'because', true, { textId: 'text_1', marking: 'SLOW' });
check('fluency markingHistory captures raw marking', flu.markingHistory[0].marking === 'SLOW');

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
