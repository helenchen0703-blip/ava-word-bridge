// growth/growth-pathway.js — English Growth Agent, the fixed pathway content
// There is exactly ONE pathway (not five subjects), so this file plays the
// role a Module's evaluators/scaffoldContent play in BRIDGE, but is not
// registered anywhere — core/growth-session.js calls straight into it.
//
// GUARDRAIL — keep vocabulary interactions lightweight: the normal case
// (can read -> doesn't know meaning -> minimal meaning support -> immediate
// retrieval -> save evidence) resolves in ONE round trip through
// core/decision-engine.js. Isolation checks only fire when a response is
// genuinely ambiguous (confidence LOW) — never as a matter of course.

// ================= Word/Chunk Support =================

// Shown up front (this is not Cold Read any more) — minimal meaning support,
// never a multi-step "guess from context" ladder for the ordinary case.
function buildItemSupportContent(item, textRecord) {
  // Transfer check: an item seen before in a DIFFERENT text gets a bare
  // recall prompt first — no meaning, no hint. Only if she can't retrieve it
  // does the normal meaning-revealing ladder below ever show.
  if (item.isReturning && item.dim.attempts === 0) {
    return { prompt: `Do you remember what "${item.text}" means? You've seen it before.`, meaningShown: false, isRecallTest: true };
  }
  const meaningEntry = item.type === 'chunk' ? findChunkMeaning(textRecord, item.text) : findWordMeaning(textRecord, item.text);
  if (!meaningEntry) {
    return { prompt: `Let's come back to "${item.text}" — I don't have a meaning saved for it yet.`, meaningShown: false, needsContent: true };
  }
  const sentenceLine = `In the text: "${item.sentence}"`;
  const CONTENT_BY_LEVEL = [
    '', // level 0 unused — support is always shown starting at level 1
    `"${item.text}" means: ${meaningEntry.meaning}. ${sentenceLine}\nCan you use it in your own sentence, or tell me what it means in your own words?`,
    `Here's another example: "${item.text}" — ${meaningEntry.meaning}.\nTry telling me what it means, in your own words.`,
    `${item.type === 'chunk' && meaningEntry.functionOrUse ? `This phrase is used to: ${meaningEntry.functionOrUse}. ` : ''}Try finishing this: "${item.text} means ___."`,
    meaningEntry.chineseScaffold ? `中文提示: ${meaningEntry.chineseScaffold}` : `One more time — "${item.text}" means ${meaningEntry.meaning}. Can you say that back to me?`
  ];
  const effectiveLevel = Math.max(1, Math.min(item.dim.hintLevel || 1, CONTENT_BY_LEVEL.length - 1));
  return { prompt: CONTENT_BY_LEVEL[effectiveLevel], meaningShown: true, needsContent: false, level: effectiveLevel };
}

