// teacher/decision-trace.js — Ava BRIDGE Learning Agent, generic decision trace renderer
// Reads learnerState.trace directly. Subject-agnostic — works for any Module's
// checkpoint ids and dimension keys, since the trace shape is Core's, not the
// Module's. Replaces the old classify*() functions, which read Writing-only
// `data` fields and are left behind entirely.

function renderDecisionTrace(state) {
  if (!state.trace.length) {
    return '<div class="bridge-tv-section"><h4>Agent Decision Trace</h4><div class="bridge-empty-note">No agent decisions recorded yet.</div></div>';
  }
  const rows = state.trace.map(t => `
    <div class="bridge-trace-item">
      <b>#${t.seq} ${escapeHtmlTrace(t.checkpointId)}${t.dimensionKey && t.dimensionKey !== 'ROUTE' ? ' · ' + escapeHtmlTrace(t.dimensionKey) : ''}</b><br>
      Observed: "${escapeHtmlTrace((t.observed.responseSummary || '').toString())}" (was ${t.observed.statusBefore})<br>
      Decision: ${t.decision.type || '—'}${t.decision.scaffoldAction ? ' / ' + escapeHtmlTrace(t.decision.scaffoldAction) : ''}<br>
      Result: ${t.result.statusAfter} — ${escapeHtmlTrace(t.result.evidenceNote)}<br>
      <span class="bridge-trace-rule">rule: ${escapeHtmlTrace(t.ruleId)}</span><br>
      Reason: ${escapeHtmlTrace(t.reason)}
    </div>`).join('');
  return `<div class="bridge-tv-section"><h4>Agent Decision Trace (INPUT → EVIDENCE → DECISION → SCAFFOLD → NEXT DECISION)</h4>${rows}</div>`;
}

function escapeHtmlTrace(str) {
  return String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
