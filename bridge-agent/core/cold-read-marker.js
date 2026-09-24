// core/cold-read-marker.js — English Growth Agent, Cold Read marking surface
// The one genuinely new UI interaction in this whole feature: renders the
// authentic text as tappable word tokens so a teacher can mark evidence
// WHILE the learner reads aloud. GUARDRAIL: Cold Read must remain truly cold — this
// component never shows a meaning, a hint, a translation, or a highlight
// keyed to difficulty. It only classifies and records what already happened.

const COLD_READ_MARKING_LABELS = Object.freeze({
  ACCURATE: 'Accurate', SLOW: 'Slow', MISREAD: 'Misread', STUCK: 'Stuck',
  SELF_CORRECTED: 'Self-corrected', UNKNOWN_MEANING: "Can read, doesn't know meaning"
});

function renderColdReadMarker(container, { textRecord, session, onMarked, onDone }) {
  const tokens = tokenizeWithSentences(textRecord.authenticText);
  let selected = []; // contiguous word indices

  draw();

  function draw() {
    container.innerHTML = '';

    const box = document.createElement('div');
    box.className = 'bridge-authentic-task';
    const label = document.createElement('div');
    label.className = 'bridge-authentic-label';
    label.textContent = 'Cold Read — tap a word as she reads';
    box.appendChild(label);

    const textEl = document.createElement('div');
    textEl.className = 'growth-cold-read-text';
    tokens.forEach(tok => {
      const span = document.createElement('span');
      span.className = 'growth-token' + (markingClassFor(tok.wordIndex) || '') + (selected.includes(tok.wordIndex) ? ' growth-token-selected' : '');
      span.textContent = tok.word;
      span.dataset.index = tok.wordIndex;
      span.addEventListener('click', () => toggleSelect(tok.wordIndex));
      textEl.appendChild(span);
      textEl.appendChild(document.createTextNode(' '));
    });
    box.appendChild(textEl);
    container.appendChild(box);

    const toolbar = document.createElement('div');
    toolbar.className = 'growth-marking-toolbar';
    if (selected.length === 1) {
      Object.keys(COLD_READ_MARKING_LABELS).forEach(marking => {
        const btn = document.createElement('button');
        btn.className = 'bridge-btn-outline';
        btn.textContent = COLD_READ_MARKING_LABELS[marking];
        btn.addEventListener('click', () => commitMark(marking));
        toolbar.appendChild(btn);
      });
    } else if (selected.length > 1) {
      const btn = document.createElement('button');
      btn.className = 'bridge-btn-outline';
      btn.textContent = `Mark "${selected.map(i => tokens[i].word).join(' ')}" as an unknown chunk`;
      btn.addEventListener('click', () => commitMark('UNKNOWN_MEANING'));
      toolbar.appendChild(btn);
      const clear = document.createElement('button');
      clear.className = 'bridge-btn-ghost';
      clear.textContent = 'Clear selection';
      clear.addEventListener('click', () => { selected = []; draw(); });
      toolbar.appendChild(clear);
    } else {
      const hint = document.createElement('div');
      hint.className = 'bridge-empty-note';
      hint.textContent = 'Tap one word to mark it, or tap a contiguous run of words to mark a chunk/phrase.';
      toolbar.appendChild(hint);
    }
    container.appendChild(toolbar);

    const doneBtn = document.createElement('button');
    doneBtn.className = 'btn btn-primary';
    doneBtn.textContent = 'Done reading — continue →';
    doneBtn.style.marginTop = '18px';
    doneBtn.addEventListener('click', () => onDone());
    container.appendChild(doneBtn);
  }

  function markingClassFor(wordIndex) {
    const evidence = session.state.coldReadEvidence.filter(e => e.wordIndices.includes(wordIndex));
    if (!evidence.length) return '';
    const last = evidence[evidence.length - 1];
    return ' growth-marked-' + last.marking.toLowerCase().replace(/_/g, '-');
  }

  function toggleSelect(index) {
    if (selected.includes(index)) {
      selected = selected.filter(i => i !== index);
    } else if (selected.length === 0) {
      selected = [index];
    } else {
      const withNew = [...selected, index].sort((a, b) => a - b);
      const isContiguous = withNew.every((v, i) => i === 0 || v === withNew[i - 1] + 1);
      selected = isContiguous ? withNew : [index];
    }
    draw();
  }

  function commitMark(marking) {
    const wordIndices = selected.length === 1 ? selected[0] : selected;
    session.recordColdReadMarking({ wordIndices, marking });
    selected = [];
    if (onMarked) onMarked();
    draw();
  }
}
