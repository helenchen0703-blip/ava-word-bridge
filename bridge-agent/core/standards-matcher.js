// core/standards-matcher.js — Ava BRIDGE Learning Agent, Content Standard Matcher
// "The school curriculum decides what Ava learns" — this file never invents
// or chooses curriculum. It only ranks candidate standards from the library
// against the teacher's own intake tags (no NLP, no semantic scoring) and
// always hands the result to the teacher to confirm or override. A task
// never becomes READY on the strength of this matcher alone.

const SUBJECT_TO_FRAMEWORKS = Object.freeze({
  WRITING: ['CCSS ELA'],
  READING: ['CCSS ELA'],
  MATH: ['CCSS Math', 'CCSS Mathematical Practices'],
  SCIENCE: ['NGSS'],
  SOCIAL_STUDIES: ['C3 Grades 3-5']
});

function tokenize(text) {
  return (text || '').toLowerCase().split(/\W+/).filter(w => w.length > 3);
}

function collectTaskKeywords(taskRecord) {
  const data = taskRecord.moduleIntakeData || {};
  const words = [];
  ['keyTermsExpected', 'keyWords', 'actionWords', 'expectedOperations'].forEach(field => {
    if (Array.isArray(data[field])) words.push(...data[field]);
  });
  ['evidenceIdea', 'mainIdeaSentence', 'literalQuestion'].forEach(field => {
    if (typeof data[field] === 'string') words.push(...tokenize(data[field]));
  });
  return words.map(w => w.toLowerCase());
}

function scoreStandard(standard, taskKeywords) {
  const text = tokenize(standard.domain + ' ' + standard.target);
  let score = 0;
  text.forEach(w => { if (taskKeywords.includes(w)) score += 1; });
  return score;
}

// Returns { suggestions: [{id, framework, domain, target, score}], usedFallback }
// suggestions is 1-3 items, ranked highest score first. Falls back to the
// library's ava_priority shortlist for this subject when nothing scores.
function matchContentStandards(taskRecord) {
  const library = loadStandardsLibrary();
  const frameworks = SUBJECT_TO_FRAMEWORKS[taskRecord.subject] || [];
  const candidates = library.standards.filter(s => frameworks.includes(s.framework));
  const taskKeywords = collectTaskKeywords(taskRecord);

  const scored = candidates
    .map(s => Object.assign({}, s, { score: scoreStandard(s, taskKeywords) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    return { suggestions: scored.slice(0, 3), usedFallback: false };
  }

  const subjectKey = (taskRecord.subject || '').toLowerCase();
  const priorityIds = (library.ava_priority[subjectKey] || []).filter(id => !id.startsWith('ELD-'));
  const fallback = priorityIds
    .map(id => candidates.find(s => s.id === id))
    .filter(Boolean)
    .slice(0, 3);
  return { suggestions: fallback, usedFallback: true };
}
