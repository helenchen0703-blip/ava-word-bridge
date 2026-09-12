// core/storage.js — Ava BRIDGE Learning Agent, Core persistence layer
// Pure localStorage I/O. No DOM access, no decision logic, no subject knowledge.
//
// Two independent stores:
//   bridgeCoreData_v2   = { version:2, records: { "<experienceId>.<taskId>": <learnerState>, ... } }
//   bridgeStudentModel_v1 = the longitudinal student model (see student-model.js) — never
//                            touched here, kept in its own file since it has its own shape.
//
// v1 (bridgeCoreData_v1) was keyed by a fixed experienceId ("writing.rocketWriting") with
// exactly one record per Experience. v2 is keyed per-task ("writing.rocketWriting.<taskId>")
// because tasks are now data a teacher creates, not a fixed slot. On first load, any v1
// record is migrated forward under a synthetic legacy taskId so that in-progress student
// state is never silently dropped.

const BRIDGE_STORAGE_KEY = 'bridgeCoreData_v2';
const LEGACY_CORE_KEY_V1 = 'bridgeCoreData_v1';
const LEGACY_WRITING_AGENT_KEY = 'bridgeAgentData_v1'; // BRIDGE Writing Agent v1, pre-Core
const LEGACY_TASK_ID = 'legacy-rocket-writing-athens-sparta';

function readStorageRoot() {
  try {
    const raw = localStorage.getItem(BRIDGE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* fall through to migration / empty root */ }

  // One-time migration from v1's single-record-per-experience shape.
  try {
    const legacyV1Raw = localStorage.getItem(LEGACY_CORE_KEY_V1);
    if (legacyV1Raw) {
      const legacyV1 = JSON.parse(legacyV1Raw);
      const root = { version: 2, records: {} };
      Object.keys(legacyV1.records || {}).forEach(experienceId => {
        root.records[`${experienceId}.${LEGACY_TASK_ID}`] = legacyV1.records[experienceId];
      });
      persistRoot(root);
      return root;
    }
  } catch (e) { /* fall through */ }

  // One-time migration from the original BRIDGE Writing Agent v1's own key
  // (predates the Core storage layer entirely).
  try {
    const legacyRaw = localStorage.getItem(LEGACY_WRITING_AGENT_KEY);
    if (legacyRaw) {
      const legacyState = JSON.parse(legacyRaw);
      const root = { version: 2, records: { [`writing.rocketWriting.${LEGACY_TASK_ID}`]: legacyState } };
      persistRoot(root);
      return root;
    }
  } catch (e) { /* fall through */ }

  return { version: 2, records: {} };
}

function persistRoot(root) {
  try {
    localStorage.setItem(BRIDGE_STORAGE_KEY, JSON.stringify(root));
  } catch (e) {
    // Storage unavailable (sandboxed preview, private mode, quota) — session continues in memory only.
  }
}

function recordKey(experienceId, taskId) {
  return `${experienceId}.${taskId}`;
}

function saveLearnerState(state, experienceId, taskId) {
  state.updatedAt = new Date().toISOString();
  const root = readStorageRoot();
  root.records[recordKey(experienceId, taskId)] = state;
  persistRoot(root);
}

function loadLearnerState(experienceId, taskId) {
  const root = readStorageRoot();
  return (root.records && root.records[recordKey(experienceId, taskId)]) || null;
}

function deleteLearnerState(experienceId, taskId) {
  const root = readStorageRoot();
  delete root.records[recordKey(experienceId, taskId)];
  persistRoot(root);
}

function listLearnerStateKeys() {
  const root = readStorageRoot();
  return Object.keys(root.records || {});
}
