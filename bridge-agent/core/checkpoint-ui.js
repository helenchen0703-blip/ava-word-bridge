// core/checkpoint-ui.js — Ava BRIDGE Learning Agent, generic checkpoint runner
// The plain UI any Module runs on when it doesn't supply its own
// renderExperience (Reading, Math, Science, Social Studies in v1 — see the
// MVP boundary: only Writing keeps a bespoke skin). Text/question/response
// box/hint box/progress bar. Same code for every such Module and every task.

function renderGenericCheckpointUI(container, { agent, module, taskRecord, onTaskComplete }) {
  draw();

  function draw() {
    const node = agent.state.route.currentNode;
    if (!node || node === 'DONE') { drawComplete(); return; }
    const checkpoint = module.checkpoints[node];
    if (!checkpoint) { drawComplete(); return; }
    const dim = agent.state.dimensions[checkpoint.dimensionKey];
    const prompt = checkpoint.prompt ? checkpoint.prompt(taskRecord) : '';

    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'bridge-checkpoint';

    const taskBox = document.createElement('div');
    taskBox.className = 'bridge-authentic-task';
    taskBox.innerHTML = `<div class="bridge-authentic-label">Authentic Task</div><div class="bridge-authentic-text"></div>`;
    taskBox.querySelector('.bridge-authentic-text').textContent = taskRecord.authenticText;
    wrap.appendChild(taskBox);

    const promptEl = document.createElement('div');
    promptEl.className = 'bridge-prompt';
    promptEl.textContent = prompt;
    wrap.appendChild(promptEl);

    const hintBox = document.createElement('div');
    hintBox.className = 'bridge-hint-box';
    hintBox.hidden = !dim.hintLevel;
    if (dim.hintLevel) {
      const content = module.scaffoldContent(node, dim.hintLevel, taskRecord, false, agent.state);
      hintBox.textContent = content.text;
    }
    wrap.appendChild(hintBox);

    const ta = document.createElement('textarea');
    ta.className = 'bridge-response-input';
    ta.rows = 4;
    ta.placeholder = 'Type your answer...';
    wrap.appendChild(ta);

    const btnRow = document.createElement('div');
    btnRow.className = 'bridge-btn-row';
    const hintBtn = document.createElement('button');
    hintBtn.type = 'button';
    hintBtn.className = 'bridge-btn-ghost';
    hintBtn.textContent = '💡 I need a hint';
    hintBtn.addEventListener('click', () => {
      agent.requestHintEarly(node);
      draw();
    });
    const submitBtn = document.createElement('button');
    submitBtn.type = 'button';
    submitBtn.className = 'bridge-btn-primary';
    submitBtn.textContent = 'Submit';
    submitBtn.addEventListener('click', () => {
      if (!ta.value.trim()) return;
      const result = agent.handleCheckpoint(node, ta.value.trim());
      handleResult(result, node);
    });
    btnRow.appendChild(hintBtn);
    btnRow.appendChild(submitBtn);
    wrap.appendChild(btnRow);

    container.appendChild(wrap);
  }

  function handleResult(result, checkpointId) {
    if (result.decision === 'RUN_ONE_MORE_CHECK' && result.awaitingIsolationResponse) {
      drawIsolation(checkpointId, result.isolationPrompt);
      return;
    }
    if (result.decision === 'NEEDS_TEACHER_REVIEW') {
      drawNeedsReview();
      return;
    }
    // CONTINUE_SUPPORT (stay on same checkpoint, scaffold now visible) or a
    // resolved outcome that advanced state.route.currentNode already.
    draw();
  }

  function drawIsolation(checkpointId, isolationPrompt) {
    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'bridge-checkpoint';
    const note = document.createElement('div');
    note.className = 'bridge-prompt';
    note.textContent = 'One more quick check to make sure we scaffold the right thing:';
    wrap.appendChild(note);
    const q = document.createElement('div');
    q.className = 'bridge-isolation-question';
    q.textContent = isolationPrompt.question;
    wrap.appendChild(q);
    const ta = document.createElement('textarea');
    ta.className = 'bridge-response-input';
    ta.rows = 3;
    wrap.appendChild(ta);
    const submitBtn = document.createElement('button');
    submitBtn.type = 'button';
    submitBtn.className = 'bridge-btn-primary';
    submitBtn.textContent = 'Submit';
    submitBtn.addEventListener('click', () => {
      if (!ta.value.trim()) return;
      const result = agent.handleIsolationResponse(checkpointId, ta.value.trim());
      if (result.needsTeacherReview) { drawNeedsReview(); return; }
      draw();
    });
    wrap.appendChild(submitBtn);
    container.appendChild(wrap);
  }

  function drawNeedsReview() {
    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'bridge-checkpoint';
    wrap.innerHTML = `<div class="bridge-prompt">This response was ambiguous — it's been flagged for your review in the Teacher View before continuing.</div>`;
    container.appendChild(wrap);
  }

  function drawComplete() {
    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'bridge-checkpoint';
    wrap.innerHTML = `<div class="bridge-prompt">Task complete — nice work!</div>`;
    container.appendChild(wrap);
    if (onTaskComplete) onTaskComplete();
  }
}
