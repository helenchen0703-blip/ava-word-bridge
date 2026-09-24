// core/growth-session.js — English Growth Agent, session orchestrator
// Parallel to core/bridge-agent.js, but NOT a Module: English Growth has
// exactly one fixed pathway (Cold Read -> Word/Chunk Support -> Sentence
// Meaning -> Gist -> Save to Banks -> Retrieval -> Reread -> Compare), so
// there is no ModuleRegistry/route-graph indirection to build — the pathway
// is hardcoded once, the same way for every text.
//
// Reuses, unchanged: core/student-state.js (freshDimension, BRIDGE_STATUS,
// traceEntry/appendTrace), core/evidence-engine.js (applyEvidence),
// core/decision-engine.js (decideSupportTransition, applyTeacherOverride),
// core/scaffold-engine.js (chooseScaffoldLevel), core/fading-engine.js
// (retestAtZeroScaffold), core/isolation-check.js (runIsolationCheck),
// core/storage.js (saveLearnerState/loadLearnerState, via a new
// experienceId — no changes to storage.js itself).
//
// GUARDRAIL: a flagged word/chunk's SESSION state (attempts, confidence,
// hintLevel, decision) lives only in `state.items[key]` for the duration of
// this session — it is never the source of truth for the Bank. At item
// completion, only specific fields are merged into the persistent Bank
// entry (student-model.js) via recordEncounter/recordSupport/recordRetrieval
// — the session dimension itself is discarded, never used to overwrite the
// Bank entry wholesale.

const GROWTH_EXPERIENCE_ID = 'englishGrowth.v1';

const COLD_READ_MARKINGS = Object.freeze([
  'ACCURATE', 'SLOW', 'MISREAD', 'STUCK', 'SELF_CORRECTED', 'UNKNOWN_MEANING'
]);

function freshGrowthState() {
  return {
    version: 1,
    phase: 'COLD_READ', // COLD_READ -> WORD_CHUNK_SUPPORT -> SENTENCE_MEANING -> GIST -> RETRIEVAL -> REREAD -> DONE
    coldReadEvidence: [],   // [{ type:'word'|'chunk', text, wordIndices, sentenceIndex, sentence, marking, timestamp }]
    items: {},              // itemKey -> { type, text, sentenceIndex, sentence, wordIndices, dim: freshDimension()-shaped, bankStatusBefore }
    itemOrder: [],
    currentItemIndex: 0,
    sentenceMeaning: null,  // { sentence, dim } | null — created only if >=1 item was flagged
    gist: null,             // { dim } — always created
    retrieval: { queue: [], results: [] },
    reread: { before: null, after: null },
    trace: [],
    session: { startedAt: new Date().toISOString() },
    createdAt: new Date().toISOString(),
    updatedAt: null
  };
}

function itemKeyFor(type, text) {
  return type + ':' + text.trim().toLowerCase();
}

