// bridge-agent.js — Writing Module orchestrator (Ava BRIDGE Learning Agent)
// Orchestration glue: the only file that touches both bridge-storage.js /
// bridge-rules.js AND (indirectly) the screen render functions in the HTML.
// The HTML calls into `Bridge.*` instead of hardcoding goTo(N); everything
// Bridge decides gets appended to the trace before it's acted on, so the
// trace is a faithful, replayable record of INPUT -> EVIDENCE -> DECISION ->
// SCAFFOLD -> RESPONSE -> NEXT DECISION.
//
// This file is still Writing-specific (per the architecture's deferred
// migration — see SKILL.md-adjacent plan notes): the Core/Module split is
// documented but not yet physically separated, since there is only one
// Module built so far. `EXPERIENCE_ID` is this Experience's key into Core's
// multi-experience storage record.

const EXPERIENCE_ID = 'writing.rocketWriting';

const Bridge = {
  state: null,

  init() {
    this.state = loadLearnerState(EXPERIENCE_ID) || freshLearnerState({ dimensions: WRITING_DIMENSIONS });
    if (!this.state.route.currentNode) this.state.route.currentNode = NODE.EXPLAIN_TASK;
    return this.state;
  },

  save() { saveLearnerState(this.state, EXPERIENCE_ID); },

  // Only records a route change when the node actually differs from the last
  // one — handleBridgeAttempt fires once per placement/attempt (e.g. once per
  // rocket chip), and without this guard a resolved bridge would log the same
  // "Routing to REDUCE_SUPPORT" line once per attempt instead of once total,
  // which would make the Teacher View trace look broken rather than replayable.
  pushRouteIfChanged(next, reasonNote) {
    const history = this.state.route.history;
    if (history[history.length - 1] === next) return false;
    history.push(next);
    return true;
  },

  // ---------- Checkpoint: Explain Task (Screen 2, and reused as the Screen 8 retest) ----------
  handleExplainTask(responseText, { isRetest } = {}) {
    const dim = this.state.dimensions.taskMeaning;
    const statusBefore = dim.status;
    dim.attempts += 1;
    dim.response = responseText;
    const result = evalExplainTask(responseText);
    dim.status = result.statusAfter;

    if (isRetest) {
      dim.successfulWithoutSupport = result.understands;
      dim.transferBackToAuthenticTask = result.understands;
      const indep = this.state.dimensions.independence;
      indep.status = result.understands ? BRIDGE_STATUS.INDEPENDENT : indep.status;
      indep.successfulWithoutSupport = result.understands;
      indep.transferBackToAuthenticTask = result.understands;
    }

    appendTrace(this.state, {
      checkpointId: isRetest ? 'ORIGINAL_TASK_RETEST' : 'EXPLAIN_TASK',
      dimensionKey: 'taskMeaning',
      responseSummary: responseText.slice(0, 140),
      statusBefore, statusAfter: dim.status,
      evidenceNote: result.evidenceNote,
      decision: isRetest ? (result.understands ? 'REMOVE_SUPPORT' : 'CONTINUE_SUPPORT') : null,
      ruleId: result.ruleId,
      reason: result.evidenceNote
    });

    if (isRetest) { this.save(); return result; }

    const route = routeAfterExplainTask(result);
    this.state.route.history.push(route.next);
    appendTrace(this.state, {
      checkpointId: 'ROUTE', dimensionKey: 'taskMeaning', responseSummary: '',
      statusBefore: dim.status, statusAfter: dim.status,
      evidenceNote: `Routing to ${route.next}.`, decision: route.next,
      ruleId: route.ruleId, reason: result.evidenceNote
    });
    this.save();
    return { ...result, nextNode: route.next };
  },

  // ---------- Checkpoint: Isolation Check (Screen 3) ----------
  handleIsolationCheck({ sameResponse, differentResponse, compareCheck, contrastCheck }) {
    const dim = this.state.dimensions.compareContrastConcept;
    const statusBefore = dim.status;
    dim.attempts += 1;
    const result = evalIsolationCheck({ sameResponse, differentResponse, compareCheck, contrastCheck });
    dim.status = result.statusAfter;
    dim.successfulWithoutSupport = result.conceptIntact && compareCheck.attempts <= 1 && contrastCheck.attempts <= 1;

    this.state.roadblock.isolationCheckResult = result.conceptIntact ? 'TASK_LANGUAGE_GAP' : 'CONCEPT_GAP';

    appendTrace(this.state, {
      checkpointId: 'ISOLATION_CHECK', dimensionKey: 'compareContrastConcept',
      responseSummary: `same="${sameResponse}" different="${differentResponse}"`.slice(0, 140),
      statusBefore, statusAfter: dim.status,
      evidenceNote: result.evidenceNote, decision: null,
      ruleId: result.ruleId, reason: result.evidenceNote
    });

    const route = routeAfterIsolationCheck(result);
    this.state.route.history.push(route.next);
    this.state.roadblock.primary = route.next === NODE.CONCEPT_BRIDGE ? 'COMPARISON_CONCEPT' : 'TASK_LANGUAGE';
    appendTrace(this.state, {
      checkpointId: 'ROUTE', dimensionKey: 'compareContrastConcept', responseSummary: '',
      statusBefore: dim.status, statusAfter: dim.status,
      evidenceNote: `Routing to ${route.next}.`, decision: route.next,
      ruleId: route.ruleId, reason: result.evidenceNote
    });
    this.save();
    return { ...result, nextNode: route.next };
  },

  // ---------- Checkpoint: Evidence Choice (Screen 5, the multiple-choice half) ----------
  handleEvidenceChoice({ correct, attempts }) {
    const dim = this.state.dimensions.evidenceUse;
    const statusBefore = dim.status;
    dim.attempts = attempts;
    const result = evalEvidenceChoice({ correct, attempts });
    dim.status = result.statusAfter;

    appendTrace(this.state, {
      checkpointId: 'EVIDENCE_CHECK', dimensionKey: 'evidenceUse',
      responseSummary: `correct=${correct} attempts=${attempts}`,
      statusBefore, statusAfter: dim.status,
      evidenceNote: result.evidenceNote, decision: null,
      ruleId: result.ruleId, reason: result.evidenceNote
    });

    if (!correct) { this.save(); return { ...result, nextNode: null }; } // still choosing, no route yet

    const route = routeAfterEvidenceCheck(result);
    this.state.route.history.push(route.next);
    this.state.roadblock.primary = route.next === NODE.EVIDENCE_BRIDGE ? 'EVIDENCE_USE' : this.state.roadblock.primary;
    appendTrace(this.state, {
      checkpointId: 'ROUTE', dimensionKey: 'evidenceUse', responseSummary: '',
      statusBefore: dim.status, statusAfter: dim.status,
      evidenceNote: `Routing to ${route.next}.`, decision: route.next,
      ruleId: route.ruleId, reason: result.evidenceNote
    });
    this.save();
    return { ...result, nextNode: route.next };
  },

  // ---------- Checkpoint: Organize Check (Screen 6, once all chips are placed) ----------
  handleOrganizeCheck({ totalAttempts, chipCount }) {
    const dim = this.state.dimensions.organization;
    const statusBefore = dim.status;
    dim.attempts = totalAttempts;
    const result = evalOrganizeCheck({ totalAttempts, chipCount });
    dim.status = result.statusAfter;

    appendTrace(this.state, {
      checkpointId: 'ORGANIZE_CHECK', dimensionKey: 'organization',
      responseSummary: `attempts=${totalAttempts} chips=${chipCount}`,
      statusBefore, statusAfter: dim.status,
      evidenceNote: result.evidenceNote, decision: null,
      ruleId: result.ruleId, reason: result.evidenceNote
    });

    const route = routeAfterOrganizeCheck(result);
    this.state.roadblock.primary = route.next === NODE.ORGANIZATION_BRIDGE ? 'ORGANIZATION' : this.state.roadblock.primary;
    if (this.pushRouteIfChanged(route.next)) {
      appendTrace(this.state, {
        checkpointId: 'ROUTE', dimensionKey: 'organization', responseSummary: '',
        statusBefore: dim.status, statusAfter: dim.status,
        evidenceNote: `Routing to ${route.next}.`, decision: route.next,
        ruleId: route.ruleId, reason: result.evidenceNote
      });
    }
    this.save();
    return { ...result, nextNode: route.next };
  },

  // ---------- Generic bridge-attempt handler ----------
  // Shared by all four bridges (Concept=Screen4, TaskMeaning=new, Evidence=Screen5's
  // ladder, Organization=Screen6's ladder). One rule set, reused four times, per
  // "minimum necessary scaffold" — no bridge gets special-cased logic.
  handleBridgeAttempt(dimensionKey, checkpointId, succeeded, responseSummary) {
    const dim = this.state.dimensions[dimensionKey];
    const statusBefore = dim.status;
    dim.attempts += 1;
    dim.response = responseSummary || dim.response;

    if (succeeded) {
      dim.successfulAfterSupport = dim.hintLevel > 0;
      dim.successfulWithoutSupport = dim.hintLevel === 0;
      if (dim.hintLevel === 0) dim.status = BRIDGE_STATUS.INDEPENDENT;
      else dim.status = BRIDGE_STATUS.EMERGING;
    } else if (detectLanguageExpressionSignal(responseSummary, false) === false && dim.status === BRIDGE_STATUS.UNKNOWN) {
      dim.status = BRIDGE_STATUS.NEEDS_EVIDENCE;
    }

    const support = decideSupportTransition(dim, succeeded);
    let scaffold = null;
    if (support.decision === 'CONTINUE_SUPPORT') {
      const track = resolveScaffoldTrack(this.state);
      scaffold = chooseScaffold(dim, track);
      dim.hintLevel = Math.max(dim.hintLevel, scaffold.level);
    }

    appendTrace(this.state, {
      checkpointId, dimensionKey,
      responseSummary: (responseSummary || '').slice(0, 140),
      statusBefore, statusAfter: dim.status,
      evidenceNote: succeeded
        ? `Succeeded at hint level ${dim.hintLevel} on attempt ${dim.attempts}.`
        : `Not yet successful (attempt ${dim.attempts}, hint level ${dim.hintLevel}).`,
      decision: support.decision, scaffoldAction: scaffold ? scaffold.action : null,
      track: this.state.roadblock.languageExpressionTrack ? 'EXPRESSION' : 'MEANING',
      ruleId: scaffold ? scaffold.ruleId : support.ruleId,
      reason: support.reason
    });

    const route = routeAfterBridgeAttempt(support.decision);
    if (route.next && this.pushRouteIfChanged(route.next)) {
      appendTrace(this.state, {
        checkpointId: 'ROUTE', dimensionKey, responseSummary: '',
        statusBefore: dim.status, statusAfter: dim.status,
        evidenceNote: `Routing to ${route.next}.`, decision: route.next,
        ruleId: route.ruleId, reason: support.reason
      });
    }
    this.save();
    return { decision: support.decision, scaffold, nextNode: route.next, dim };
  },

  // Student-initiated "I need a hint" — honored immediately, ahead of the Agent's
  // own floor. Keeps her agency to ask early while the Agent still owns the ceiling.
  requestHintEarly(dimensionKey, checkpointId) {
    const dim = this.state.dimensions[dimensionKey];
    const statusBefore = dim.status;
    const track = resolveScaffoldTrack(this.state);
    const simulated = { ...dim, attempts: Math.max(dim.attempts, dim.hintLevel + 1) };
    const scaffold = chooseScaffold(simulated, track);
    dim.hintLevel = Math.min(LADDER_LENGTH, Math.max(dim.hintLevel, scaffold.level));

    appendTrace(this.state, {
      checkpointId, dimensionKey, responseSummary: '(student requested a hint)',
      statusBefore, statusAfter: dim.status,
      evidenceNote: 'Student-initiated hint request, ahead of the Agent floor.',
      decision: 'CONTINUE_SUPPORT', scaffoldAction: scaffold.action, track,
      ruleId: 'ruleStudentRequestedHintEarly',
      reason: 'She asked for help before an attempt failed — student agency preserved alongside the Agent floor.'
    });
    this.save();
    return scaffold;
  },

  // ---------- Dynamic progress (never a fixed 7 dots; reflects HER actual route) ----------
  progressEstimate() {
    const history = this.state.route.history;
    const visited = history.length;
    const reachedReduceSupport = history.includes(NODE.REDUCE_SUPPORT);
    const reachedOriginalTask = history.includes(NODE.ORIGINAL_TASK);
    const remainingKnown = reachedOriginalTask ? 0 : reachedReduceSupport ? 1 : 2;
    const total = Math.max(visited + remainingKnown, 3);
    return { current: Math.min(visited, total), total };
  }
};
