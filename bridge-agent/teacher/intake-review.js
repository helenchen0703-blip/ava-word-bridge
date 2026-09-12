// teacher/intake-review.js — Ava BRIDGE Learning Agent, NEEDS_TEACHER_REVIEW queue
// "Do NOT use brittle keyword matching and pretend the Agent understands
// every free-text response." When confidence is LOW and no isolation check
// resolved it, the item lands here — a real UI queue, not a silent default.
// Teacher can Confirm the Agent's own last decision, Override it, or Ask for
// more evidence (recorded as RUN_ONE_MORE_CHECK). Every choice is logged to
// the trace via bridge-agent.js's applyTeacherDecision — never silent.

function renderReviewQueue(container, { agent, taskRecord, onResolved }) {
  const items = agent.teacherReviewItems();
  if (!items.length) {
    container.innerHTML = '<div class="bridge-tv-section"><h4>Teacher Review Queue</h4><div class="bridge-empty-note">Nothing needs review right now.</div></div>';
    return;
  }
  const currentNode = agent.state.route.currentNode;
  container.innerHTML = `<div class="bridge-tv-section"><h4>Teacher Review Queue</h4></div>`;
  const section = container.querySelector('.bridge-tv-section');

  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'bridge-tv-item bridge-review-item';
    row.innerHTML = `
      <div><b>${escapeHtmlTrace(item.dimensionKey)}</b> — response: "${escapeHtmlTrace(item.dim.response)}" (confidence: ${item.dim.confidence})</div>
      <div class="bridge-review-actions"></div>`;
    const actions = row.querySelector('.bridge-review-actions');

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'bridge-btn-outline';
    confirmBtn.textContent = 'Confirm Agent Decision';
    confirmBtn.addEventListener('click', () => resolve('CONTINUE_SUPPORT', 'Teacher confirmed the Agent\'s read.'));

    const overrideBtn = document.createElement('button');
    overrideBtn.className = 'bridge-btn-outline';
    overrideBtn.textContent = 'Override → mark Independent';
    overrideBtn.addEventListener('click', () => {
      const note = prompt('Why are you overriding this decision?') || '';
      resolve('REMOVE_SUPPORT', note);
    });

    const moreEvidenceBtn = document.createElement('button');
    moreEvidenceBtn.className = 'bridge-btn-outline';
    moreEvidenceBtn.textContent = 'Ask for more evidence';
    moreEvidenceBtn.addEventListener('click', () => resolve('RUN_ONE_MORE_CHECK', 'Teacher requested more evidence before deciding.'));

    actions.appendChild(confirmBtn);
    actions.appendChild(overrideBtn);
    actions.appendChild(moreEvidenceBtn);
    section.appendChild(row);

    function resolve(decision, note) {
      agent.applyTeacherDecision(currentNode, decision, note, 'teacher');
      if (onResolved) onResolved();
    }
  });
}