function createGrowthSession({ textRecord }) {
  const textId = textRecord.textId;
  const tokens = tokenizeWithSentences(textRecord.authenticText);

  const session = {
    state: null,

    init() {
      this.state = loadLearnerState(GROWTH_EXPERIENCE_ID, textId) || freshGrowthState();
      return this.state;
    },

    save() {
      this.state.updatedAt = new Date().toISOString();
      saveLearnerState(this.state, GROWTH_EXPERIENCE_ID, textId);
    },

    // ---------- Cold Read (must stay truly cold — no meaning/hint content touched here) ----------
    // wordIndices: a single index for a word marking, or a contiguous array for a chunk span.
    recordColdReadMarking({ wordIndices, marking }) {
      const indices = Array.isArray(wordIndices) ? wordIndices : [wordIndices];
      const words = indices.map(i => tokens[i]).filter(Boolean);
      if (!words.length) return null;
      const text = words.map(w => w.word).join(' ');
      const isChunk = indices.length > 1;
      const first = words[0];

      this.state.coldReadEvidence.push({
        type: isChunk ? 'chunk' : 'word', text, wordIndices: indices,
        sentenceIndex: first.sentenceIndex, sentence: first.sentence,
        marking, timestamp: new Date().toISOString()
      });

      appendTrace(this.state, {
        checkpointId: 'COLD_READ', dimensionKey: null, responseSummary: `"${text}" marked ${marking}`,
        statusBefore: null, statusAfter: null, evidenceNote: `Cold Read marking recorded for "${text}".`,
        decision: null, ruleId: 'ruleColdReadMarkingRecorded', reason: 'Baseline evidence, no support shown yet.'
      });

      // Classification happens immediately, per the design's "honest, non-conflating" rule —
      // but no CONTENT (meaning, hint) is ever shown here, only classification.
      if (marking === 'ACCURATE' || marking === 'SELF_CORRECTED') {
        // no roadblock — not banked, not scaffolded
      } else if (marking === 'SLOW' || marking === 'MISREAD' || marking === 'STUCK') {
        // Fluency evidence only — V1 does not run an interactive Decode Coach (deferred).
        const model = loadStudentModel();
        recordFluencyAttempt(model, first.word, marking !== 'MISREAD' && marking !== 'STUCK', { textId, marking });
        saveStudentModel(model);
      } else if (marking === 'UNKNOWN_MEANING' || isChunk) {
        const key = itemKeyFor(isChunk ? 'chunk' : 'word', text);
        if (!this.state.items[key]) {
          const model = loadStudentModel();
          const existingBankEntry = isChunk
            ? model.chunkBank.find(c => c.chunk.toLowerCase() === text.toLowerCase())
            : model.wordBank.find(w => w.word.toLowerCase() === text.toLowerCase());
          // Seed from the Bank if this item has been seen before: assume a
          // LITTLE retention since last time (one tier down), never full
          // independence without new evidence this session.
          const seededHintLevel = existingBankEntry
            ? Math.max(0, (lastHintLevelOf(existingBankEntry) || 0) - 1)
            : 0;
          const dim = Object.assign(freshDimension(), {
            category: isChunk ? ROADBLOCK_CATEGORY.LANGUAGE : ROADBLOCK_CATEGORY.LANGUAGE,
            hintLevel: seededHintLevel
          });
          // "Test retrieval first, never auto-reteach": an item is a transfer
          // candidate only if the Bank already has it from a DIFFERENT text —
          // its first support prompt will be a bare recall check, not the
          // meaning (see growth/growth-pathway.js's buildItemSupportContent).
          const isReturning = !!(existingBankEntry && existingBankEntry.sourceTextIds &&
            existingBankEntry.sourceTextIds.length > 0 && !existingBankEntry.sourceTextIds.includes(textId));
          this.state.items[key] = {
            type: isChunk ? 'chunk' : 'word', text,
            sentenceIndex: first.sentenceIndex, sentence: first.sentence, wordIndices: indices,
            dim, bankStatusBefore: existingBankEntry ? existingBankEntry.currentLearningStatus : 'NEW',
            isReturning
          };
          this.state.itemOrder.push(key);
        }
      }
      this.save();
      return this.state.coldReadEvidence[this.state.coldReadEvidence.length - 1];
    },

    finishColdRead() {
      this.state.phase = this.state.itemOrder.length > 0 ? 'WORD_CHUNK_SUPPORT' : 'GIST';
      this.state.currentItemIndex = 0;
      this.save();
    },

    // ---------- Word/Chunk Support cycle (lightweight — see growth/growth-pathway.js) ----------
    currentItem() {
      const key = this.state.itemOrder[this.state.currentItemIndex];
      return key ? this.state.items[key] : null;
    },

    // Returns { prompt, meaningShown, content } for the CURRENT item, honoring
    // the "minimal meaning support" rule — content is shown up front (this is
    // not Cold Read any more), not discovered only through failure.
    getSupportContent() {
      const item = this.currentItem();
      if (!item) return null;
      return buildItemSupportContent(item, textRecord, this.state);
    },

    submitItemResponse(responseText) {
      const item = this.currentItem();
      if (!item) return null;
      return handleItemResponse(this, item, responseText, textRecord);
    },

    submitItemIsolationResponse(responseText) {
      const item = this.currentItem();
      if (!item) return null;
      return handleItemIsolationResponse(this, item, responseText, textRecord);
    },

    advanceToNextItem() {
      this.state.currentItemIndex += 1;
      if (this.state.currentItemIndex >= this.state.itemOrder.length) {
        // Pick the sentence belonging to the item that needed the most support
        // for the Sentence Meaning check — skip entirely if nothing was hard.
        const hardestKey = this.state.itemOrder.slice().sort(
          (a, b) => this.state.items[b].dim.hintLevel - this.state.items[a].dim.hintLevel
        )[0];
        const hardest = hardestKey ? this.state.items[hardestKey] : null;
        if (hardest) {
          this.state.sentenceMeaning = { sentence: hardest.sentence, dim: freshDimension() };
          this.state.phase = 'SENTENCE_MEANING';
        } else {
          this.state.phase = 'GIST';
        }
      }
      this.save();
    },

    // ---------- Sentence Meaning ----------
    submitSentenceMeaningResponse(responseText) {
      return handleSentenceMeaningResponse(this, responseText, textRecord);
    },
    submitSentenceMeaningIsolationResponse(responseText) {
      return handleSentenceIsolationResponse(this, responseText);
    },

    // ---------- Gist ----------
    submitGistResponse(responseText) {
      if (!this.state.gist) this.state.gist = { dim: freshDimension() };
      return handleGistResponse(this, responseText, textRecord);
    },
    submitGistIsolationResponse(responseText) {
      return handleGistIsolationResponse(this, responseText, textRecord);
    },

    // ---------- Save to Banks (runs once, when leaving GIST) ----------
    commitToBanks() {
      const model = loadStudentModel();
      this.state.itemOrder.forEach(key => {
        const item = this.state.items[key];
        const isChunk = item.type === 'chunk';
        const meaningEntry = isChunk ? findChunkMeaning(textRecord, item.text) : findWordMeaning(textRecord, item.text);
        const upsertArgs = isChunk
          ? { chunk: item.text, textId, meaning: meaningEntry && meaningEntry.meaning, functionOrUse: meaningEntry && meaningEntry.functionOrUse, status: dimToLearningStatus(item.dim) }
          : { word: item.text, textId, meaning: meaningEntry && meaningEntry.meaning, chineseScaffold: meaningEntry && meaningEntry.chineseScaffold, partOfSpeech: meaningEntry && meaningEntry.partOfSpeech, morphologyNote: meaningEntry && meaningEntry.morphologyNote, pronunciationNote: meaningEntry && meaningEntry.pronunciationNote, status: dimToLearningStatus(item.dim) };
        const bankEntry = isChunk ? upsertChunkBank(model, upsertArgs) : upsertWordBank(model, upsertArgs);
        recordEncounter(bankEntry, { textId, sentence: item.sentence, wordIndex: item.wordIndices[0], marking: 'UNKNOWN_MEANING' });
        recordSupport(bankEntry, { textId, hintLevel: item.dim.hintLevel });
        recordRetrieval(bankEntry, { textId, itemType: 'MEANING', succeeded: item.dim.status !== BRIDGE_STATUS.NEEDS_SUPPORT && item.dim.status !== BRIDGE_STATUS.NEEDS_EVIDENCE, supportLevelAtTime: item.dim.hintLevel });
        item.bankKey = isChunk ? bankEntry.chunk : bankEntry.word;
      });
      saveStudentModel(model);
      this.state.phase = 'RETRIEVAL';
      this.buildRetrievalQueue();
      this.save();
    },

    // ---------- Retrieval Practice ----------
    buildRetrievalQueue() {
      this.state.retrieval.queue = this.state.itemOrder.map(key => {
        const item = this.state.items[key];
        return { key, type: item.type, text: item.text };
      }).slice(0, 3); // short, per guardrail — not a full deck
    },
    submitRetrievalResponse(key, responseText) {
      return handleRetrievalResponse(this, key, responseText, textRecord);
    },
    finishRetrieval() {
      this.state.phase = 'REREAD';
      this.state.reread.before = summarizeBefore(this.state);
      this.save();
    },

    // ---------- Reread original text (zero scaffold) ----------
    submitRereadGistResponse(responseText) {
      return handleRereadGist(this, responseText, textRecord);
    },
    submitRereadItemResponse(key, responseText) {
      return handleRereadItem(this, key, responseText, textRecord);
    },
    finishSession() {
      this.state.reread.after = summarizeAfter(this.state);
      this.state.phase = 'DONE';
      this.save();
    },

    // ---------- Teacher-in-the-loop, reused pattern ----------
    applyItemOverride(key, decision, note, teacherName) {
      const item = this.state.items[key];
      if (!item) return null;
      applyTeacherOverride(item.dim, decision, note, teacherName);
      appendTrace(this.state, {
        checkpointId: 'TEACHER_OVERRIDE', dimensionKey: key, responseSummary: note || '',
        statusBefore: item.dim.status, statusAfter: item.dim.status,
        evidenceNote: `Teacher recorded: ${decision}${note ? ' — ' + note : ''}`, decision,
        ruleId: 'ruleTeacherOverrideRecorded', reason: 'Teacher resolved a content-gap or needs-review item.'
      });
      this.save();
    }
  };

  return session;
}

