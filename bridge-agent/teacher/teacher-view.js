// teacher/teacher-view.js — Ava BRIDGE Learning Agent, generic Teacher View
// Reads learnerState.dimensions/.trace directly — no per-Module classify()
// functions (those read Writing-only `data` fields and are left behind).
// Same renderer for every subject, every task.

function renderTeacherView(container, { agent, taskRecord }) {
  const state = agent.state;
  const dimRows = Object.keys(state.dimensions).map(key => {
    const d = state.dimensions[key];
    return `<div class="bridge-axis-row">
      <div class="bridge-axis-name">${escapeHtmlTrace(key)} <span class="bridge-axis-category">(${d.category})</span></div>
      <div class="bridge-axis-text">
        status: <b>${d.status}</b> · attempts: ${d.attempts} · hint level: ${d.hintLevel} · confidence: ${d.confidence}
        ${d.needsTeacherReview ? ' · <b>NEEDS TEACHER REVIEW</b>' : ''}
        ${d.teacherOverride ? ` · overridden by ${escapeHtmlTrace(d.teacherOverride.teacher)}: ${d.teacherOverride.decision}` : ''}
        <br>successful with support: ${d.successfulAfterSupport} · successful without support: ${d.successfulWithoutSupport} · transfer: ${d.transferBackToAuthenticTask === null ? 'not yet tested' : d.transferBackToAuthenticTask}
      </div>
    </div>`;
  }).join('');

  container.innerHTML = `
    <div class="bridge-tv-section"><h4>Task</h4>
      <div class="bridge-tv-item"><b>${escapeHtmlTrace(taskRecord.title)}</b> (${taskRecord.subject})</div>
      <div class="bridge-tv-item bridge-empty-note">${escapeHtmlTrace(taskRecord.authenticText)}</div>
    </div>
    <div class="bridge-tv-section"><h4>Evidence, by dimension</h4>${dimRows}</div>
    <div class="bridge-tv-section"><h4>Roadblock determination</h4>
      <div class="bridge-tv-item"><b>Primary roadblock this session:</b> ${state.roadblock.primary || 'None recorded'}</div>
      <div class="bridge-tv-item"><b>Isolation Check result:</b> ${state.roadblock.isolationCheckResult || 'not run this session'}</div>
      <div class="bridge-tv-item"><b>Route taken:</b> ${state.route.history.join(' → ') || '(not started)'}</div>
    </div>
    <div id="bridgeTeacherReviewMount"></div>
    ${renderDecisionTrace(state)}
  `;

  const reviewMount = container.querySelector('#bridgeTeacherReviewMount');
  renderReviewQueue(reviewMount, {
    agent, taskRecord,
    onResolved: () => renderTeacherView(container, { agent, taskRecord })
  });
}
