// experiences/writing/rocket-writing.js — Rocket Writing Experience
// Migrated from Ava_Rocket_Writing_BRIDGE_Agent.html. Every render function
// now takes `taskRecord` and reads content from taskRecord.moduleIntakeData
// instead of a global constant (PROMPT_TEXT, IDEA_CHIPS, etc.) — this is the
// same code whether the task is Athens/Sparta or the water cycle vs. the rock
// cycle. Pet SVGs and the rocket SVG move here unchanged (per the migration
// plan, they were already 100% generic). Oral rehearsal (screen 7) and the
// pet-mission title flourish are dropped in this migration to keep the
// Experience focused on the BRIDGE loop itself — see the plan's MVP boundary.

function dogSVG(size) {
  size = size || 56;
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="dogFur" cx="38%" cy="30%" r="75%"><stop offset="0%" stop-color="#f6dfb9"/><stop offset="100%" stop-color="#dba76a"/></radialGradient>
      <linearGradient id="dogEar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#c8934f"/><stop offset="100%" stop-color="#a97638"/></linearGradient>
    </defs>
    <ellipse cx="21" cy="52" rx="11" ry="24" fill="url(#dogEar)" transform="rotate(-12 21 52)"/>
    <ellipse cx="79" cy="52" rx="11" ry="24" fill="url(#dogEar)" transform="rotate(12 79 52)"/>
    <circle cx="50" cy="53" r="31" fill="url(#dogFur)"/>
    <ellipse cx="35" cy="72" rx="6" ry="4" fill="#f6dfb9" opacity=".7"/><ellipse cx="65" cy="72" rx="6" ry="4" fill="#f6dfb9" opacity=".7"/>
    <ellipse cx="50" cy="68" rx="15" ry="12" fill="#fdf6ea"/>
    <ellipse cx="39" cy="49" rx="4.3" ry="5.2" fill="#4a3626"/><ellipse cx="61" cy="49" rx="4.3" ry="5.2" fill="#4a3626"/>
    <circle cx="40.3" cy="47" r="1.3" fill="#fff"/><circle cx="62.3" cy="47" r="1.3" fill="#fff"/>
    <ellipse cx="50" cy="63" rx="5.4" ry="4" fill="#3a2a1c"/>
    <path d="M50 66 L50 69" stroke="#3a2a1c" stroke-width="2" stroke-linecap="round"/>
    <path d="M40 72 Q50 78 60 72" stroke="#3a2a1c" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  </svg>`;
}
function catSVG(size) {
  size = size || 56;
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="catFur" cx="38%" cy="30%" r="75%"><stop offset="0%" stop-color="#efeaf3"/><stop offset="100%" stop-color="#c3b7d6"/></radialGradient></defs>
    <polygon points="22,44 30,12 46,42" fill="#a692c4"/><polygon points="78,44 70,12 54,42" fill="#a692c4"/>
    <polygon points="26,40 31,21 41,40" fill="#f3e9f5"/><polygon points="74,40 69,21 59,40" fill="#f3e9f5"/>
    <circle cx="50" cy="55" r="31" fill="url(#catFur)"/>
    <ellipse cx="34" cy="66" rx="7" ry="5" fill="#f8f4fa" opacity=".8"/><ellipse cx="66" cy="66" rx="7" ry="5" fill="#f8f4fa" opacity=".8"/>
    <path d="M27 52 Q12 49 8 45" stroke="#8f7fa8" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M27 58 Q11 60 8 62" stroke="#8f7fa8" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M73 52 Q88 49 92 45" stroke="#8f7fa8" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M73 58 Q89 60 92 62" stroke="#8f7fa8" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <ellipse cx="38" cy="53" rx="4.8" ry="6" fill="#463a5c"/><ellipse cx="62" cy="53" rx="4.8" ry="6" fill="#463a5c"/>
    <ellipse cx="38" cy="53" rx="1.6" ry="4.2" fill="#a89bc4"/><ellipse cx="62" cy="53" rx="1.6" ry="4.2" fill="#a89bc4"/>
    <circle cx="39.4" cy="50.5" r="1.2" fill="#fff"/><circle cx="63.4" cy="50.5" r="1.2" fill="#fff"/>
    <path d="M50 61 L46.5 65 L53.5 65 Z" fill="#3d3547"/>
    <path d="M50 65 Q46 70 41 68" stroke="#3d3547" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M50 65 Q54 70 59 68" stroke="#3d3547" stroke-width="2" fill="none" stroke-linecap="round"/>
  </svg>`;
}
function petSpeech(pet, text, cls) {
  const svg = pet === 'dog' ? dogSVG(44) : catSVG(44);
  return `<div class="speech ${cls || ''}"><div class="speech-pet">${svg}</div><div>${text}</div></div>`;
}
function escapeHtml(str) { return String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function renderRocketWritingExperience(container, { agent, module, taskRecord, onTaskComplete }) {
  const intake = taskRecord.moduleIntakeData;
  const sub = { s3: 'same', s4: 0, selectedChip: null, sameResponse: '', differentResponse: '', concept: { compare: { attempts: 0, correct: null }, contrast: { attempts: 0, correct: null } } };
  const conceptTexts = {}; // per key term, free-text explanation during CONCEPT_BRIDGE
  const rocket = { placements: {}, attempts: {} };
  const evidenceState = { choice: null, correct: null, attempts: 0 };
  let introShown = agent.state.trace.length > 0; // skip the intro if resuming a task already in progress

  draw();

  function draw() {
    if (!introShown) { renderIntro(); return; }
    const node = agent.state.route.currentNode;
    if (!node || node === 'DONE') { renderComplete(); return; }
    const dispatch = {
      EXPLAIN_TASK: renderExplainTask,
      TASK_MEANING_BRIDGE: renderTaskMeaningBridge,
      CONCEPT_BRIDGE: renderConceptBridge,
      EVIDENCE_CHECK: renderEvidenceCheck,
      EVIDENCE_BRIDGE: renderEvidenceBridge,
      ORGANIZE_CHECK: renderOrganizeCheck,
      ORGANIZATION_BRIDGE: renderOrganizationBridge,
      RETURN_TO_TASK: renderReturnToTask
    };
    (dispatch[node] || renderComplete)();
  }

  function card(inner) { container.innerHTML = `<div class="card">${inner}</div>`; }
  function promptBox() { return `<div class="prompt-box"><div class="prompt-label">Your Assignment</div><p class="prompt-text">${escapeHtml(taskRecord.authenticText)}</p></div>`; }

  function renderIntro() {
    card(`
      <h1>🐾 Writing Mission</h1>
      <p class="subhead">Your pet team needs your help to solve a writing mission.</p>
      <div class="pet-row"><div class="pet-wrap">${dogSVG(84)}<span class="pet-name">Buddy</span></div><div class="pet-wrap">${catSVG(84)}<span class="pet-name">Detective</span></div></div>
      <p class="lead">First, let's look at the real school task.</p>
      ${promptBox()}
      <div class="btn-row"><button class="btn btn-primary" id="startBtn">START THE MISSION →</button></div>`);
    container.querySelector('#startBtn').addEventListener('click', () => { introShown = true; draw(); });
  }

  function renderExplainTask() {
    card(`
      <h2>🕵️ What do you think?</h2>
      ${promptBox()}
      <div class="ask-line">What is this assignment asking you to do?</div>
      <div class="input-row"><textarea class="answer-box" id="input"></textarea></div>
      <div class="btn-row"><button class="btn btn-primary" id="submitBtn" disabled>Submit →</button></div>
      <div id="feedback"></div>`);
    wireTextarea('input', 'submitBtn');
    container.querySelector('#submitBtn').addEventListener('click', () => {
      const text = container.querySelector('#input').value.trim();
      if (!text) return;
      const result = agent.handleCheckpoint('EXPLAIN_TASK', text);
      if (result.decision === 'RUN_ONE_MORE_CHECK' && result.awaitingIsolationResponse) { sub.s3 = 'same'; renderIsolationCheck(); return; }
      container.querySelector('#feedback').innerHTML = petSpeech('dog', "You gave it a try. Now let's investigate the mission. 🔍", '');
      setTimeout(draw, 900);
    });
  }

  // ---------- Isolation Check: same/different free text + compare/contrast MC ----------
  function renderIsolationCheck() {
    let body = '';
    if (sub.s3 === 'same' || sub.s3 === 'different') {
      const isSame = sub.s3 === 'same';
      body = `
        <div class="objects-row"><div class="object-card">${dogSVG(60)}<span>Dog</span></div><div class="object-card">${catSVG(60)}<span>Cat</span></div></div>
        <div class="ask-line">What is ${isSame ? 'the SAME' : 'DIFFERENT'}?</div>
        <div class="input-row"><textarea class="answer-box" id="isoInput"></textarea></div>
        <div class="btn-row"><button class="btn btn-primary" id="isoNext" disabled>Next →</button></div>`;
    } else if (sub.s3 === 'ask_compare' || sub.s3 === 'ask_contrast') {
      const kind = sub.s3 === 'ask_compare' ? 'compare' : 'contrast';
      const verb = kind === 'compare' ? 'COMPARE' : 'CONTRAST';
      body = `${petSpeech('cat', `What should your brain look for when we ${verb} two things?`, 'cat')}
        <div class="choice-row" id="cchoices">
          <button class="choice-btn" data-pick="same">things that are the same</button>
          <button class="choice-btn" data-pick="different">things that are different</button>
        </div><div id="catfeedback"></div>`;
    } else {
      body = `<div class="reveal-card">COMPARE = look for what is the SAME</div><div class="reveal-card">CONTRAST = look for what is DIFFERENT</div>
        ${petSpeech('dog', "Nice detective work! Let's crack the real mission next.", '')}
        <div class="btn-row"><button class="btn btn-primary" id="isoFinish">Continue →</button></div>`;
    }
    card(`<h2>Same or Different?</h2>${body}`);

    if (sub.s3 === 'same' || sub.s3 === 'different') {
      wireTextarea('isoInput', 'isoNext');
      container.querySelector('#isoNext').addEventListener('click', () => {
        const val = container.querySelector('#isoInput').value.trim();
        if (!val) return;
        if (sub.s3 === 'same') { sub.sameResponse = val; sub.s3 = 'different'; }
        else { sub.differentResponse = val; sub.s3 = 'ask_compare'; }
        renderIsolationCheck();
      });
    } else if (sub.s3 === 'ask_compare' || sub.s3 === 'ask_contrast') {
      const kind = sub.s3 === 'ask_compare' ? 'compare' : 'contrast';
      container.querySelectorAll('#cchoices .choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const pick = btn.dataset.pick;
          const correct = kind === 'compare' ? pick === 'same' : pick === 'different';
          const entry = sub.concept[kind];
          entry.attempts += 1;
          if (correct) entry.correct = true;
          container.querySelectorAll('#cchoices .choice-btn').forEach(b => { b.disabled = true; if (b.dataset.pick === pick) b.classList.add(correct ? 'correct' : 'incorrect'); });
          container.querySelector('#catfeedback').innerHTML = correct
            ? petSpeech('cat', "Yes! You've got sharp detective eyes. 🔍", 'cat') + `<div class="btn-row"><button class="btn btn-primary" id="advBtn">Next →</button></div>`
            : petSpeech('cat', `That's okay — every detective double-checks. Think about the word ${kind.toUpperCase()} again.`, 'cat') + `<div class="btn-row"><button class="btn btn-outline" id="retryBtn">Try again</button></div>`;
          if (correct) container.querySelector('#advBtn').addEventListener('click', () => { sub.s3 = kind === 'compare' ? 'ask_contrast' : 'reveal'; renderIsolationCheck(); });
          else container.querySelector('#retryBtn').addEventListener('click', renderIsolationCheck);
        });
      });
    } else {
      container.querySelector('#isoFinish').addEventListener('click', () => {
        const payload = JSON.stringify({
          sameResponse: sub.sameResponse, differentResponse: sub.differentResponse,
          compareCorrect: sub.concept.compare.correct, contrastCorrect: sub.concept.contrast.correct,
          compareAttempts: sub.concept.compare.attempts, contrastAttempts: sub.concept.contrast.attempts
        });
        const result = agent.handleIsolationResponse('EXPLAIN_TASK', payload);
        if (result.needsTeacherReview) { renderNeedsReview(); return; }
        draw();
      });
    }
  }

  function renderTaskMeaningBridge() {
    const dim = agent.state.dimensions.taskMeaning;
    const content = dim.hintLevel ? module.scaffoldContent('TASK_MEANING_BRIDGE', dim.hintLevel, taskRecord, false, agent.state) : null;
    card(`
      <h2>Crack the Whole Mission</h2>
      ${petSpeech('cat', "You know COMPARE and CONTRAST — now let's put the WHOLE assignment into your own words.", 'cat')}
      ${promptBox()}
      <div class="ask-line">What is this WHOLE assignment asking you to do?</div>
      ${content ? `<div class="hint-box">${escapeHtml(content.text)}</div>` : ''}
      <div class="input-row"><textarea class="answer-box" id="input">${escapeHtml(dim.response)}</textarea></div>
      <div class="btn-row"><button class="hint-btn" id="hintBtn">💡 I need a hint</button></div>
      <div class="btn-row"><button class="btn btn-primary" id="submitBtn">Submit →</button></div>`);
    container.querySelector('#hintBtn').addEventListener('click', () => { agent.requestHintEarly('TASK_MEANING_BRIDGE'); draw(); });
    container.querySelector('#submitBtn').addEventListener('click', () => {
      const text = container.querySelector('#input').value.trim();
      if (!text) return;
      agent.handleCheckpoint('TASK_MEANING_BRIDGE', text);
      draw();
    });
  }

  function renderConceptBridge() {
    const terms = intake.keyTermsExpected || [];
    const idx = Math.min(sub.s4, terms.length - 1);
    const term = terms[idx] || '(term)';
    conceptTexts[term] = conceptTexts[term] || '';
    const dim = agent.state.dimensions.compareContrastConcept;
    const level = dim.hintLevel;
    const content = level ? module.scaffoldContent('CONCEPT_BRIDGE', level, taskRecord, false, agent.state) : null;
    card(`
      <h2>Crack the Mission</h2>
      ${promptBox()}
      <div class="action-card">
        <div class="action-word">${escapeHtml(term)}</div>
        <div class="ask-line" style="margin-bottom:14px;">What do you think this word means?</div>
        <div class="input-row"><textarea class="answer-box" id="input">${escapeHtml(conceptTexts[term])}</textarea></div>
        ${content ? `<div class="hint-box">${escapeHtml(content.text)}</div>` : ''}
        <div class="btn-row"><button class="hint-btn" id="hintBtn">💡 I need a hint</button></div>
        <div class="btn-row"><button class="btn btn-primary" id="submitBtn">${idx < terms.length - 1 ? 'Next →' : "I've got it →"}</button></div>
      </div>`);
    container.querySelector('#hintBtn').addEventListener('click', () => { agent.requestHintEarly('CONCEPT_BRIDGE'); draw(); });
    container.querySelector('#submitBtn').addEventListener('click', () => {
      const text = container.querySelector('#input').value.trim();
      if (!text) return;
      conceptTexts[term] = text;
      if (idx < terms.length - 1) { sub.s4 += 1; draw(); return; }
      agent.handleCheckpoint('CONCEPT_BRIDGE', Object.values(conceptTexts).join(' | '));
      draw();
    });
  }

  function renderEvidenceCheck() {
    const choices = intake.evidenceChoices || [];
    const answered = evidenceState.choice !== null;
    card(`
      <h2>🔍 Evidence Detective</h2>
      ${petSpeech('cat', 'Here is an idea from the real text. Which sentence could be evidence for it?', 'cat')}
      <div class="prompt-box"><div class="prompt-label">The Idea</div><p class="prompt-text">${escapeHtml(intake.evidenceIdea)}</p></div>
      <div class="choice-row" id="choices">
        ${choices.map((c, i) => `<button class="choice-btn ${answered && evidenceState.choice === i ? (evidenceState.correct ? 'correct' : 'incorrect') : ''}" data-i="${i}" ${answered && evidenceState.correct ? 'disabled' : ''}>${escapeHtml(c.text)}</button>`).join('')}
      </div>
      <div id="feedback">${answered && evidenceState.correct ? '<div class="feedback-line good pop">Yes! That\'s evidence. ✅</div>' : (answered ? petSpeech('cat', 'Good detectives check more than one clue — take another look.', 'cat') : '')}</div>`);
    container.querySelectorAll('#choices .choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.i);
        if (evidenceState.correct) return;
        evidenceState.attempts += 1;
        evidenceState.choice = i;
        evidenceState.correct = !!choices[i].isEvidence;
        if (evidenceState.correct) {
          agent.handleCheckpoint('EVIDENCE_CHECK', { correct: true, attempts: evidenceState.attempts });
          draw();
        } else {
          renderEvidenceCheck();
        }
      });
    });
  }

  function renderEvidenceBridge() {
    const dim = agent.state.dimensions.evidenceUse;
    const content = dim.hintLevel ? module.scaffoldContent('EVIDENCE_BRIDGE', dim.hintLevel, taskRecord, false, agent.state) : null;
    card(`
      <h2>🔍 Let's look closer</h2>
      <div class="ask-line">How do you know this is evidence?</div>
      ${content ? `<div class="hint-box">${escapeHtml(content.text)}</div>` : ''}
      <div class="input-row"><textarea class="answer-box" id="input">${escapeHtml(dim.response)}</textarea></div>
      <div class="btn-row"><button class="hint-btn" id="hintBtn">💡 I need a hint</button></div>
      <div class="btn-row"><button class="btn btn-primary" id="submitBtn">Submit →</button></div>`);
    container.querySelector('#hintBtn').addEventListener('click', () => { agent.requestHintEarly('EVIDENCE_BRIDGE'); draw(); });
    container.querySelector('#submitBtn').addEventListener('click', () => {
      const text = container.querySelector('#input').value.trim();
      if (!text) return;
      agent.handleCheckpoint('EVIDENCE_BRIDGE', text);
      draw();
    });
  }

  function renderOrganizeCheck() {
    const chips = intake.ideaChips || [];
    const placedIds = Object.keys(rocket.placements);
    const allPlaced = placedIds.length >= chips.length;
    card(`
      <h2>🚀 Build the Rocket</h2>
      ${petSpeech('dog', 'Which part tells the main idea?', '')}
      <p class="lead" style="font-size:15px;">Pick an idea, then tap where it belongs.</p>
      <div class="chip-pool" id="chipPool">
        ${chips.map((c, i) => `<div class="idea-chip ${placedIds.includes(String(i)) ? 'placed' : ''} ${sub.selectedChip === i ? 'selected' : ''}" data-i="${i}">${escapeHtml(c.text)}</div>`).join('')}
      </div>
      <div class="rocket-wrap" id="rocketWrap"></div>
      <div class="zone-caption">Tap a rocket part to drop your idea there.</div>
      <div id="feedback"></div>
      ${allPlaced ? `<div class="sparkle-msg">🚀 Your rocket is ready!</div><div class="btn-row"><button class="btn btn-primary" id="continueBtn">Continue →</button></div>` : ''}`);
    container.querySelector('#rocketWrap').innerHTML = rocketSVGVertical(chips, rocket.placements);
    container.querySelectorAll('#chipPool .idea-chip').forEach(el => {
      el.addEventListener('click', () => {
        const i = Number(el.dataset.i);
        if (placedIds.includes(String(i))) return;
        sub.selectedChip = sub.selectedChip === i ? null : i;
        renderOrganizeCheck();
      });
    });
    container.querySelectorAll('.rocket-zone').forEach(el => {
      el.addEventListener('click', () => {
        const zone = el.dataset.zone;
        const i = sub.selectedChip;
        if (i === null || i === undefined) return;
        const chip = chips[i];
        rocket.attempts[i] = (rocket.attempts[i] || 0) + 1;
        if (chip.role === zone) {
          rocket.placements[i] = zone;
          sub.selectedChip = null;
          container.querySelector('#feedback').innerHTML = '<div class="feedback-line good pop">Great fit! ✨</div>';
        } else {
          container.querySelector('#feedback').innerHTML = petSpeech('dog', "That's okay — building a rocket takes a few tries. Let's find its spot.", '');
        }
        renderOrganizeCheck();
      });
    });
    if (allPlaced) {
      container.querySelector('#continueBtn').addEventListener('click', () => {
        const totalAttempts = Object.values(rocket.attempts).reduce((a, b) => a + b, 0);
        agent.handleCheckpoint('ORGANIZE_CHECK', { totalAttempts, chipCount: chips.length });
        draw();
      });
    }
  }

  function renderOrganizationBridge() {
    const dim = agent.state.dimensions.organization;
    const content = dim.hintLevel ? module.scaffoldContent('ORGANIZATION_BRIDGE', dim.hintLevel, taskRecord, false, agent.state) : null;
    card(`
      <h2>Let's sort your ideas</h2>
      <div class="ask-line">Which idea is the big shared idea, and which are the small details?</div>
      ${content ? `<div class="hint-box">${escapeHtml(content.text)}</div>` : ''}
      <div class="input-row"><textarea class="answer-box" id="input"></textarea></div>
      <div class="btn-row"><button class="hint-btn" id="hintBtn">💡 I need a hint</button></div>
      <div class="btn-row"><button class="btn btn-primary" id="submitBtn">Submit →</button></div>`);
    container.querySelector('#hintBtn').addEventListener('click', () => { agent.requestHintEarly('ORGANIZATION_BRIDGE'); draw(); });
    container.querySelector('#submitBtn').addEventListener('click', () => {
      const text = container.querySelector('#input').value.trim();
      if (!text) return;
      agent.handleCheckpoint('ORGANIZATION_BRIDGE', text);
      draw();
    });
  }

  function renderReturnToTask() {
    card(`
      <h2>Back to the Real Mission</h2>
      ${promptBox()}
      <div class="ask-line">What is this assignment asking you to do?</div>
      <div class="input-row"><textarea class="answer-box" id="input"></textarea></div>
      <div class="btn-row"><button class="btn btn-primary" id="submitBtn" disabled>Submit →</button></div>`);
    wireTextarea('input', 'submitBtn');
    container.querySelector('#submitBtn').addEventListener('click', () => {
      const text = container.querySelector('#input').value.trim();
      if (!text) return;
      agent.handleCheckpoint('RETURN_TO_TASK', text);
      draw();
    });
  }

  function renderNeedsReview() {
    card(`<h2>One moment</h2>${petSpeech('cat', "That response was tricky — your teacher will take a quick look before we continue.", 'cat')}`);
  }

  function renderComplete() {
    card(`
      <h2>Mission Complete</h2>
      <div class="celebrate-wrap pop"><span class="twinkle t1">✦</span><span class="twinkle t2">✦</span><span class="twinkle t3">✦</span>
        <div class="pet-row" style="margin:6px 0 4px;"><div class="pet-wrap">${dogSVG(70)}</div><div class="pet-wrap">${catSVG(70)}</div></div></div>
      ${promptBox()}
      ${petSpeech('dog', 'You did more of the thinking by yourself.', '')}
      <p class="lead" style="font-size:15px;">Your writing mission is ready for you to start.</p>`);
    if (onTaskComplete) onTaskComplete();
  }

  function wireTextarea(taId, btnId) {
    const ta = container.querySelector('#' + taId);
    const btn = container.querySelector('#' + btnId);
    ta.addEventListener('input', () => { btn.disabled = !ta.value.trim(); });
  }
}

