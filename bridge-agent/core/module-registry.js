// core/module-registry.js — Ava BRIDGE Learning Agent, Module registration
// A Module is fixed code, registered once. Core never special-cases a
// Module by name anywhere else — this file (plus generic lookups by
// module.subject) is the only place the set of Modules is enumerated.
//
// Required Module interface:
//   {
//     subject,               // e.g. 'READING' — must match a TaskRecord.subject
//     label,                 // display name, e.g. 'Reading'
//     intakeSchema,          // array of field descriptors (see intake-form-renderer.js)
//     dimensionManifest,     // [{key, category}] — category is a ROADBLOCK_CATEGORY value
//     checkpoints,           // { [checkpointId]: { evaluator, isolationPair? } }
//     firstCheckpointId,     // which checkpoint runs first
//     route,                 // { [checkpointId]: (evalResult, taskRecord) => nextCheckpointId|null }
//     scaffoldContent,       // (checkpointId, level, taskRecord) => { text, visual? }
//     experienceId,          // storage/experience key, e.g. 'writing.rocketWriting'
//     renderExperience        // optional: (container, ctx) => void — custom UI skin.
//                              // Omit to use Core's generic checkpoint UI.
//   }

const ModuleRegistry = {
  modules: {},

  register(module) {
    if (!module.subject) throw new Error('Module must declare a subject');
    this.modules[module.subject] = module;
  },

  get(subject) {
    return this.modules[subject] || null;
  },

  list() {
    return Object.values(this.modules);
  },

  subjects() {
    return Object.keys(this.modules);
  }
};
