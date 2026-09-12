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

  const standard = taskRecord.contentStandard;
  const demand = taskRecord.languageDemand;

  container.innerHTML = `
    <div class="bridge-tv-section"><h4>Task</h4>
      <div class="bridge-tv-item"><b>${escapeHtmlTrace(taskRecord.title)}</b> (${taskRecord.subject})</div>
      <div class="bridge-tv-item bridge-empty-note">${escapeHtmlTrace(taskRecord.authenticText)}</div>
    </div>
    <div class="bridge-tv-section"><h4>Standards + Language Alignment</h4>
      <div class="bridge-tv-item"><b>Content Standard:</b> ${standard ? `${escapeHtmlTrace(standard.id)} (${escapeHtmlTrace(standard.framework)}) — ${escapeHtmlTrace(standard.target)}` : 'none recorded'}</div>
      <div class="bridge-tv-item"><b>WIDA Language Demand:</b> ${demand ? `${escapeHtmlTrace(demand.discipline)} — ${escapeHtmlTrace(demand.klu)}` : 'none recorded'}</div>
      <button class="bridge-btn-outline" id="editAlignmentBtn">Change alignment</button>
      <div id="alignmentEditMount"></div>
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

  document.getElementById('editAlignmentBtn').addEventListener('click', () => {
    renderAlignmentEditor(document.getElementById('alignmentEditMount'), taskRecord, () => {
      saveTaskRecord(taskRecord);
      appendTrace(agent.state, {
        checkpointId: 'STANDARD_OVERRIDE', dimensionKey: null, responseSummary: '',
        statusBefore: null, statusAfter: null,
        evidenceNote: 'Teacher changed the standards/language alignment.',
        decision: null, ruleId: 'ruleTeacherOverrideRecorded', reason: 'Teacher override of suggested alignment.',
        contentStandardId: taskRecord.contentStandard ? taskRecord.contentStandard.id : null,
        languageDemandId: taskRecord.languageDemand ? `${taskRecord.languageDemand.discipline}.${taskRecord.languageDemand.klu}` : null
      });
      agent.save();
      renderTeacherView(container, { agent, taskRecord });
    });
  });
}

// Minimal inline editor reusing the same subject-filtered standard list and
// KLU lookup as the intake-time Confirm Alignment screen. Writes go through
// overrideContentStandard/overrideLanguageDemand (core/decision-engine.js) —
// a field replacement plus a caller-logged trace entry, never silent.
function renderAlignmentEditor(mount, taskRecord, onSaved) {
  const library = loadStandardsLibrary();
  const frameworks = SUBJECT_TO_FRAMEWORKS[taskRecord.subject] || [];
  const options = library.standards.filter(s => frameworks.includes(s.framework));
  const currentStandardId = taskRecord.contentStandard ? taskRecord.contentStandard.id : '';
  const currentKlu = taskRecord.languageDemand ? taskRecord.languageDemand.klu : '';

  mount.innerHTML = `
    <div class="bridge-field"><label>Content Standard</label>
      <select id="editStandardSelect">
        <option value="">(none)</option>
        ${options.map(s => `<option value="${s.id}" ${s.id === currentStandardId ? 'selected' : ''}>${s.id} — ${escapeHtmlTrace(s.target)}</option>`).join('')}
      </select>
    </div>
    <div class="bridge-field"><label>WIDA Language Demand</label>
      <select id="editKluSelect">
        <option value="">(none)</option>
        ${['Narrate', 'Inform', 'Explain', 'Argue'].map(k => `<option value="${k}" ${k === currentKlu ? 'selected' : ''}>${k}</option>`).join('')}
      </select>
    </div>
    <button class="bridge-btn-primary" id="saveAlignmentBtn">Save</button>`;

  document.getElementById('saveAlignmentBtn').addEventListener('click', () => {
    const standardId = document.getElementById('editStandardSelect').value;
    const chosen = options.find(s => s.id === standardId);
    overrideContentStandard(taskRecord, chosen ? { id: chosen.id, framework: chosen.framework, target: chosen.target } : { id: null }, 'teacher');
    if (!chosen) taskRecord.contentStandard = null;

    const klu = document.getElementById('editKluSelect').value;
    if (klu) {
      const discipline = SUBJECT_TO_DISCIPLINE[taskRecord.subject];
      const expectations = library.wida_language_layer.language_expectations.filter(e => e.discipline === discipline && e.klu === klu);
      overrideLanguageDemand(taskRecord, {
        discipline, klu,
        expectation: { interpretive: expectations.find(e => e.mode === 'Interpretive') || null, expressive: expectations.find(e => e.mode === 'Expressive') || null }
      }, 'teacher');
    } else {
      taskRecord.languageDemand = null;
    }
    onSaved();
  });
}