function rocketSVGVertical(chips, placements) {
  const zoneChip = {};
  Object.keys(placements).forEach(i => { zoneChip[placements[i]] = chips[i]; });
  const label = zone => zoneChip[zone] ? tspanWrap(zoneChip[zone].text, 150, zone === 'nose' ? 108 : zone === 'tail' ? 398 : null) : '';
  const filled = zone => zoneChip[zone] ? 'filled' : '';
  const fillColor = zone => zoneChip[zone] ? 'url(#zoneFilled)' : 'url(#zoneEmpty)';
  const bodies = [{ y: 150, key: 'body1' }, { y: 230, key: 'body2' }, { y: 310, key: 'body3' }];
  let bodyMarkup = '';
  bodies.forEach(b => {
    bodyMarkup += `<g>
      <rect class="rocket-zone ${filled(b.key)}" data-zone="${b.key}" x="80" y="${b.y}" width="140" height="70" rx="12" fill="${fillColor(b.key)}" stroke="#8a9a8f" stroke-width="1.5"></rect>
      <text x="150" y="${b.y + 40}" text-anchor="middle" font-size="10.5" fill="#3f4a44" pointer-events="none">${zoneChip[b.key] ? tspanWrap(zoneChip[b.key].text, 150, b.y + 30) : 'Middle'}</text>
    </g>`;
  });
  return `<svg viewBox="0 0 300 500" xmlns="http://www.w3.org/2000/svg" style="max-width:280px;">
    <defs>
      <linearGradient id="zoneEmpty" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fbf4e2"/><stop offset="100%" stop-color="#efe2c4"/></linearGradient>
      <linearGradient id="zoneFilled" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e6f3e6"/><stop offset="100%" stop-color="#c9e3c9"/></linearGradient>
      <linearGradient id="flameGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f6d17a"/><stop offset="100%" stop-color="#e3a97e"/></linearGradient>
    </defs>
    <path class="rocket-zone ${filled('nose')}" data-zone="nose" d="M80,140 L220,140 Q150,30 80,140 Z" fill="${fillColor('nose')}" stroke="#8a9a8f" stroke-width="1.5"></path>
    <text x="150" y="118" text-anchor="middle" font-size="10.5" fill="#3f4a44" pointer-events="none">${zoneChip.nose ? tspanWrap(zoneChip.nose.text, 150, 108) : 'Beginning'}</text>
    ${bodyMarkup}
    <polygon points="80,340 65,382 80,375" fill="#c7b8de" opacity=".85" pointer-events="none"/>
    <polygon points="220,340 235,382 220,375" fill="#c7b8de" opacity=".85" pointer-events="none"/>
    <polygon class="rocket-zone ${filled('tail')}" data-zone="tail" points="80,380 220,380 150,430" fill="${fillColor('tail')}" stroke="#8a9a8f" stroke-width="1.5"></polygon>
    <text x="150" y="405" text-anchor="middle" font-size="10.5" fill="#3f4a44" pointer-events="none">${zoneChip.tail ? tspanWrap(zoneChip.tail.text, 150, 398) : 'Ending'}</text>
    <path d="M128,430 Q150,470 172,430 Q150,450 128,430 Z" fill="url(#flameGrad)" opacity="${Object.keys(placements).length > 0 ? 1 : 0.35}" pointer-events="none"/>
  </svg>`;
}
function tspanWrap(text, cx, startY) {
  const words = (text || '').split(' ');
  const lines = []; let cur = '';
  words.forEach(w => { if ((cur + ' ' + w).trim().length > 18) { lines.push(cur.trim()); cur = w; } else cur = (cur + ' ' + w).trim(); });
  if (cur) lines.push(cur);
  return lines.slice(0, 4).map((l, i) => `<tspan x="${cx}" y="${startY + i * 12}">${escapeHtml(l)}</tspan>`).join('');
}
