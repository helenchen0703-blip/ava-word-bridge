// core/text-intake.js — Ava English Growth Agent, TextRecord model
// Parallel to core/task-intake.js, but a TextRecord is not a TaskRecord: it
// carries no subject/standard/decision data, only the authentic text plus
// teacher-prepared word/chunk meanings (content enrichment source = teacher-
// prepared, per the approved design — never fabricated, never fetched).
// Never rewrites the authentic text. CRUD + shape only, same discipline as
// task-intake.js.

const TEXT_RECORD_KEY = 'bridgeTextRecords_v1';

// Rendered by the unchanged core/intake-form-renderer.js — the same
// zero-new-HTML seam BRIDGE already proved, now serving English Growth's
// one fixed pathway instead of five subject Modules.
const GROWTH_TEXT_INTAKE_SCHEMA = [
  { id: 'title', type: 'text', label: 'Title', required: true },
  { id: 'authenticText', type: 'textarea', label: 'Authentic text (paste verbatim)', required: true },
  { id: 'taggedWords', type: 'repeatable', label: 'Words Ava may not know the meaning of',
    fields: [
      { id: 'word', type: 'text' }, { id: 'meaning', type: 'text' },
      { id: 'chineseScaffold', type: 'text' }, { id: 'partOfSpeech', type: 'text' }
    ] },
  { id: 'taggedChunks', type: 'repeatable', label: 'Chunks / phrases Ava may not know',
    fields: [ { id: 'chunk', type: 'text' }, { id: 'meaning', type: 'text' } ] },
  { id: 'mainIdeaSentence', type: 'text', label: 'Expected gist / main idea answer', required: true }
];

function freshTextId() {
  return 'text_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

// taggedWords: [{ word, meaning, chineseScaffold, partOfSpeech, morphologyNote, pronunciationNote }]
// taggedChunks: [{ chunk, meaning, functionOrUse }]
function createTextRecord({ title, authenticText, taggedWords, taggedChunks, mainIdeaSentence, createdBy }) {
  return {
    textId: freshTextId(),
    title: title || '(untitled text)',
    authenticText: authenticText || '', // verbatim, never auto-rewritten
    taggedWords: taggedWords || [],
    taggedChunks: taggedChunks || [],
    mainIdeaSentence: mainIdeaSentence || '',
    createdAt: new Date().toISOString(),
    createdBy: createdBy || 'teacher'
  };
}

function loadAllTextRecords() {
  try {
    const raw = localStorage.getItem(TEXT_RECORD_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveTextRecord(textRecord) {
  const all = loadAllTextRecords();
  const idx = all.findIndex(t => t.textId === textRecord.textId);
  if (idx >= 0) all[idx] = textRecord; else all.push(textRecord);
  try {
    localStorage.setItem(TEXT_RECORD_KEY, JSON.stringify(all));
  } catch (e) {
    // Storage unavailable — session continues in memory only.
  }
  return textRecord;
}

function loadTextRecord(textId) {
  return loadAllTextRecords().find(t => t.textId === textId) || null;
}

// ---------- Text structure helpers (shared by cold-read-marker + growth-session) ----------
// Naive but sufficient for Grade 4 passages: split on sentence-ending
// punctuation, keep the punctuation attached. No NLP claim.
function splitIntoSentences(text) {
  const matches = (text || '').match(/[^.!?]+[.!?]*/g);
  return matches ? matches.map(s => s.trim()).filter(Boolean) : [];
}

// Tokenizes into words while keeping enough info to map a word index back to
// its containing sentence — this is what makes "return to the original
// sentence" possible for any arbitrary pasted text, not just a known one.
function tokenizeWithSentences(text) {
  const sentences = splitIntoSentences(text);
  const tokens = []; // { word, wordIndex, sentenceIndex, sentence }
  sentences.forEach((sentence, sentenceIndex) => {
    const words = sentence.match(/[A-Za-z']+/g) || [];
    words.forEach(word => {
      tokens.push({ word, wordIndex: tokens.length, sentenceIndex, sentence });
    });
  });
  return tokens;
}

function findWordMeaning(textRecord, word) {
  const lower = (word || '').trim().toLowerCase();
  const found = (textRecord.taggedWords || []).find(w => (w.word || '').trim().toLowerCase() === lower);
  return found || null;
}

function findChunkMeaning(textRecord, chunkText) {
  const lower = (chunkText || '').trim().toLowerCase();
  const found = (textRecord.taggedChunks || []).find(c => (c.chunk || '').trim().toLowerCase() === lower);
  return found || null;
}
