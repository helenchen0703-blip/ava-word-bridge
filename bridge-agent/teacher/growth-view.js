// teacher/growth-view.js — English Growth Agent, Teacher View
// Shown in the SAME teacher modal BRIDGE uses (index.html's #teacherModal) —
// no new modal, no new visual language. Reads the shared student model
// (core/student-model.js) directly, plus the growth session's own trace via
// the unchanged teacher/decision-trace.js renderer.

function renderGrowthTeacherView(container, { session, textRecord }) {
  const state = session.state;
  const model = loadStudentModel();

  const itemRows = state.itemOrder.map(key => {
    const item = state.items[key];
    const bankEntry = item.type === 'chunk'
      ? model.chunkBank.find(c => c.chunk.toLowerCase() === item.text.toLowerCase())
      : model.wordBank.find(w => w.word.toLowerCase() === item.text.toLowerCase());
    return `<div class="bridge-axis-row">
      <div class="bridge-axis-name">${item.type === 'chunk' ? 'Chunk' : 'Word'}: "${escapeHtmlTrace(item.text)}"</div>
      <div class="bridge-axis-text">
        status: <b>${item.dim.status}</b> · hint level: ${item.dim.hintLevel} · confidence: ${item.dim.confidence}
        ${item.dim.needsTeacherReview ? ' · <b>NEEDS REVIEW</b>' : ''}<br>
        bank status: ${bankEntry ? bankEntry.currentLearningStatus : '(not yet saved)'} ·
        seen in ${bankEntry ? bankEntry.sourceTextIds.length : 0} text(s) ·
        transfer events: ${bankEntry ? bankEntry.transferEvidence.length : 0}<br>
        original sentence: "${escapeHtmlTrace(item.sentence)}"
        ${item.rereadSucceeded !== undefined ? `<br>reread: ${item.rereadSucceeded ? 'succeeded unaided' : 'still needs support'}` : ''}
      </div>
    </div>`;
  }).join('') || '<div class="bridge-empty-note">No words or chunks were flagged this session.</div>';

  const fluencyRows = (state.coldReadEvidence || [])
    .filter(e => ['SLOW', 'MISREAD', 'STUCK'].includes(e.marking))
    .map(e => `<div class="bridge-tv-item">"${escapeHtmlTrace(e.text)}" — ${e.marking}</div>`).join('')
    || '<div class="bridge-empty-note">No fluency concerns marked this session.</div>';

  const before = state.reread.before, after = state.reread.after;

  container.innerHTML = `
    <div class="bridge-tv-section"><h4>Text</h4>
      <div class="bridge-tv-item"><b>${escapeHtmlTrace(textRecord.title)}</b></div>
      <div class="bridge-tv-item bridge-empty-note">${escapeHtmlTrace(textRecord.authenticText)}</div>
    </div>
    <div class="bridge-tv-section"><h4>Words &amp; Chunks flagged this session</h4>${itemRows}</div>
    <div class="bridge-tv-section"><h4>Fluency evidence (Cold Read)</h4>${fluencyRows}</div>
    ${before ? `<div class="bridge-tv-section"><h4>Before → After</h4>
      <div class="bridge-tv-item">Flagged: ${before.itemsFlagged} · avg hint level: ${before.avgHintLevel.toFixed(1)} · gist: ${before.gistStatus || 'n/a'}</div>
      ${after ? `<div class="bridge-tv-item">Resolved on reread: ${after.itemsResolved} of ${after.itemsFlagged} · gist: ${after.gistStatus || 'n/a'}</div>` : '<div class="bridge-empty-note">Reread not completed yet.</div>'}
    </div>` : ''}
    <div id="growthReviewMount"></div>
    ${renderDecisionTrace(state)}
  `;

  const reviewMount = container.querySelector('#growthReviewMount');
  renderGrowthReviewQueue(reviewMount, {
    session, textRecord,
    onResolved: () => renderGrowthTeacherView(container, { session, textRecord })
  });
}

// Bank-wide view (all words/chunks ever banked, not just this session) —
// shown from the Texts list, not tied to one session.
function renderWordChunkBankOverview(container) {
  const model = loadStudentModel();
  const wordRows = model.wordBank.map(w => `
    <div class="bridge-axis-row">
      <div class="bridge-axis-name">${escapeHtmlTrace(w.word)} <span class="bridge-axis-category">(${w.currentLearningStatus})</span></div>
      <div class="bridge-axis-text">meaning: ${escapeHtmlTrace(w.meaning || '(none yet)')} · seen in ${w.sourceTextIds.length} text(s) · transfer events: ${w.transferEvidence.length}</div>
    </div>`).join('') || '<div class="bridge-empty-note">No words banked yet.</div>';
  const chunkRows = model.chunkBank.map(c => `
    <div class="bridge-axis-row">
      <div class="bridge-axis-name">${escapeHtmlTrace(c.chunk)} <span class="bridge-axis-category">(${c.currentLearningStatus})</span></div>
      <div class="bridge-axis-text">meaning: ${escapeHtmlTrace(c.meaning || '(none yet)')} · seen in ${c.sourceTextIds.length} text(s) · transfer events: ${c.transferEvidence.length}</div>
    </div>`).join('') || '<div class="bridge-empty-note">No chunks banked yet.</div>';
  const fluencyRows = model.fluencyWords.map(f => `
    <div class="bridge-tv-item">${escapeHtmlTrace(f.word)} — correct: ${f.correctCount}, incorrect: ${f.incorrectCount}</div>`).join('')
    || '<div class="bridge-empty-note">No fluency evidence yet.</div>';

  container.innerHTML = `
    <div class="bridge-tv-section"><h4>Word Bank (${model.wordBank.length})</h4>${wordRows}</div>
    <div class="bridge-tv-section"><h4>Chunk Bank (${model.chunkBank.length})</h4>${chunkRows}</div>
    <div class="bridge-tv-section"><h4>Fluency Evidence</h4>${fluencyRows}</div>
  `;
}
