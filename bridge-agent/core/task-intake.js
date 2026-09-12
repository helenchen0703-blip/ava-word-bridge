// core/task-intake.js — Ava BRIDGE Learning Agent, TaskRecord model
// Owns the shape of a teacher-created task and its storage. Never rewrites
// the authentic task text. Validation logic (schema-required/min checks)
// lives in task-analyzer.js — this file is CRUD + shape only.

const TASK_RECORD_KEY = 'bridgeTaskRecords_v1';

function freshTaskId() {
  return 'task_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function createTaskRecord({ title, subject, learningGoal, authenticText, moduleIntakeData, createdBy }) {
  return {
    taskId: freshTaskId(),
    title: title || '(untitled task)',
    subject,
    learningGoal: learningGoal || '',
    authenticText: authenticText || '', // verbatim, never auto-rewritten
    moduleIntakeData: moduleIntakeData || {},
    createdAt: new Date().toISOString(),
    createdBy: createdBy || 'teacher',
    status: 'READY' // or 'NEEDS_TEACHER_INPUT' — set by task-analyzer.js
  };
}

function loadAllTaskRecords() {
  try {
    const raw = localStorage.getItem(TASK_RECORD_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveTaskRecord(taskRecord) {
  const all = loadAllTaskRecords();
  const idx = all.findIndex(t => t.taskId === taskRecord.taskId);
  if (idx >= 0) all[idx] = taskRecord; else all.push(taskRecord);
  try {
    localStorage.setItem(TASK_RECORD_KEY, JSON.stringify(all));
  } catch (e) {
    // Storage unavailable — session continues in memory only.
  }
  return taskRecord;
}

function loadTaskRecord(taskId) {
  return loadAllTaskRecords().find(t => t.taskId === taskId) || null;
}
