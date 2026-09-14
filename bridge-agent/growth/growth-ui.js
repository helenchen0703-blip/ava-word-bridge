// growth/growth-ui.js — Ava English Growth Agent, screen dispatcher
// Reuses the exact .bridge-prompt/.bridge-hint-box/.bridge-response-input
// component set already in index.html's stylesheet — no new visual language.
// Dispatches purely on session.state.phase; the fixed pathway (one flow, not
// five subjects) means there is no route-graph/registry indirection to build.

function renderGrowthFlow(container, { session, textRecord, onExit }) {
  draw();

  function draw() {
    const phase = session.state.phase;
    if (phase === 'COLD_READ') return renderColdReadMarker(container, {
      textRecord, session, onDone: () => { session.finishColdRead(); draw(); }
    });
    if (phase === 'WORD_CHUNK_SUPPORT') return drawItemSupport();
    if (phase === 'SENTENCE_MEANING') return drawSentenceMeaning();
    if (phase === 'GIST') return drawGist();
    if (phase === 'RETRIEVAL') return drawRetrieval();
    if (phase === 'REREAD') return drawReread();
    if (phase === 'DONE') return drawSummary();
    container.innerHTML = `<div class="card"><p>Unknown phase.</p></div>`;
  }

  function card(inner) { container.innerHTML = `<div class="card">${inner}</div>`; }
  function authenticBox() {
    return `<div class="bridge-authentic-task"><div class="bridge-authentic-label">Authentic Text</div><div class="bridge-authentic-text"></div></div>`;
  }
  function fillAuthenticText() {
    const el = container.querySelector('.bridge-authentic-text');
    if (el) el.textContent = textRecord.authenticText;
  }

  // ---------- Word/Chunk Support ----------
  function drawItemSupport() {
    const item = session.currentItem();
    if (!item) { session.advanceToNextItem(); draw(); return; }
    const content = session.getSupportContent();
    card(`
      <h2>${item.type === 'chunk' ? 'Chunk' : 'Word'} Support</h2>
      ${authenticBox()}
      <div class="bridge-prompt"></div>
      <div class="input-row"><textarea class="answer-box bridge-response-input" id="itemInput" rows="3"></textarea></div>
      <div class="btn-row"><button class="btn btn-primary" id="itemSubmit">Submit →</button></div>`);
    fillAuthenticText();
    container.querySelector('.bridge-prompt').textContent = content.prompt;
    if (content.needsContent) {
      container.querySelector('#itemInput').disabled = true;
      container.querySelector('#itemSubmit').disabled = true;
      const note = document.createElement('div');
      note.className = 'bridge-hint-box';
      note.textContent = 'Sent to the teacher content-gap queue — see Teacher View.';
      container.querySelector('.card').appendChild(note);
      const skip = document.createElement('button');
      skip.className = 'btn-outline'; skip.textContent = 'Skip for now →';
      skip.style.marginTop = '10px';
      skip.addEventListener('click', () => { session.advanceToNextItem(); draw(); });
      container.querySelector('.card').appendChild(skip);
      return;
    }
    container.querySelector('#itemSubmit').addEventListener('click', () => {
      const text = container.querySelector('#itemInput').value.trim();
      if (!text) return;
      const result = session.submitItemResponse(text);
      handleItemResult(result);
    });
  }

  function handleItemResult(result) {
    if (result.decision === 'RUN_ONE_MORE_CHECK') return drawItemIsolation(result.isolationPrompt);
    if (result.decision === 'NEEDS_TEACHER_REVIEW') {
      card(`<h2>One moment</h2><p class="lead">That one's tricky — flagged for the teacher to check.</p>
        <div class="btn-row"><button class="btn btn-primary" id="continueBtn">Continue →</button></div>`);
      container.querySelector('#continueBtn').addEventListener('click', () => { session.advanceToNextItem(); draw(); });
      return;
    }
    draw(); // CONTINUE_SUPPORT redraws the same item with new content; itemDone advances automatically
  }

  function drawItemIsolation(prompt) {
    card(`
      <h2>Quick check</h2>
      <div class="bridge-isolation-question"></div>
      <div class="input-row"><textarea class="answer-box bridge-response-input" id="isoInput" rows="2"></textarea></div>
      <div class="btn-row"><button class="btn btn-primary" id="isoSubmit">Submit →</button></div>`);
    container.querySelector('.bridge-isolation-question').textContent = prompt.question;
    container.querySelector('#isoSubmit').addEventListener('click', () => {
      const text = container.querySelector('#isoInput').value.trim();
      if (!text) return;
      const result = session.submitItemIsolationResponse(text);
      handleItemResult(result);
    });
  }

  // ---------- Sentence Meaning ----------
  function drawSentenceMeaning(extraPrompt) {
    const sm = session.state.sentenceMeaning;
    card(`
      <h2>Sentence Meaning</h2>
      <div class="prompt-box"><div class="prompt-label">From the text</div><p class="prompt-text"></p></div>
      <div class="bridge-prompt">${extraPrompt || 'What does this sentence mean?'}</div>
      <div class="input-row"><textarea class="answer-box bridge-response-input" id="smInput" rows="3"></textarea></div>
      <div class="btn-row"><button class="btn btn-primary" id="smSubmit">Submit →</button></div>`);
    container.querySelector('.prompt-text').textContent = sm.sentence;
    container.querySelector('#smSubmit').addEventListener('click', () => {
      const text = container.querySelector('#smInput').value.trim();
      if (!text) return;
      const result = session.submitSentenceMeaningResponse(text);
      if (result.decision === 'RUN_ONE_MORE_CHECK') return drawSentenceIsolation(result.isolationPrompt);
      if (result.decision === 'CONTINUE_SUPPORT') return drawSentenceMeaning(result.prompt);
      draw();
    });
  }
  function drawSentenceIsolation(prompt) {
    card(`
      <h2>Quick check</h2>
      <div class="bridge-isolation-question"></div>
      <div class="input-row"><textarea class="answer-box bridge-response-input" id="smIsoInput" rows="2"></textarea></div>
      <div class="btn-row"><button class="btn btn-primary" id="smIsoSubmit">Submit →</button></div>`);
    container.querySelector('.bridge-isolation-question').textContent = prompt.question;
    container.querySelector('#smIsoSubmit').addEventListener('click', () => {
      const text = container.querySelector('#smIsoInput').value.trim();
      if (!text) return;
      session.submitSentenceMeaningIsolationResponse(text);
      draw();
    });
  }

  // ---------- Gist ----------
  function drawGist(extraPrompt) {
    card(`
      <h2>Gist</h2>
      ${authenticBox()}
      <div class="bridge-prompt">${extraPrompt || 'What is this text about? Tell me the main idea.'}</div>
      <div class="input-row"><textarea class="answer-box bridge-response-input" id="gistInput" rows="3"></textarea></div>
      <div class="btn-row"><button class="btn btn-primary" id="gistSubmit">Submit →</button></div>`);
    fillAuthenticText();
    container.querySelector('#gistSubmit').addEventListener('click', () => {
      const text = container.querySelector('#gistInput').value.trim();
      if (!text) return;
      const result = session.submitGistResponse(text);
      if (result.decision === 'RUN_ONE_MORE_CHECK') return drawGistIsolation(result.isolationPrompt);
      if (result.decision === 'CONTINUE_SUPPORT') return drawGist(result.prompt);
      draw();
    });
  }
  function drawGistIsolation(prompt) {
    card(`
      <h2>Quick check</h2>
      <div class="bridge-isolation-question"></div>
      <div class="input-row"><textarea class="answer-box bridge-response-input" id="gistIsoInput" rows="2"></textarea></div>
      <div class="btn-row"><button class="btn btn-primary" id="gistIsoSubmit">Submit →</button></div>`);
    container.querySelector('.bridge-isolation-question').textContent = prompt.question;
    container.querySelector('#gistIsoSubmit').addEventListener('click', () => {
      const text = container.querySelector('#gistIsoInput').value.trim();
      if (!text) return;
      session.submitGistIsolationResponse(text);
      draw();
    });
  }

  // ---------- Retrieval Practice ----------
  function drawRetrieval() {
    const queue = session.state.retrieval.queue.filter(q => !session.state.retrieval.results.some(r => r.key === q.key));
    if (!queue.length) { session.finishRetrieval(); draw(); return; }
    const q = queue[0];
    card(`
      <h2>Quick Retrieval</h2>
      <div class="bridge-prompt">What does "${q.text}" mean? (no peeking at the meaning — just try)</div>
      <div class="input-row"><textarea class="answer-box bridge-response-input" id="retrievalInput" rows="2"></textarea></div>
      <div class="btn-row"><button class="btn btn-primary" id="retrievalSubmit">Submit →</button></div>`);
    container.querySelector('#retrievalSubmit').addEventListener('click', () => {
      const text = container.querySelector('#retrievalInput').value.trim();
      if (!text) return;
      session.submitRetrievalResponse(q.key, text);
      draw();
    });
  }

  // ---------- Reread ----------
  function drawReread() {
    if (!session.state.reread.gistAsked) {
      card(`
        <h2>Reread</h2>
        ${authenticBox()}
        <p class="lead" style="font-size:15px;">Read it again — this time by yourself.</p>
        <div class="bridge-prompt">One more time: what is this text about?</div>
        <div class="input-row"><textarea class="answer-box bridge-response-input" id="rereadGistInput" rows="3"></textarea></div>
        <div class="btn-row"><button class="btn btn-primary" id="rereadGistSubmit">Submit →</button></div>`);
      fillAuthenticText();
      container.querySelector('#rereadGistSubmit').addEventListener('click', () => {
        const text = container.querySelector('#rereadGistInput').value.trim();
        if (!text) return;
        session.submitRereadGistResponse(text);
        session.state.reread.gistAsked = true;
        session.save();
        draw();
      });
      return;
    }
    const pending = session.state.itemOrder.filter(k => session.state.items[k].rereadSucceeded === undefined);
    if (pending.length) {
      const key = pending[0];
      const item = session.state.items[key];
      card(`
        <h2>Reread — one more time</h2>
        <div class="bridge-prompt">Without any help — what does "${item.text}" mean?</div>
        <div class="input-row"><textarea class="answer-box bridge-response-input" id="rereadItemInput" rows="2"></textarea></div>
        <div class="btn-row"><button class="btn btn-primary" id="rereadItemSubmit">Submit →</button></div>`);
      container.querySelector('#rereadItemSubmit').addEventListener('click', () => {
        const text = container.querySelector('#rereadItemInput').value.trim();
        if (!text) return;
        session.submitRereadItemResponse(key, text);
        draw();
      });
      return;
    }
    session.finishSession();
    draw();
  }

  // ---------- Summary ----------
  function drawSummary() {
    const before = session.state.reread.before || { itemsFlagged: 0, avgHintLevel: 0 };
    const after = session.state.reread.after || { itemsResolved: 0 };
    card(`
      <h2>Growth Summary</h2>
      ${authenticBox()}
      <div class="prompt-box">
        <div class="prompt-label">Before this session</div>
        <p class="prompt-text">${before.itemsFlagged} word/chunk${before.itemsFlagged === 1 ? '' : 's'} needed support.</p>
      </div>
      <div class="prompt-box">
        <div class="prompt-label">After rereading</div>
        <p class="prompt-text">${after.itemsResolved} of ${after.itemsFlagged} now understood without help.</p>
      </div>
      <div class="btn-row"><button class="btn btn-primary" id="doneBtn">Back to Texts →</button></div>`);
    fillAuthenticText();
    container.querySelector('#doneBtn').addEventListener('click', onExit);
  }
}
