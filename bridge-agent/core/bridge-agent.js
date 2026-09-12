// core/bridge-agent.js — Ava BRIDGE Learning Agent, generic checkpoint orchestrator
// The ONE piece of code that runs every task, every subject. It never contains
// subject content — everything subject-specific comes from the Module object
// passed into createBridgeAgent(). This is what fires unchanged whether the
// TaskRecord is Athens/Sparta, sea turtles, or a muffin word problem.
//
// A Module's checkpoint contract:
//   checkpoints[checkpointId] = {
//     dimensionKey,                       // which learnerState.dimensions entry this evidences
//     evaluator(responseData, taskRecord) // -> { succeeded, statusAfter, confidence, ruleId, evidenceNote, responseSummary }
//     isolationPair?: {                   // supplied only if this checkpoint can run a discriminating check
//       hypothesisA, hypothesisB, discriminatingQuestion,
//       dimAKey, dimBKey,
//       matcher(isolationResponse) -> { matchesA, matchesB, confidence },
//       routeOnResolution(resolvedTo, taskRecord) -> nextCheckpointId
//     }
//   }
//   route[checkpointId] = (evalResult, taskRecord) => nextCheckpointId | null   // null = task complete
//   scaffoldContent(checkpointId, level, taskRecord, lastResortAllowed) -> { text, visual? }

