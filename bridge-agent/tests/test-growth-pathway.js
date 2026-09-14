// Scratch integration test — not part of the shipped app. Run with node.
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
const FILES = ['core/storage.js', 'core/student-state.js', 'core/student-model.js', 'core/text-intake.js',
  'core/evidence-engine.js', 'core/decision-engine.js', 'core/scaffold-engine.js', 'core/isolation-check.js',
  'core/fading-engine.js', 'core/growth-session.js', 'growth/growth-pathway.js'];
let __src = FILES.map(f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8')).join('\n;\n');
eval(__src);

const authenticText = "The government makes important laws. Colonists were in charge of their own farms.";
const textRecord = createTextRecord({
  title: 'Colonial Life',
  authenticText,
  taggedWords: [{ word: 'government', meaning: 'a group of people who run a country', chineseScaffold: '政府' }],
  taggedChunks: [{ chunk: 'in charge of', meaning: 'responsible for', functionOrUse: 'shows who is responsible' }],
  mainIdeaSentence: 'The government makes laws and colonists were in charge of their farms.'
});
saveTextRecord(textRecord);
console.log('1. Text intake accepted arbitrary text:', !!textRecord.textId);

const session = createGrowthSession({ textRecord });
session.init();

// tokens: government(0) makes(1) important(2) laws(3) Colonists(4) were(5) in(6) charge(7) of(8) their(9) own(10) farms(11)
const tokens = tokenizeWithSentences(authenticText);
console.log('tokens:', tokens.map(t => `${t.wordIndex}:${t.word}`).join(' '));

// tokens: 0:The 1:government 2:makes 3:important 4:laws 5:Colonists 6:were 7:in 8:charge 9:of 10:their 11:own 12:farms
// Cold Read: "makes" ACCURATE, "important" SLOW, "government" UNKNOWN_MEANING, "in charge of" chunk UNKNOWN_MEANING
session.recordColdReadMarking({ wordIndices: 2, marking: 'ACCURATE' });
session.recordColdReadMarking({ wordIndices: 3, marking: 'SLOW' });
session.recordColdReadMarking({ wordIndices: 1, marking: 'UNKNOWN_MEANING' });
session.recordColdReadMarking({ wordIndices: [7, 8, 9], marking: 'UNKNOWN_MEANING' });

console.log('2. Item classification:');
console.log('   items created:', Object.keys(session.state.items));
console.log('   exactly 2 items (1 word + 1 chunk, not split):', Object.keys(session.state.items).length === 2);
console.log('   fluencyWords has "important":', loadStudentModel().fluencyWords.some(f => f.word === 'important'));
console.log('   "makes" not banked:', !loadStudentModel().wordBank.some(w => w.word === 'makes'));

session.finishColdRead();
console.log('3. Phase after cold read:', session.state.phase, '(expect WORD_CHUNK_SUPPORT)');

// --- Item 1: government (word) ---
let content = session.getSupportContent();
console.log('4. First item support prompt (should show meaning):', content.prompt.includes('a group of people who run a country'));
let result = session.submitItemResponse('a group that runs a country and makes laws');
console.log('5. Normal lightweight case resolves in ONE round (no isolation):', result.decision !== 'RUN_ONE_MORE_CHECK' && result.itemDone === true);
console.log('   decision was:', result.decision);

// --- Item 2: in charge of (chunk) ---
content = session.getSupportContent();
console.log('6. Second item is the chunk, not split into 3 words:', content.prompt.includes('in charge of'));
// simulate an ambiguous response -> should trigger isolation check
result = session.submitItemResponse('idk');
console.log('7. Ambiguous response triggers RUN_ONE_MORE_CHECK:', result.decision === 'RUN_ONE_MORE_CHECK');
result = session.submitItemIsolationResponse('it means they take care of the farm and make decisions about it');
console.log('   isolation resolves and item completes:', result.itemDone === true || result.decision === 'REDUCE_SUPPORT' || result.decision === 'REMOVE_SUPPORT');

console.log('8. Phase after all items:', session.state.phase, '(expect SENTENCE_MEANING, since an item needed support)');

// --- Sentence meaning ---
result = session.submitSentenceMeaningResponse('It means the government is in charge and makes the laws for everyone.');
console.log('9. Sentence meaning resolves:', result.done === true);
console.log('   phase now:', session.state.phase, '(expect GIST)');

// --- Gist ---
result = session.submitGistResponse('The government makes laws and colonists were in charge of their farms.');
console.log('10. Gist independent on strong overlap:', result.done === true);
console.log('    phase now:', session.state.phase, '(expect RETRIEVAL)');

// --- Bank persistence check ---
const modelAfter = loadStudentModel();
console.log('11. Word Bank has "government":', modelAfter.wordBank.some(w => w.word === 'government'));
console.log('    Chunk Bank has "in charge of":', modelAfter.chunkBank.some(c => c.chunk === 'in charge of'));
const govEntry = modelAfter.wordBank.find(w => w.word === 'government');
console.log('    government has originalSentence context:', govEntry.encounterHistory[0].sentence.includes('government'));
console.log('    government sourceTextIds includes textId:', govEntry.sourceTextIds.includes(textRecord.textId));

// --- Retrieval ---
console.log('12. Retrieval queue built from just-banked items:', session.state.retrieval.queue.length === 2);
session.state.retrieval.queue.forEach(q => session.submitRetrievalResponse(q.key, 'it means responsible for something'));
session.finishRetrieval();
console.log('    phase now:', session.state.phase, '(expect REREAD)');
console.log('    before-summary captured:', session.state.reread.before.itemsFlagged === 2);

// --- Reread ---
session.submitRereadGistResponse('The government makes laws and colonists were in charge of their farms.');
Object.keys(session.state.items).forEach(k => session.submitRereadItemResponse(k, 'it means responsible for taking care of something'));
session.finishSession();
console.log('13. Session done, after-summary:', JSON.stringify(session.state.reread.after));

// --- Transfer test: same word "government" in a SECOND text ---
const textRecord2 = createTextRecord({
  title: 'Local Government Today',
  authenticText: 'Today the government helps build roads and schools.',
  taggedWords: [], taggedChunks: [],
  mainIdeaSentence: 'The government helps build roads and schools.'
});
saveTextRecord(textRecord2);
const session2 = createGrowthSession({ textRecord: textRecord2 });
session2.init();
const tokens2 = tokenizeWithSentences(textRecord2.authenticText);
console.log('tokens2:', tokens2.map(t => `${t.wordIndex}:${t.word}`).join(' '));
// mark "government" ACCURATE this time (she reads/recognizes it fine) -> should NOT recreate a word item
session2.recordColdReadMarking({ wordIndices: 2, marking: 'ACCURATE' });
console.log('14. Familiar word marked ACCURATE creates no new item:', Object.keys(session2.state.items).length === 0);

// --- Explicit transfer test: mark it UNKNOWN_MEANING again (teacher unsure if she still knows it) ---
const textRecord3 = createTextRecord({
  title: 'Government Review', authenticText: 'The government protects people and property.',
  taggedWords: [{ word: 'government', meaning: 'a group of people who run a country' }], taggedChunks: [],
  mainIdeaSentence: 'The government protects people and property.'
});
saveTextRecord(textRecord3);
const session3 = createGrowthSession({ textRecord: textRecord3 });
session3.init();
session3.recordColdReadMarking({ wordIndices: 1, marking: 'UNKNOWN_MEANING' });
let supportContent = session3.getSupportContent();
console.log('17. Returning item gets a bare RECALL prompt, no meaning shown:', supportContent.isRecallTest === true && !supportContent.prompt.includes('a group of people'));
let recallResult = session3.submitItemResponse('the people in charge of running the country and making laws');
console.log('18. Unaided recall succeeds -> resolved immediately as transfer, no reteaching:', recallResult.decision === 'REMOVE_SUPPORT' && recallResult.itemDone === true);
const modelWithTransfer = loadStudentModel();
const govFinal = modelWithTransfer.wordBank.find(w => w.word === 'government');
console.log('19. Transfer evidence recorded on the SAME entry (still exactly one):', govFinal.transferEvidence.length === 1 && govFinal.transferEvidence[0].succeededUnaided === true);
console.log('    still exactly one "government" entry total:', modelWithTransfer.wordBank.filter(w => w.word === 'government').length === 1);

const modelFinal = loadStudentModel();
console.log('15. Still exactly ONE "government" entry across both texts (no duplicate):',
  modelFinal.wordBank.filter(w => w.word === 'government').length === 1);
console.log('16. Regression: bridgeCoreData_v2 untouched by growth session (separate store):',
  localStorage.getItem('bridgeCoreData_v2') === null || JSON.parse(localStorage.getItem('bridgeCoreData_v2')).records);

console.log('\nALL CHECKS ABOVE SHOULD READ true / expected phase names.');