function lastHintLevelOf(bankEntry) {
  if (!bankEntry.supportHistory || !bankEntry.supportHistory.length) return 0;
  return bankEntry.supportHistory[bankEntry.supportHistory.length - 1].hintLevel || 0;
}

function dimToLearningStatus(dim) {
  if (dim.status === BRIDGE_STATUS.INDEPENDENT) return 'INDEPENDENT';
  if (dim.status === BRIDGE_STATUS.EMERGING) return dim.hintLevel > 0 ? 'ALMOST_MINE' : 'LEARNING';
  if (dim.status === BRIDGE_STATUS.NEEDS_SUPPORT) return 'LEARNING';
  return 'NEW';
}

function summarizeBefore(state) {
  const items = state.itemOrder.map(k => state.items[k]);
  return {
    itemsFlagged: items.length,
    avgHintLevel: items.length ? items.reduce((a, i) => a + i.dim.hintLevel, 0) / items.length : 0,
    gistStatus: state.gist ? state.gist.dim.status : null
  };
}
function summarizeAfter(state) {
  const items = state.itemOrder.map(k => state.items[k]);
  const resolved = items.filter(i => i.rereadSucceeded);
  return {
    itemsFlagged: items.length,
    itemsResolved: resolved.length,
    avgHintLevel: 0, // reread is always at zero scaffold by construction
    gistStatus: state.reread.gistDim ? state.reread.gistDim.status : null
  };
}