function createBridgeAgent({ taskRecord, module }) {
  const experienceId = module.experienceId;
  const taskId = taskRecord.taskId;

  const agent = {
    state: null,

    init() {
      const existing = loadLearnerState(experienceId, taskId);
      this.state = existing || freshLearnerState({ dimensions: module.dimensionManifest });
      if (!this.state.route.currentNode) this.state.route.currentNode = module.firstCheckpointId;
      // One-time trace stamp, first init only, so "Task -> Standard -> WIDA
      // -> Baseline -> ..." is reconstructable by reading the trace top to
      // bottom. Informational only — never read by an evaluator or the
      // Decision Engine.
      if (!existing && this.state.trace.length === 0) {
        appendTrace(this.state, {
          checkpointId: 'STANDARDS_ALIGNMENT', dimensionKey: null,
          responseSummary: '', statusBefore: null, statusAfter: null,
          evidenceNote: 'Content standard and WIDA language demand recorded for this task.',
          decision: null, ruleId: 'ruleStandardsAlignmentRecorded', reason: 'Task intake confirmed by teacher.',
          contentStandardId: taskRecord.contentStandard ? taskRecord.contentStandard.id : null,
          languageDemandId: taskRecord.languageDemand
            ? `${taskRecord.languageDemand.discipline}.${taskRecord.languageDemand.klu}` : null
        });
        this.save();
      }
      return this.state;
    },

    save() { saveLearnerState(this.state, experienceId, taskId); },

    pushRouteIfChanged(next) {
      const history = this.state.route.history;
      if (history[history.length - 1] === next) return false;
      history.push(next);
      this.state.route.currentNode = next;
      return true;
    },

    // ---------- Primary entry point: a response comes in for the current checkpoint ----------
    handleCheckpoint(checkpointId, responseData) {
      const checkpoint = module.checkpoints[checkpointId];
      const dim = this.state.dimensions[checkpoint.dimensionKey];
      const statusBefore = dim.status;
      const evalResult = checkpoint.evaluator(responseData, taskRecord, this.state);

      applyEvidence(dim, {
        statusAfter: evalResult.statusAfter,
        confidence: evalResult.confidence,
        responseSummary: evalResult.responseSummary,
        succeeded: evalResult.succeeded
      });
      // A Module's evaluator may set hintLevel directly for checkpoints that
      // aren't a real retry ladder (e.g. "did this choice need >1 attempt") —
      // Core still owns the ladder's structural rules, but content-routing
      // checkpoints like these need dim.hintLevel to reflect what actually
      // happened so the decision trace records REDUCE vs REMOVE meaningfully.
      if (evalResult.hintLevel !== undefined) dim.hintLevel = Math.max(dim.hintLevel, evalResult.hintLevel);
      this.state.session.checkpointsAttempted += 1;

      appendTrace(this.state, {
        checkpointId, dimensionKey: checkpoint.dimensionKey,
        responseSummary: (evalResult.responseSummary || '').toString().slice(0, 140),
        statusBefore, statusAfter: dim.status,
        evidenceNote: evalResult.evidenceNote, decision: null,
        ruleId: evalResult.ruleId, reason: evalResult.evidenceNote
      });

      const decision = decideSupportTransition({
        dim, evalResult: { succeeded: evalResult.succeeded, confidence: dim.confidence },
        ladderLength: LADDER_LENGTH
      });

      return this._act(checkpointId, checkpoint, dim, evalResult, decision);
    },

    // ---------- Second-step entry point: the student answered the discriminating question ----------
    handleIsolationResponse(checkpointId, isolationResponseText) {
      const checkpoint = module.checkpoints[checkpointId];
      const pair = checkpoint.isolationPair;
      const dimA = this.state.dimensions[pair.dimAKey];
      const dimB = this.state.dimensions[pair.dimBKey];

      const result = runIsolationCheck({
        hypothesisA: pair.hypothesisA, hypothesisB: pair.hypothesisB,
        discriminatingQuestion: pair.discriminatingQuestion,
        studentResponse: isolationResponseText, matcher: pair.matcher,
        dimA, dimB
      });

      this.state.roadblock.isolationCheckResult = result.resolvedTo
        ? (result.resolvedTo === 'A' ? pair.hypothesisA : pair.hypothesisB)
        : 'INCONCLUSIVE';

      appendTrace(this.state, {
        checkpointId: 'ISOLATION_CHECK', dimensionKey: checkpoint.dimensionKey,
        responseSummary: (isolationResponseText || '').slice(0, 140),
        statusBefore: dimA.status, statusAfter: dimA.status,
        evidenceNote: result.evidenceNote, decision: null,
        ruleId: result.ruleId, reason: result.evidenceNote
      });

      if (!result.resolvedTo) {
        dimA.needsTeacherReview = true;
        if (dimB) dimB.needsTeacherReview = true;
        this.save();
        return { resolved: false, needsTeacherReview: true, nextCheckpointId: null };
      }

      const nextCheckpointId = pair.routeOnResolution(result.resolvedTo, taskRecord);
      if (this.pushRouteIfChanged(nextCheckpointId)) {
        appendTrace(this.state, {
          checkpointId: 'ROUTE', dimensionKey: checkpoint.dimensionKey, responseSummary: '',
          statusBefore: dimA.status, statusAfter: dimA.status,
          evidenceNote: `Routing to ${nextCheckpointId}.`, decision: nextCheckpointId,
          ruleId: 'routeAfterIsolationResolved', reason: result.evidenceNote
        });
      }
      this._finalizeIfComplete(nextCheckpointId);
      this.save();
      return { resolved: true, resolvedTo: result.resolvedTo, nextCheckpointId };
    },

    // ---------- Student-initiated "I need a hint," honored ahead of the Agent's own floor ----------
    requestHintEarly(checkpointId) {
      const checkpoint = module.checkpoints[checkpointId];
      const dim = this.state.dimensions[checkpoint.dimensionKey];
      const statusBefore = dim.status;
      const simulated = Object.assign({}, dim, { attempts: Math.max(dim.attempts, dim.hintLevel + 1) });
      const scaffoldLevel = chooseScaffoldLevel(simulated, LADDER_LENGTH);
      dim.hintLevel = Math.min(LADDER_LENGTH, Math.max(dim.hintLevel, scaffoldLevel.level));
      const content = module.scaffoldContent(checkpointId, dim.hintLevel, taskRecord, false, this.state);
      this.state.session.hintsRequestedTotal += 1;

      appendTrace(this.state, {
        checkpointId, dimensionKey: checkpoint.dimensionKey, responseSummary: '(student requested a hint)',
        statusBefore, statusAfter: dim.status,
        evidenceNote: 'Student-initiated hint request, ahead of the Agent floor.',
        decision: 'CONTINUE_SUPPORT', scaffoldAction: content && content.action,
        ruleId: 'ruleStudentRequestedHintEarly',
        reason: 'She asked for help before an attempt failed — student agency preserved alongside the Agent floor.'
      });
      this.save();
      return { level: dim.hintLevel, content };
    },

    // ---------- Teacher-in-the-loop: Confirm / Override / Ask for more evidence ----------
    applyTeacherDecision(checkpointId, decision, note, teacherName) {
      const checkpoint = module.checkpoints[checkpointId];
      const dim = this.state.dimensions[checkpoint.dimensionKey];
      applyTeacherOverride(dim, decision, note, teacherName);

      appendTrace(this.state, {
        checkpointId: 'TEACHER_OVERRIDE', dimensionKey: checkpoint.dimensionKey,
        responseSummary: note || '', statusBefore: dim.status, statusAfter: dim.status,
        evidenceNote: `Teacher recorded: ${decision}${note ? ' — ' + note : ''}`,
        decision, ruleId: 'ruleTeacherOverrideRecorded',
        reason: 'Teacher resolved a low-confidence / needs-review item.'
      });

      const evalResult = { succeeded: decision === 'REMOVE_SUPPORT' || decision === 'REDUCE_SUPPORT', confidence: 'HIGH' };
      const followUp = decideSupportTransition({ dim, evalResult, ladderLength: LADDER_LENGTH });
      return this._act(checkpointId, checkpoint, dim, evalResult, followUp);
    },

    // ---------- Shared reaction to a Decision Engine outcome ----------
    _act(checkpointId, checkpoint, dim, evalResult, decision) {
      if (decision.decision === 'RUN_ONE_MORE_CHECK') {
        if (checkpoint.isolationPair) {
          appendTrace(this.state, {
            checkpointId: 'ROUTE', dimensionKey: checkpoint.dimensionKey, responseSummary: '',
            statusBefore: dim.status, statusAfter: dim.status,
            evidenceNote: 'Confidence low — running the isolation check.', decision: 'RUN_ONE_MORE_CHECK',
            ruleId: decision.ruleId, reason: decision.reason
          });
          this.save();
          return {
            decision: 'RUN_ONE_MORE_CHECK', awaitingIsolationResponse: true,
            isolationPrompt: {
              question: checkpoint.isolationPair.discriminatingQuestion,
              hypothesisA: checkpoint.isolationPair.hypothesisA,
              hypothesisB: checkpoint.isolationPair.hypothesisB
            },
            dim
          };
        }
        // No isolation pair configured — Core never fakes a check it can't run.
        dim.needsTeacherReview = true;
        appendTrace(this.state, {
          checkpointId: 'ROUTE', dimensionKey: checkpoint.dimensionKey, responseSummary: '',
          statusBefore: dim.status, statusAfter: dim.status,
          evidenceNote: 'No isolation check configured for this checkpoint — flagged for teacher review.',
          decision: 'NEEDS_TEACHER_REVIEW', ruleId: 'ruleNoIsolationConfiguredNeedsReview', reason: decision.reason
        });
        this.save();
        return { decision: 'NEEDS_TEACHER_REVIEW', dim };
      }

      if (decision.decision === 'CONTINUE_SUPPORT') {
        const scaffoldLevel = chooseScaffoldLevel(dim, LADDER_LENGTH);
        dim.hintLevel = Math.max(dim.hintLevel, scaffoldLevel.level);
        const content = module.scaffoldContent(checkpointId, scaffoldLevel.level, taskRecord, scaffoldLevel.lastResortAllowed, this.state);
        appendTrace(this.state, {
          checkpointId, dimensionKey: checkpoint.dimensionKey, responseSummary: '',
          statusBefore: dim.status, statusAfter: dim.status,
          evidenceNote: decision.reason, decision: decision.decision,
          scaffoldAction: content && content.action, ruleId: scaffoldLevel.ruleId, reason: decision.reason
        });
        this.save();
        return { decision: decision.decision, scaffold: { level: scaffoldLevel.level, content }, dim };
      }

      // REDUCE_SUPPORT / REMOVE_SUPPORT / RETURN_TO_AUTHENTIC_TASK
      const nextCheckpointId = module.route[checkpointId]
        ? module.route[checkpointId](evalResult, taskRecord)
        : null;
      if (this.pushRouteIfChanged(nextCheckpointId || 'DONE')) {
        appendTrace(this.state, {
          checkpointId: 'ROUTE', dimensionKey: checkpoint.dimensionKey, responseSummary: '',
          statusBefore: dim.status, statusAfter: dim.status,
          evidenceNote: `Routing to ${nextCheckpointId || 'DONE'}.`, decision: decision.decision,
          ruleId: decision.ruleId, reason: decision.reason
        });
      }
      this._finalizeIfComplete(nextCheckpointId);
      this.save();
      return { decision: decision.decision, nextCheckpointId, dim };
    },

    _finalizeIfComplete(nextCheckpointId) {
      if (nextCheckpointId) return;
      const model = loadStudentModel();
      commitEvidenceToStudentModel(model, {
        taskId, subject: taskRecord.subject, finalDimensions: this.state.dimensions,
        languageDemand: taskRecord.languageDemand
      });
      saveStudentModel(model);
    },

    progressEstimate() {
      return genericProgressEstimate(this.state);
    },

    teacherReviewItems() {
      return Object.keys(this.state.dimensions)
        .filter(k => this.state.dimensions[k].needsTeacherReview)
        .map(k => ({ dimensionKey: k, dim: this.state.dimensions[k] }));
    }
  };

  return agent;
}
