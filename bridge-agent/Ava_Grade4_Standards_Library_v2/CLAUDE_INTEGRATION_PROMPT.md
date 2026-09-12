# Claude Integration Prompt — Ava Standards Library v2

Inspect the existing Ava BRIDGE Learning Agent before changing code.

Add `ava_grade4_standards_library_v2.json` as a REFERENCE LAYER, not a curriculum generator.

Required architecture:
AUTHENTIC SCHOOL TASK
→ CONTENT STANDARD MATCH (CCSS / NGSS / C3; teacher can override)
→ WIDA LANGUAGE DEMAND MATCH
→ BASELINE
→ BRIDGE ROADBLOCK DIAGNOSIS
→ MINIMUM NECESSARY SCAFFOLD
→ STUDENT RETRY
→ FADE
→ ORIGINAL SCHOOL TASK
→ TRANSFER / INDEPENDENCE EVIDENCE

Hard rules:
1. The school task decides what Ava learns.
2. Standards never trigger a parallel easier curriculum.
3. Match only 1–3 genuinely relevant content standards.
4. WIDA is a language-demand overlay.
5. Identify discipline + Key Language Use + Interpretive/Expressive demand when evidence supports it.
6. Do not assign Ava a fixed WIDA proficiency level from one task.
7. Keep accuracy separate from support and transfer.
8. If the roadblock is ambiguous, use NEEDS_EVIDENCE and one discriminating check.
9. Use the minimum scaffold that preserves Ava's thinking.
10. Fade and return to the exact authentic school task.
11. Teacher can override all standard/language-demand suggestions.
12. Store a Decision Trace: Evidence → Hypothesis → Standard/Language Demand → Decision → Scaffold → Student Response → Next Decision.

For WIDA matching, support:
- Language Arts: Narrate / Inform / Argue
- Mathematics: Explain / Argue
- Science: Explain / Argue
- Social Studies: Explain / Argue
- Social & Instructional language across classroom interaction

Do not make a standalone “WIDA worksheet” page. WIDA should inform Agent decisions invisibly and appear in Teacher View as a concise alignment.

Before implementation, show:
A. where the standards library will live,
B. how it will be loaded,
C. how Content Standard Matcher and WIDA Language Demand Matcher remain separate,
D. how Teacher Override works,
E. one unseen Reading example,
F. one unseen Math example,
G. one unseen Science or Social Studies example,
H. how WIDA evidence is stored without labeling Ava globally.

STOP after presenting the design. Do not code until I approve.
