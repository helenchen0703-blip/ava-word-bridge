// teacher/growth-review.js — Ava English Growth Agent, content-gap queue
// Parallel to teacher/intake-review.js. Surfaces items that hit
// needsTeacherReview — either because no teacher-prepared meaning exists yet
// (never fabricated, per the approved design) or because an isolation check
// came back inconclusive. The teacher can add a meaning on the spot (which
// updates the TextRecord, so the SAME word is covered next time too) or
// override the decision directly — both paths go through
// session.applyItemOverride, which is trace-logged, never silent.

function renderGrowthReviewQueue(container, { session, textRecord, onResolved }) {
  const items = Object.keys(session.state.items)
    .map(key => ({ key, item: session.state.items[key] }))
    .filter(({ item }) => item.dim.needsTeacherReview);

  if (!items.length) {
    container.innerHTML = '<div class="bridge-tv-section"><h4>Content Review Queue</h4><div class="bridge-empty-note">Nothing needs review right now.</div></div>';
    return;
  }

  container.innerHTML = '<div class="bridge-tv-section"><h4>Content Review Queue</h4></div>';
  const section = container.querySelector('.bridge-tv-section');

  items.forEach(({ key, item }) => {
    const row = document.createElement('div');
    row.className = 'bridge-tv-item bridge-review-item';
    const hasMeaning = item.type === 'chunk' ? findChunkMeaning(textRecord, item.text) : findWordMeaning(textRecord, item.text);
    row.innerHTML = `
      <div><b>${item.type === 'chunk' ? 'Chunk' : 'Word'}: "${escapeHtmlTrace(item.text)}"</b> — from: "${escapeHtmlTrace(item.sentence)}"</div>
      ${hasMeaning ? '<div class="bridge-empty-note">Meaning is on file — response was ambiguous.</div>' : ''}
      <div class="bridge-review-actions"></div>`;
    const actions = row.querySelector('.bridge-review-actions');

    if (!hasMeaning) {
      const meaningInput = document.createElement('input');
      meaningInput.type = 'text';
      meaningInput.placeholder = 'Child-friendly meaning...';
      const addBtn = document.createElement('button');
      addBtn.className = 'bridge-btn-outline';
      addBtn.textContent = 'Add meaning & retry';
      addBtn.addEventListener('click', () => {
        const meaning = meaningInput.value.trim();
        if (!meaning) return;
        if (item.type === 'chunk') textRecord.taggedChunks.push({ chunk: item.text, meaning });
        else textRecord.taggedWords.push({ word: item.text, meaning });
        saveTextRecord(textRecord);
        item.dim.needsTeacherReview = false;
        session.applyItemOverride(key, 'CONTINUE_SUPPORT', 'Teacher added a meaning.', 'teacher');
        if (onResolved) onResolved();
      });
      actions.appendChild(meaningInput);
      actions.appendChild(addBtn);
    }

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'bridge-btn-outline';
    confirmBtn.textContent = 'Mark resolved (she understands it)';
    confirmBtn.addEventListener('click', () => {
      session.applyItemOverride(key, 'REMOVE_SUPPORT', 'Teacher confirmed understanding.', 'teacher');
      if (onResolved) onResolved();
    });
    actions.appendChild(confirmBtn);

    const skipBtn = document.createElement('button');
    skipBtn.className = 'bridge-btn-ghost';
    skipBtn.textContent = 'Come back to this later';
    skipBtn.addEventListener('click', () => {
      session.applyItemOverride(key, 'RETURN_TO_AUTHENTIC_TASK', 'Teacher deferred this item.', 'teacher');
      if (onResolved) onResolved();
    });
    actions.appendChild(skipBtn);

    section.appendChild(row);
  });
}