function evaluateItemResponse(item, responseText, textRecord) {
  const text = (responseText || '').trim();
  const meaningEntry = item.type === 'chunk' ? findChunkMeaning(textRecord, item.text) : findWordMeaning(textRecord, item.text);

  // Transfer recall check (item.isReturning, first attempt, no meaning shown yet):
  // a substantial unaided response is transfer evidence and resolves the item
  // immediately; a miss is NOT a failure — it just proceeds to normal support
  // with the meaning now shown, same as any brand-new item from here on.
  if (item.isReturning && item.dim.attempts === 0) {
    const recalled = text.length > 3 && !/^(idk|i ?dont ?know|i don'?t know|\?+)$/i.test(text);
    if (recalled) {
      return { succeeded: true, statusAfter: BRIDGE_STATUS.INDEPENDENT, confidence: 'HIGH', responseSummary: text,
        isTransferSuccess: true, ruleId: 'ruleTransferRecallSucceeded', evidenceNote: 'Recalled unaided from a previous text — transfer evidence, no reteaching needed.' };
    }
    return { succeeded: false, statusAfter: BRIDGE_STATUS.NEEDS_SUPPORT, confidence: 'HIGH', responseSummary: text,
      ruleId: 'ruleTransferRecallMissed', evidenceNote: 'Could not recall unaided — showing the meaning again, not treated as a new failure.' };
  }

  if (!meaningEntry) {
    return { succeeded: false, statusAfter: BRIDGE_STATUS.NEEDS_EVIDENCE, confidence: 'HIGH', responseSummary: text,
      needsTeacherReview: true, ruleId: 'ruleNoContentPrepared',
      evidenceNote: 'No teacher-prepared meaning for this item — flagged for content review, nothing fabricated.' };
  }
  if (!text) {
    return { succeeded: false, statusAfter: BRIDGE_STATUS.NEEDS_EVIDENCE, confidence: 'LOW', responseSummary: text,
      ruleId: 'ruleItemNoResponse', evidenceNote: 'No response yet.' };
  }
  if (text.length < 3 || /^(idk|i ?dont ?know|i don'?t know|\?+)$/i.test(text)) {
    return { succeeded: false, statusAfter: BRIDGE_STATUS.NEEDS_SUPPORT, confidence: 'LOW', responseSummary: text,
      ruleId: 'ruleItemAmbiguous', evidenceNote: 'Response is too thin to tell whether she understands — checking further.' };
  }
  return { succeeded: true, statusAfter: BRIDGE_STATUS.EMERGING, confidence: 'HIGH', responseSummary: text,
    ruleId: 'ruleItemAttempted', evidenceNote: 'Genuine attempt recorded after minimal meaning support.' };
}

function itemIsolationMatcher(responseText) {
  const text = (responseText || '').trim();
  const nonTrivial = text.length > 5;
  return { matchesA: nonTrivial, matchesB: !nonTrivial, confidence: text.length > 15 ? 'HIGH' : (text.length > 0 ? 'MEDIUM' : 'LOW') };
}

// Shared "react to a Decision Engine outcome" shape, reused across item /
// sentence / gist checkpoints so the branching logic (CONTINUE vs resolved
// vs RUN_ONE_MORE_CHECK) isn't rewritten three times.
function actOnItemDecision(session, item, evalResult, decision, textRecord) {
  if (decision.decision === 'RUN_ONE_MORE_CHECK') {
    appendTrace(session.state, { checkpointId: 'ROUTE', dimensionKey: item.text, responseSummary: '',
      statusBefore: item.dim.status, statusAfter: item.dim.status,
      evidenceNote: 'Confidence low — running a quick isolation check.', decision: 'RUN_ONE_MORE_CHECK',
      ruleId: decision.ruleId, reason: decision.reason });
    session.save();
    return { decision: 'RUN_ONE_MORE_CHECK', isolationPrompt: { question: `Tell me a bit more about "${item.text}" — anything you know, even a guess.` } };
  }
  if (decision.decision === 'CONTINUE_SUPPORT') {
    const scaffoldLevel = chooseScaffoldLevel(item.dim, LADDER_LENGTH);
    item.dim.hintLevel = Math.max(item.dim.hintLevel, scaffoldLevel.level);
    appendTrace(session.state, { checkpointId: 'ITEM_SUPPORT', dimensionKey: item.text, responseSummary: '',
      statusBefore: item.dim.status, statusAfter: item.dim.status, evidenceNote: decision.reason,
      decision: decision.decision, ruleId: scaffoldLevel.ruleId, reason: decision.reason });
    session.save();
    return { decision: 'CONTINUE_SUPPORT', content: buildItemSupportContent(item, textRecord) };
  }
  // REDUCE_SUPPORT / REMOVE_SUPPORT / RETURN_TO_AUTHENTIC_TASK -> item resolved, move on
  appendTrace(session.state, { checkpointId: 'ROUTE', dimensionKey: item.text, responseSummary: '',
    statusBefore: item.dim.status, statusAfter: item.dim.status, evidenceNote: `Item resolved: ${decision.decision}.`,
    decision: decision.decision, ruleId: decision.ruleId, reason: decision.reason });
  session.advanceToNextItem();
  return { decision: decision.decision, itemDone: true };
}

function handleItemResponse(session, item, responseText, textRecord) {
  const statusBefore = item.dim.status;
  const evalResult = evaluateItemResponse(item, responseText, textRecord);
  applyEvidence(item.dim, { statusAfter: evalResult.statusAfter, confidence: evalResult.confidence, responseSummary: evalResult.responseSummary, succeeded: evalResult.succeeded });

  appendTrace(session.state, { checkpointId: 'ITEM_SUPPORT', dimensionKey: item.text,
    responseSummary: evalResult.responseSummary, statusBefore, statusAfter: item.dim.status,
    evidenceNote: evalResult.evidenceNote, decision: null, ruleId: evalResult.ruleId, reason: evalResult.evidenceNote });

  if (evalResult.needsTeacherReview) {
    item.dim.needsTeacherReview = true;
    session.save();
    return { decision: 'NEEDS_TEACHER_REVIEW', needsContent: true };
  }
  if (evalResult.isTransferSuccess) {
    const model = loadStudentModel();
    const bankEntry = item.type === 'chunk'
      ? model.chunkBank.find(c => c.chunk.toLowerCase() === item.text.toLowerCase())
      : model.wordBank.find(w => w.word.toLowerCase() === item.text.toLowerCase());
    recordTransfer(bankEntry, { textId: textRecord.textId, succeededUnaided: true });
    saveStudentModel(model);
  }
  const decision = decideSupportTransition({ dim: item.dim, evalResult: { succeeded: evalResult.succeeded, confidence: item.dim.confidence }, ladderLength: LADDER_LENGTH });
  return actOnItemDecision(session, item, evalResult, decision, textRecord);
}

function handleItemIsolationResponse(session, item, responseText, textRecord) {
  const statusBefore = item.dim.status;
  const result = runIsolationCheck({
    hypothesisA: 'EXPRESSION (understands, struggles to say it)',
    hypothesisB: 'CONCEPT (meaning not yet grasped)',
    discriminatingQuestion: `Tell me a bit more about "${item.text}".`,
    studentResponse: responseText, matcher: itemIsolationMatcher, dimA: item.dim, dimB: null
  });
  appendTrace(session.state, { checkpointId: 'ISOLATION_CHECK', dimensionKey: item.text,
    responseSummary: (responseText || '').slice(0, 140), statusBefore, statusAfter: item.dim.status,
    evidenceNote: result.evidenceNote, decision: null, ruleId: result.ruleId, reason: result.evidenceNote });

  if (!result.resolvedTo) {
    item.dim.needsTeacherReview = true;
    session.save();
    return { decision: 'NEEDS_TEACHER_REVIEW' };
  }
  const succeeded = result.resolvedTo === 'A';
  item.dim.status = succeeded ? BRIDGE_STATUS.EMERGING : BRIDGE_STATUS.NEEDS_SUPPORT;
  const decision = decideSupportTransition({ dim: item.dim, evalResult: { succeeded, confidence: 'HIGH' }, ladderLength: LADDER_LENGTH });
  return actOnItemDecision(session, item, { succeeded }, decision, textRecord);
}

// ================= Sentence Meaning (only run when >=1 item was flagged) =================

function sentenceIsolationMatcher(responseText) {
  const text = (responseText || '').trim();
  const nonTrivial = text.length > 8;
  return { matchesA: nonTrivial, matchesB: !nonTrivial, confidence: text.length > 20 ? 'HIGH' : (text.length > 0 ? 'MEDIUM' : 'LOW') };
}

function handleSentenceMeaningResponse(session, responseText, textRecord) {
  const sm = session.state.sentenceMeaning;
  const text = (responseText || '').trim();
  const statusBefore = sm.dim.status;
  const substantial = text.length > 8;
  const evalResult = !text
    ? { succeeded: false, statusAfter: BRIDGE_STATUS.NEEDS_EVIDENCE, confidence: 'LOW', ruleId: 'ruleSentenceNoResponse', evidenceNote: 'No response yet.' }
    : !substantial
      ? { succeeded: false, statusAfter: BRIDGE_STATUS.NEEDS_SUPPORT, confidence: 'LOW', ruleId: 'ruleSentenceAmbiguous', evidenceNote: 'Response too short to tell whether she understands the sentence.' }
      : { succeeded: true, statusAfter: BRIDGE_STATUS.EMERGING, confidence: 'HIGH', ruleId: 'ruleSentenceAttempted', evidenceNote: 'Genuine attempt at the sentence recorded.' };

  applyEvidence(sm.dim, { statusAfter: evalResult.statusAfter, confidence: evalResult.confidence, responseSummary: text, succeeded: evalResult.succeeded });
  appendTrace(session.state, { checkpointId: 'SENTENCE_MEANING', dimensionKey: 'sentenceMeaning',
    responseSummary: text, statusBefore, statusAfter: sm.dim.status, evidenceNote: evalResult.evidenceNote,
    decision: null, ruleId: evalResult.ruleId, reason: evalResult.evidenceNote });

  const decision = decideSupportTransition({ dim: sm.dim, evalResult: { succeeded: evalResult.succeeded, confidence: sm.dim.confidence }, ladderLength: LADDER_LENGTH });

  if (decision.decision === 'RUN_ONE_MORE_CHECK') {
    session.save();
    return { decision: 'RUN_ONE_MORE_CHECK', isolationPrompt: { question: 'Tell me in your own words, any language, what this sentence is saying.' } };
  }
  if (decision.decision === 'CONTINUE_SUPPORT') {
    const scaffoldLevel = chooseScaffoldLevel(sm.dim, LADDER_LENGTH);
    sm.dim.hintLevel = Math.max(sm.dim.hintLevel, scaffoldLevel.level);
    session.save();
    const PROMPTS = ['', 'Who or what is this sentence about? What are they doing?', 'Break it into parts: who/what, then what they do, then any extra detail.', `Try finishing: "This sentence means ___."`, 'One more try — take your time.'];
    return { decision: 'CONTINUE_SUPPORT', prompt: PROMPTS[Math.min(scaffoldLevel.level, PROMPTS.length - 1)] };
  }
  session.state.phase = 'GIST';
  session.save();
  return { decision: decision.decision, done: true };
}

function handleSentenceIsolationResponse(session, responseText) {
  const sm = session.state.sentenceMeaning;
  const statusBefore = sm.dim.status;
  const result = runIsolationCheck({
    hypothesisA: 'EXPRESSION (understands, struggles to say it in English)',
    hypothesisB: 'CONCEPT (sentence meaning not yet grasped)',
    discriminatingQuestion: 'Tell me in your own words, any language, what this sentence is saying.',
    studentResponse: responseText, matcher: sentenceIsolationMatcher, dimA: sm.dim, dimB: null
  });
  appendTrace(session.state, { checkpointId: 'ISOLATION_CHECK', dimensionKey: 'sentenceMeaning',
    responseSummary: (responseText || '').slice(0, 140), statusBefore, statusAfter: sm.dim.status,
    evidenceNote: result.evidenceNote, decision: null, ruleId: result.ruleId, reason: result.evidenceNote });

  if (!result.resolvedTo) {
    sm.dim.needsTeacherReview = true;
    session.save();
    return { decision: 'NEEDS_TEACHER_REVIEW' };
  }
  const succeeded = result.resolvedTo === 'A';
  sm.dim.status = succeeded ? BRIDGE_STATUS.EMERGING : BRIDGE_STATUS.NEEDS_SUPPORT;
  session.state.phase = 'GIST';
  session.save();
  return { decision: succeeded ? 'REDUCE_SUPPORT' : 'RETURN_TO_AUTHENTIC_TASK', done: true, resolvedTo: result.resolvedTo };
}

// ================= Gist =================
// Same keyword-overlap heuristic already proven in modules/reading.js's
// evalGist — disclosed as approximate, never claimed as true comprehension NLP.

function significantWordsGrowth(sentence) {
  return (sentence || '').toLowerCase().split(/\W+/).filter(w => w.length > 3);
}

function evalGistGrowth(responseText, textRecord) {
  const text = (responseText || '').trim();
  const expected = significantWordsGrowth(textRecord.mainIdeaSentence);
  const responseWords = new Set(significantWordsGrowth(text));
  const overlap = expected.length ? expected.filter(w => responseWords.has(w)).length / expected.length : 0;
  const substantial = text.length > 15;

  if (!substantial) {
    return { succeeded: false, statusAfter: BRIDGE_STATUS.UNKNOWN, confidence: 'LOW', ruleId: 'ruleGistTooShort', evidenceNote: 'Response too short to evaluate.' };
  }
  if (overlap >= 0.5) {
    return { succeeded: true, statusAfter: BRIDGE_STATUS.INDEPENDENT, confidence: 'HIGH', ruleId: 'ruleGistIndependent', evidenceNote: 'Main idea covered unaided.' };
  }
  if (overlap >= 0.2) {
    return { succeeded: false, statusAfter: BRIDGE_STATUS.NEEDS_SUPPORT, confidence: 'MEDIUM', ruleId: 'ruleGistPartial', evidenceNote: 'Partial gist comprehension.' };
  }
  return { succeeded: false, statusAfter: BRIDGE_STATUS.NEEDS_EVIDENCE, confidence: 'LOW', ruleId: 'ruleGistNoOverlap', evidenceNote: 'Ambiguous — checking whether this is language or concept.' };
}

function gistIsolationMatcherGrowth(responseText) {
  const text = (responseText || '').trim();
  const nonTrivial = text.length > 8;
  return { matchesA: nonTrivial, matchesB: !nonTrivial, confidence: text.length > 20 ? 'HIGH' : (text.length > 0 ? 'MEDIUM' : 'LOW') };
}

function handleGistResponse(session, responseText, textRecord) {
  if (!session.state.gist) session.state.gist = { dim: freshDimension() };
  const dim = session.state.gist.dim;
  const statusBefore = dim.status;
  const evalResult = evalGistGrowth(responseText, textRecord);
  applyEvidence(dim, { statusAfter: evalResult.statusAfter, confidence: evalResult.confidence, responseSummary: (responseText || '').trim(), succeeded: evalResult.succeeded });
  appendTrace(session.state, { checkpointId: 'GIST', dimensionKey: 'gist', responseSummary: (responseText || '').trim(),
    statusBefore, statusAfter: dim.status, evidenceNote: evalResult.evidenceNote, decision: null, ruleId: evalResult.ruleId, reason: evalResult.evidenceNote });

  const decision = decideSupportTransition({ dim, evalResult: { succeeded: evalResult.succeeded, confidence: dim.confidence }, ladderLength: LADDER_LENGTH });
  if (decision.decision === 'RUN_ONE_MORE_CHECK') {
    session.save();
    return { decision: 'RUN_ONE_MORE_CHECK', isolationPrompt: { question: 'Tell me in your own words, any language, what this text is about.' } };
  }
  if (decision.decision === 'CONTINUE_SUPPORT') {
    const scaffoldLevel = chooseScaffoldLevel(dim, LADDER_LENGTH);
    dim.hintLevel = Math.max(dim.hintLevel, scaffoldLevel.level);
    session.save();
    const PROMPTS = ['', 'What happened first? What happened next?', `Look for these words: ${(textRecord.taggedWords || []).map(w => w.word).join(', ')}.`, 'Try starting with: "This text is about ___."', 'One more try, take your time.'];
    return { decision: 'CONTINUE_SUPPORT', prompt: PROMPTS[Math.min(scaffoldLevel.level, PROMPTS.length - 1)] };
  }
  session.commitToBanks();
  return { decision: decision.decision, done: true };
}

function handleGistIsolationResponse(session, responseText, textRecord) {
  const dim = session.state.gist.dim;
  const statusBefore = dim.status;
  const result = runIsolationCheck({
    hypothesisA: 'EXPRESSION (gist understood, can\'t express it in English)',
    hypothesisB: 'CONCEPT/RETENTION (gist not grasped)',
    discriminatingQuestion: 'Tell me in your own words, any language, what this text is about.',
    studentResponse: responseText, matcher: gistIsolationMatcherGrowth, dimA: dim, dimB: null
  });
  appendTrace(session.state, { checkpointId: 'ISOLATION_CHECK', dimensionKey: 'gist',
    responseSummary: (responseText || '').slice(0, 140), statusBefore, statusAfter: dim.status,
    evidenceNote: result.evidenceNote, decision: null, ruleId: result.ruleId, reason: result.evidenceNote });

  if (!result.resolvedTo) {
    dim.needsTeacherReview = true;
    session.save();
    return { decision: 'NEEDS_TEACHER_REVIEW' };
  }
  dim.status = result.resolvedTo === 'A' ? BRIDGE_STATUS.EMERGING : BRIDGE_STATUS.NEEDS_SUPPORT;
  session.commitToBanks();
  return { decision: 'RESOLVED', resolvedTo: result.resolvedTo, done: true };
}

// ================= Retrieval Practice =================

function handleRetrievalResponse(session, key, responseText, textRecord) {
  const item = session.state.items[key];
  const text = (responseText || '').trim();
  const succeeded = text.length > 3; // lightweight, per guardrail — not deep semantic scoring
  session.state.retrieval.results.push({ key, text: item.text, succeeded, responseSummary: text });

  const model = loadStudentModel();
  const bankEntry = item.type === 'chunk'
    ? model.chunkBank.find(c => c.chunk.toLowerCase() === item.text.toLowerCase())
    : model.wordBank.find(w => w.word.toLowerCase() === item.text.toLowerCase());
  recordRetrieval(bankEntry, { textId: textRecord.textId, itemType: 'USE_IN_SENTENCE', succeeded, supportLevelAtTime: 0 });
  saveStudentModel(model);

  appendTrace(session.state, { checkpointId: 'RETRIEVAL', dimensionKey: item.text, responseSummary: text,
    statusBefore: null, statusAfter: null, evidenceNote: succeeded ? 'Retrieved without re-teaching.' : 'Retrieval attempt recorded.',
    decision: null, ruleId: succeeded ? 'ruleRetrievalSucceeded' : 'ruleRetrievalAttempted', reason: 'Short retrieval check on just-banked item.' });
  session.save();
  return { succeeded };
}

// ================= Reread original text (zero scaffold) =================

function handleRereadGist(session, responseText, textRecord) {
  if (!session.state.reread.gistDim) session.state.reread.gistDim = freshDimension();
  const dim = session.state.reread.gistDim;
  const evalResult = evalGistGrowth(responseText, textRecord);
  retestAtZeroScaffold(dim, evalResult.succeeded);
  appendTrace(session.state, { checkpointId: 'REREAD_GIST', dimensionKey: 'gist', responseSummary: (responseText || '').trim(),
    statusBefore: session.state.gist.dim.status, statusAfter: dim.status, evidenceNote: evalResult.evidenceNote,
    decision: null, ruleId: 'ruleRereadGistRetested', reason: 'Zero-scaffold retest on the original text.' });
  session.save();
  return { succeeded: evalResult.succeeded };
}

function handleRereadItem(session, key, responseText, textRecord) {
  const item = session.state.items[key];
  const text = (responseText || '').trim();
  const succeeded = text.length > 3; // unaided, lightweight check
  item.rereadSucceeded = succeeded;

  const model = loadStudentModel();
  const bankEntry = item.type === 'chunk'
    ? model.chunkBank.find(c => c.chunk.toLowerCase() === item.text.toLowerCase())
    : model.wordBank.find(w => w.word.toLowerCase() === item.text.toLowerCase());
  if (bankEntry) {
    recordRetrieval(bankEntry, { textId: textRecord.textId, itemType: 'MEANING', succeeded, supportLevelAtTime: 0 });
    if (succeeded) {
      const RANK = { NEW: 0, LEARNING: 1, ALMOST_MINE: 2, INDEPENDENT: 3 };
      if (RANK.INDEPENDENT > RANK[bankEntry.currentLearningStatus]) bankEntry.currentLearningStatus = 'INDEPENDENT';
    }
  }
  saveStudentModel(model);
  appendTrace(session.state, { checkpointId: 'REREAD_ITEM', dimensionKey: item.text, responseSummary: text,
    statusBefore: item.dim.status, statusAfter: item.dim.status, evidenceNote: succeeded ? 'Succeeded unaided on reread.' : 'Still needs support on reread.',
    decision: null, ruleId: succeeded ? 'ruleRereadItemIndependent' : 'ruleRereadItemStillSupported', reason: 'Same text, zero scaffold.' });
  session.save();
  return { succeeded };
}
