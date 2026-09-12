// core/wida-matcher.js — Ava BRIDGE Learning Agent, WIDA Language Demand Matcher
// Answers one question only: "What language does Ava need to understand,
// participate in, and express understanding of THIS task?" Never merged with
// the Content Standard Matcher (core/standards-matcher.js) — this file never
// reads a content standard, and nothing that reads a content standard reads
// this file's output either. No fixed WIDA proficiency level is ever
// produced or stored here — only a task-specific Interpretive/Expressive
// language-demand pair, always teacher-confirmable.

const SUBJECT_TO_DISCIPLINE = Object.freeze({
  WRITING: 'Language Arts',
  READING: 'Language Arts',
  MATH: 'Mathematics',
  SCIENCE: 'Science',
  SOCIAL_STUDIES: 'Social Studies'
});

// Static, Core-owned lookup — not inferred, not NLP. A Module's intake
// schema supplies an actionWords-style field (see modules/*.js); this table
// maps those existing teacher-picked values onto a WIDA Key Language Use.
const ACTION_WORD_TO_KLU = Object.freeze({
  COMPARE: 'Inform', CONTRAST: 'Inform', DESCRIBE: 'Inform', SUMMARIZE: 'Inform', CLASSIFY: 'Inform',
  EXPLAIN: 'Explain',
  ARGUE: 'Argue', JUSTIFY: 'Argue', CLAIM: 'Argue',
  NARRATE: 'Narrate', SEQUENCE: 'Narrate', RETELL: 'Narrate'
});

function guessKeyLanguageUse(taskRecord) {
  const data = taskRecord.moduleIntakeData || {};
  const actionWords = data.actionWords || data.purposeWords || [];
  for (const word of actionWords) {
    if (ACTION_WORD_TO_KLU[word]) return ACTION_WORD_TO_KLU[word];
  }
  return null;
}

// Returns { discipline, klu, expectation: {interpretive, expressive} } | null
// (null when no actionWords field is present yet, e.g. a Module that hasn't
// added one — honest "can't guess" rather than a fabricated default).
function matchLanguageDemand(taskRecord) {
  const library = loadStandardsLibrary();
  const discipline = SUBJECT_TO_DISCIPLINE[taskRecord.subject];
  const klu = guessKeyLanguageUse(taskRecord);
  if (!discipline || !klu) return null;

  const expectations = library.wida_language_layer.language_expectations.filter(
    e => e.discipline === discipline && e.klu === klu
  );
  const interpretive = expectations.find(e => e.mode === 'Interpretive') || null;
  const expressive = expectations.find(e => e.mode === 'Expressive') || null;
  if (!interpretive && !expressive) return null;

  return { discipline, klu, expectation: { interpretive, expressive } };
}
