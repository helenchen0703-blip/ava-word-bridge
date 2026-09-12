// core/standards-library.js — Ava BRIDGE Learning Agent, Standards + WIDA reference data
// Static, shipped, read-only reference data — never mutated at runtime, never
// user data. Embedded as a JS constant (not fetched) to match the rest of
// Core: everything boots synchronously from <script src> tags, no async
// loading step anywhere in this app. Source: core/reference-data/
// standards-library-v2.json (kept in sync manually; that file is the
// human-readable copy, this is what the app actually loads).
// Content standards: CCSS ELA/Math, CCSS Mathematical Practices, NGSS, C3.
// wida_language_layer: WIDA ELD Standards Framework 2020, Grades 4-5.

const STANDARDS_LIBRARY_V2 = Object.freeze(
{
  "metadata": {
    "name": "Ava Grade 4 Standards Library",
    "version": "2.0",
    "principle": "Same school task. Same grade-level goal. Better pathway.",
    "rule": "The school curriculum decides what Ava learns. Standards clarify the target; BRIDGE diagnoses the roadblock and selects/fades support.",
    "framework_note": "CCSS covers ELA/Math. NGSS supplies Grade 4 science. C3 is a Grades 3-5 social-studies inquiry framework, not a Grade-4 national content curriculum. WIDA 4-5 is a language-development overlay.",
    "wida_layer": "WIDA ELD Standards Framework 2020, Grades 4-5"
  },
  "agent_workflow": [
    "AUTHENTIC_SCHOOL_TASK",
    "ALIGN_1_TO_3_STANDARDS",
    "BASELINE",
    "DIAGNOSE",
    "MINIMUM_SCAFFOLD",
    "RETRY",
    "FADE",
    "RETURN_TO_SCHOOL_TASK",
    "TRANSFER"
  ],
  "roadblocks": [
    "LANGUAGE",
    "DECODING",
    "FLUENCY",
    "CONCEPT",
    "REPRESENTATION",
    "STRATEGY",
    "REASONING",
    "ORGANIZATION",
    "EXPRESSION",
    "RETENTION",
    "INDEPENDENCE"
  ],
  "evidence_states": [
    "UNKNOWN",
    "NEEDS_EVIDENCE",
    "NEEDS_SUPPORT",
    "EMERGING",
    "INDEPENDENT"
  ],
  "standards": [
    {
      "id": "RL.4.1",
      "framework": "CCSS ELA",
      "domain": "Reading Literature",
      "target": "Use text details/examples for explicit meaning and inferences."
    },
    {
      "id": "RL.4.2",
      "framework": "CCSS ELA",
      "domain": "Reading Literature",
      "target": "Determine theme and summarize."
    },
    {
      "id": "RL.4.3",
      "framework": "CCSS ELA",
      "domain": "Reading Literature",
      "target": "Describe characters, settings, or events in depth using details."
    },
    {
      "id": "RL.4.4",
      "framework": "CCSS ELA",
      "domain": "Reading Literature",
      "target": "Determine word/phrase meaning in context, including figurative language."
    },
    {
      "id": "RL.4.5",
      "framework": "CCSS ELA",
      "domain": "Reading Literature",
      "target": "Explain structural differences among poetry, drama, and prose."
    },
    {
      "id": "RL.4.6",
      "framework": "CCSS ELA",
      "domain": "Reading Literature",
      "target": "Compare first- and third-person points of view."
    },
    {
      "id": "RL.4.7",
      "framework": "CCSS ELA",
      "domain": "Reading Literature",
      "target": "Connect written text with visual/oral presentation."
    },
    {
      "id": "RL.4.9",
      "framework": "CCSS ELA",
      "domain": "Reading Literature",
      "target": "Compare treatment of similar themes/topics across texts."
    },
    {
      "id": "RL.4.10",
      "framework": "CCSS ELA",
      "domain": "Reading Literature",
      "target": "Read/comprehend Grade 4–5 literature with appropriate scaffolding."
    },
    {
      "id": "RI.4.1",
      "framework": "CCSS ELA",
      "domain": "Reading Informational",
      "target": "Use details/examples for explicit meaning and inferences."
    },
    {
      "id": "RI.4.2",
      "framework": "CCSS ELA",
      "domain": "Reading Informational",
      "target": "Determine main idea, explain supporting details, and summarize."
    },
    {
      "id": "RI.4.3",
      "framework": "CCSS ELA",
      "domain": "Reading Informational",
      "target": "Explain events, procedures, ideas, or concepts using specific text information."
    },
    {
      "id": "RI.4.4",
      "framework": "CCSS ELA",
      "domain": "Reading Informational",
      "target": "Determine general academic/domain-specific word and phrase meaning in context."
    },
    {
      "id": "RI.4.5",
      "framework": "CCSS ELA",
      "domain": "Reading Informational",
      "target": "Describe overall text structure."
    },
    {
      "id": "RI.4.6",
      "framework": "CCSS ELA",
      "domain": "Reading Informational",
      "target": "Compare firsthand and secondhand accounts."
    },
    {
      "id": "RI.4.7",
      "framework": "CCSS ELA",
      "domain": "Reading Informational",
      "target": "Interpret visual/oral/quantitative information and connect it to the text."
    },
    {
      "id": "RI.4.8",
      "framework": "CCSS ELA",
      "domain": "Reading Informational",
      "target": "Explain how reasons and evidence support an author's points."
    },
    {
      "id": "RI.4.9",
      "framework": "CCSS ELA",
      "domain": "Reading Informational",
      "target": "Integrate information from two texts on the same topic."
    },
    {
      "id": "RI.4.10",
      "framework": "CCSS ELA",
      "domain": "Reading Informational",
      "target": "Read/comprehend Grade 4–5 informational text with appropriate scaffolding."
    },
    {
      "id": "RF.4.3",
      "framework": "CCSS ELA",
      "domain": "Foundational Skills",
      "target": "Apply grade-level phonics and word-analysis skills to decode unfamiliar words."
    },
    {
      "id": "RF.4.4",
      "framework": "CCSS ELA",
      "domain": "Foundational Skills",
      "target": "Read with sufficient accuracy and fluency to support comprehension."
    },
    {
      "id": "W.4.1",
      "framework": "CCSS ELA",
      "domain": "Writing",
      "target": "Write opinions supported by reasons/information."
    },
    {
      "id": "W.4.2",
      "framework": "CCSS ELA",
      "domain": "Writing",
      "target": "Write informative/explanatory texts with facts, details, linking language, and conclusion."
    },
    {
      "id": "W.4.3",
      "framework": "CCSS ELA",
      "domain": "Writing",
      "target": "Write narratives with effective technique, details, sequence, transitions, and closure."
    },
    {
      "id": "W.4.4",
      "framework": "CCSS ELA",
      "domain": "Writing",
      "target": "Produce clear coherent writing appropriate to task, purpose, and audience."
    },
    {
      "id": "W.4.5",
      "framework": "CCSS ELA",
      "domain": "Writing",
      "target": "Plan, revise, and edit writing with guidance/support."
    },
    {
      "id": "W.4.6",
      "framework": "CCSS ELA",
      "domain": "Writing",
      "target": "Use technology to produce/publish writing and collaborate."
    },
    {
      "id": "W.4.7",
      "framework": "CCSS ELA",
      "domain": "Writing",
      "target": "Conduct short research projects."
    },
    {
      "id": "W.4.8",
      "framework": "CCSS ELA",
      "domain": "Writing",
      "target": "Gather relevant information, take notes, categorize, and list sources."
    },
    {
      "id": "W.4.9",
      "framework": "CCSS ELA",
      "domain": "Writing",
      "target": "Draw evidence from texts to support analysis/reflection/research."
    },
    {
      "id": "W.4.10",
      "framework": "CCSS ELA",
      "domain": "Writing",
      "target": "Write routinely for varied tasks, purposes, and audiences."
    },
    {
      "id": "SL.4.1",
      "framework": "CCSS ELA",
      "domain": "Speaking & Listening",
      "target": "Participate effectively in collaborative discussions."
    },
    {
      "id": "SL.4.2",
      "framework": "CCSS ELA",
      "domain": "Speaking & Listening",
      "target": "Paraphrase information from diverse media/formats."
    },
    {
      "id": "SL.4.3",
      "framework": "CCSS ELA",
      "domain": "Speaking & Listening",
      "target": "Identify a speaker's reasons/evidence."
    },
    {
      "id": "SL.4.4",
      "framework": "CCSS ELA",
      "domain": "Speaking & Listening",
      "target": "Report on a topic/text or recount an experience clearly and logically."
    },
    {
      "id": "SL.4.5",
      "framework": "CCSS ELA",
      "domain": "Speaking & Listening",
      "target": "Use audio/visual displays when useful."
    },
    {
      "id": "SL.4.6",
      "framework": "CCSS ELA",
      "domain": "Speaking & Listening",
      "target": "Use formal or informal English appropriately for context."
    },
    {
      "id": "L.4.1",
      "framework": "CCSS ELA",
      "domain": "Language",
      "target": "Use Grade 4 grammar/usage conventions."
    },
    {
      "id": "L.4.2",
      "framework": "CCSS ELA",
      "domain": "Language",
      "target": "Use capitalization, punctuation, and spelling conventions."
    },
    {
      "id": "L.4.3",
      "framework": "CCSS ELA",
      "domain": "Language",
      "target": "Use language knowledge to make effective choices."
    },
    {
      "id": "L.4.4",
      "framework": "CCSS ELA",
      "domain": "Language",
      "target": "Clarify unknown/multiple-meaning words using context, word parts, and references."
    },
    {
      "id": "L.4.5",
      "framework": "CCSS ELA",
      "domain": "Language",
      "target": "Understand figurative language, word relationships, and nuances."
    },
    {
      "id": "L.4.6",
      "framework": "CCSS ELA",
      "domain": "Language",
      "target": "Acquire/use grade-appropriate academic and domain vocabulary."
    },
    {
      "id": "4.OA.A.1",
      "framework": "CCSS Math",
      "domain": "Operations & Algebraic Thinking",
      "target": "Interpret multiplication equations as comparisons."
    },
    {
      "id": "4.OA.A.2",
      "framework": "CCSS Math",
      "domain": "Operations & Algebraic Thinking",
      "target": "Solve multiplicative-comparison word problems."
    },
    {
      "id": "4.OA.A.3",
      "framework": "CCSS Math",
      "domain": "Operations & Algebraic Thinking",
      "target": "Solve multistep whole-number word problems; interpret remainders and assess reasonableness."
    },
    {
      "id": "4.OA.B.4",
      "framework": "CCSS Math",
      "domain": "Operations & Algebraic Thinking",
      "target": "Find factor pairs, multiples, and identify prime/composite numbers."
    },
    {
      "id": "4.OA.C.5",
      "framework": "CCSS Math",
      "domain": "Operations & Algebraic Thinking",
      "target": "Generate and analyze patterns from a rule."
    },
    {
      "id": "4.NBT.A.1",
      "framework": "CCSS Math",
      "domain": "Number & Operations Base Ten",
      "target": "Generalize place-value relationships across adjacent places."
    },
    {
      "id": "4.NBT.A.2",
      "framework": "CCSS Math",
      "domain": "Number & Operations Base Ten",
      "target": "Read, write, and compare multi-digit whole numbers."
    },
    {
      "id": "4.NBT.A.3",
      "framework": "CCSS Math",
      "domain": "Number & Operations Base Ten",
      "target": "Round multi-digit whole numbers using place value."
    },
    {
      "id": "4.NBT.B.4",
      "framework": "CCSS Math",
      "domain": "Number & Operations Base Ten",
      "target": "Fluently add/subtract multi-digit whole numbers."
    },
    {
      "id": "4.NBT.B.5",
      "framework": "CCSS Math",
      "domain": "Number & Operations Base Ten",
      "target": "Multiply multi-digit whole numbers using place-value strategies."
    },
    {
      "id": "4.NBT.B.6",
      "framework": "CCSS Math",
      "domain": "Number & Operations Base Ten",
      "target": "Divide multi-digit dividends by one-digit divisors using place-value strategies."
    },
    {
      "id": "4.NF.A.1",
      "framework": "CCSS Math",
      "domain": "Fractions",
      "target": "Explain fraction equivalence using visual models and multiplicative relationships."
    },
    {
      "id": "4.NF.A.2",
      "framework": "CCSS Math",
      "domain": "Fractions",
      "target": "Compare fractions and justify comparisons using benchmarks/models."
    },
    {
      "id": "4.NF.B.3",
      "framework": "CCSS Math",
      "domain": "Fractions",
      "target": "Build, decompose, add, and subtract fractions with like denominators; solve related problems."
    },
    {
      "id": "4.NF.B.4",
      "framework": "CCSS Math",
      "domain": "Fractions",
      "target": "Multiply a fraction by a whole number and solve related problems."
    },
    {
      "id": "4.NF.C.5",
      "framework": "CCSS Math",
      "domain": "Fractions",
      "target": "Relate tenths and hundredths through equivalent fractions."
    },
    {
      "id": "4.NF.C.6",
      "framework": "CCSS Math",
      "domain": "Fractions",
      "target": "Use decimal notation for tenths and hundredths."
    },
    {
      "id": "4.NF.C.7",
      "framework": "CCSS Math",
      "domain": "Fractions",
      "target": "Compare decimals to hundredths and justify comparisons."
    },
    {
      "id": "4.MD.A.1",
      "framework": "CCSS Math",
      "domain": "Measurement & Data",
      "target": "Relate measurement units and convert larger units to smaller units."
    },
    {
      "id": "4.MD.A.2",
      "framework": "CCSS Math",
      "domain": "Measurement & Data",
      "target": "Solve measurement word problems involving four operations."
    },
    {
      "id": "4.MD.A.3",
      "framework": "CCSS Math",
      "domain": "Measurement & Data",
      "target": "Apply rectangle area/perimeter formulas."
    },
    {
      "id": "4.MD.B.4",
      "framework": "CCSS Math",
      "domain": "Measurement & Data",
      "target": "Make line plots with fractional measurements and solve problems from the data."
    },
    {
      "id": "4.MD.C.5",
      "framework": "CCSS Math",
      "domain": "Measurement & Data",
      "target": "Understand angles and angle measurement."
    },
    {
      "id": "4.MD.C.6",
      "framework": "CCSS Math",
      "domain": "Measurement & Data",
      "target": "Measure and sketch angles with a protractor."
    },
    {
      "id": "4.MD.C.7",
      "framework": "CCSS Math",
      "domain": "Measurement & Data",
      "target": "Use angle addition/decomposition to solve unknown-angle problems."
    },
    {
      "id": "4.G.A.1",
      "framework": "CCSS Math",
      "domain": "Geometry",
      "target": "Draw/identify points, lines, segments, rays, angles, parallel and perpendicular lines."
    },
    {
      "id": "4.G.A.2",
      "framework": "CCSS Math",
      "domain": "Geometry",
      "target": "Classify 2D figures by line/angle properties."
    },
    {
      "id": "4.G.A.3",
      "framework": "CCSS Math",
      "domain": "Geometry",
      "target": "Recognize and draw lines of symmetry."
    },
    {
      "id": "MP1",
      "framework": "CCSS Mathematical Practices",
      "domain": "Practice",
      "target": "Make sense of problems and persevere."
    },
    {
      "id": "MP2",
      "framework": "CCSS Mathematical Practices",
      "domain": "Practice",
      "target": "Reason abstractly and quantitatively."
    },
    {
      "id": "MP3",
      "framework": "CCSS Mathematical Practices",
      "domain": "Practice",
      "target": "Construct arguments and critique reasoning."
    },
    {
      "id": "MP4",
      "framework": "CCSS Mathematical Practices",
      "domain": "Practice",
      "target": "Model with mathematics."
    },
    {
      "id": "MP5",
      "framework": "CCSS Mathematical Practices",
      "domain": "Practice",
      "target": "Use tools strategically."
    },
    {
      "id": "MP6",
      "framework": "CCSS Mathematical Practices",
      "domain": "Practice",
      "target": "Attend to precision."
    },
    {
      "id": "MP7",
      "framework": "CCSS Mathematical Practices",
      "domain": "Practice",
      "target": "Use structure."
    },
    {
      "id": "MP8",
      "framework": "CCSS Mathematical Practices",
      "domain": "Practice",
      "target": "Notice regularity in repeated reasoning."
    },
    {
      "id": "4-PS3-1",
      "framework": "NGSS",
      "domain": "Energy",
      "target": "Use evidence to relate object speed and energy."
    },
    {
      "id": "4-PS3-2",
      "framework": "NGSS",
      "domain": "Energy",
      "target": "Use observations as evidence that energy transfers by sound, light, heat, and electric current."
    },
    {
      "id": "4-PS3-3",
      "framework": "NGSS",
      "domain": "Energy",
      "target": "Ask questions/predict energy changes when objects collide."
    },
    {
      "id": "4-PS3-4",
      "framework": "NGSS",
      "domain": "Energy",
      "target": "Design, test, and refine a device that converts energy forms."
    },
    {
      "id": "4-PS4-1",
      "framework": "NGSS",
      "domain": "Waves",
      "target": "Model wave patterns and how waves can move objects."
    },
    {
      "id": "4-PS4-2",
      "framework": "NGSS",
      "domain": "Light",
      "target": "Model how reflected light entering the eye enables seeing."
    },
    {
      "id": "4-PS4-3",
      "framework": "NGSS",
      "domain": "Information Transfer",
      "target": "Generate/compare solutions using patterns to transfer information."
    },
    {
      "id": "4-LS1-1",
      "framework": "NGSS",
      "domain": "Structure & Function",
      "target": "Argue how plant/animal structures support survival, growth, behavior, reproduction."
    },
    {
      "id": "4-LS1-2",
      "framework": "NGSS",
      "domain": "Information Processing",
      "target": "Model how animals receive, process, and respond to sensory information."
    },
    {
      "id": "4-ESS1-1",
      "framework": "NGSS",
      "domain": "Earth History",
      "target": "Use rock/fossil patterns as evidence for landscape change over time."
    },
    {
      "id": "4-ESS2-1",
      "framework": "NGSS",
      "domain": "Earth Systems",
      "target": "Use observations/measurements as evidence of weathering or erosion."
    },
    {
      "id": "4-ESS2-2",
      "framework": "NGSS",
      "domain": "Earth Systems",
      "target": "Analyze map data to describe patterns of Earth's features."
    },
    {
      "id": "4-ESS3-1",
      "framework": "NGSS",
      "domain": "Earth & Human Activity",
      "target": "Combine information about natural-resource energy/fuels and environmental effects."
    },
    {
      "id": "4-ESS3-2",
      "framework": "NGSS",
      "domain": "Earth & Human Activity",
      "target": "Generate/compare solutions reducing impacts of natural Earth processes."
    },
    {
      "id": "3-5-ETS1-1",
      "framework": "NGSS",
      "domain": "Engineering",
      "target": "Define a design problem with criteria and constraints."
    },
    {
      "id": "3-5-ETS1-2",
      "framework": "NGSS",
      "domain": "Engineering",
      "target": "Generate/compare solutions against criteria and constraints."
    },
    {
      "id": "3-5-ETS1-3",
      "framework": "NGSS",
      "domain": "Engineering",
      "target": "Plan fair tests, control variables, and identify improvements."
    },
    {
      "id": "D1.1.3-5",
      "framework": "C3 Grades 3-5",
      "domain": "Inquiry",
      "target": "Explain why compelling questions matter."
    },
    {
      "id": "D1.5.3-5",
      "framework": "C3 Grades 3-5",
      "domain": "Inquiry",
      "target": "Determine useful source types for inquiry questions."
    },
    {
      "id": "D2.Civ.1.3-5",
      "framework": "C3 Grades 3-5",
      "domain": "Civics",
      "target": "Distinguish responsibilities/powers of government officials."
    },
    {
      "id": "D2.Civ.2.3-5",
      "framework": "C3 Grades 3-5",
      "domain": "Civics",
      "target": "Explain responsible participation in democracy."
    },
    {
      "id": "D2.Civ.3.3-5",
      "framework": "C3 Grades 3-5",
      "domain": "Civics",
      "target": "Examine origins/purposes of rules, laws, and constitutional provisions."
    },
    {
      "id": "D2.Geo.1.3-5",
      "framework": "C3 Grades 3-5",
      "domain": "Geography",
      "target": "Construct maps/representations to explain relationships among places and environments."
    },
    {
      "id": "D2.Geo.4.3-5",
      "framework": "C3 Grades 3-5",
      "domain": "Geography",
      "target": "Explain how culture affects adaptation/modification of environments."
    },
    {
      "id": "D2.His.2.3-5",
      "framework": "C3 Grades 3-5",
      "domain": "History",
      "target": "Compare life in historical periods with life today."
    },
    {
      "id": "D2.His.4.3-5",
      "framework": "C3 Grades 3-5",
      "domain": "History",
      "target": "Explain differing perspectives within the same historical period."
    },
    {
      "id": "D2.His.5.3-5",
      "framework": "C3 Grades 3-5",
      "domain": "History",
      "target": "Connect historical context with people's perspectives."
    },
    {
      "id": "D3.1.3-5",
      "framework": "C3 Grades 3-5",
      "domain": "Evidence",
      "target": "Gather relevant information from multiple sources."
    },
    {
      "id": "D3.3.3-5",
      "framework": "C3 Grades 3-5",
      "domain": "Evidence",
      "target": "Identify evidence from multiple sources."
    },
    {
      "id": "D4.1.3-5",
      "framework": "C3 Grades 3-5",
      "domain": "Conclusions",
      "target": "Construct arguments with claims and evidence."
    },
    {
      "id": "D4.2.3-5",
      "framework": "C3 Grades 3-5",
      "domain": "Conclusions",
      "target": "Construct explanations using reasoning, sequence, examples, and details."
    },
    {
      "id": "ELD-SI.4-5",
      "framework": "WIDA ELD 2020",
      "domain": "Social & Instructional",
      "target": "Language for interaction, collaboration, and school learning."
    },
    {
      "id": "ELD-LA.4-5",
      "framework": "WIDA ELD 2020",
      "domain": "Language Arts",
      "target": "Language for narrating, informing, explaining, and arguing in language arts."
    },
    {
      "id": "ELD-MA.4-5",
      "framework": "WIDA ELD 2020",
      "domain": "Mathematics",
      "target": "Language for interpreting problems, representations, explanations, and mathematical arguments."
    },
    {
      "id": "ELD-SC.4-5",
      "framework": "WIDA ELD 2020",
      "domain": "Science",
      "target": "Language for describing phenomena, explaining relationships, interpreting evidence, and arguing scientifically."
    },
    {
      "id": "ELD-SS.4-5",
      "framework": "WIDA ELD 2020",
      "domain": "Social Studies",
      "target": "Language for interpreting sources, comparing perspectives, explaining relationships, and evidence-based claims."
    }
  ],
  "ava_priority": {
    "reading": [
      "RF.4.3",
      "RF.4.4",
      "RI.4.1",
      "RI.4.2",
      "RI.4.4",
      "L.4.4",
      "L.4.6",
      "ELD-LA.4-5"
    ],
    "writing": [
      "W.4.1",
      "W.4.2",
      "W.4.4",
      "W.4.5",
      "L.4.1",
      "L.4.2",
      "ELD-LA.4-5"
    ],
    "math": [
      "4.NF.A.1",
      "4.NF.A.2",
      "MP1",
      "MP3",
      "MP4",
      "MP6",
      "ELD-MA.4-5"
    ],
    "science": [
      "4-PS3-1",
      "4-LS1-1",
      "4-ESS1-1",
      "4-ESS2-2",
      "ELD-SC.4-5"
    ],
    "social_studies": [
      "D2.His.4.3-5",
      "D2.His.5.3-5",
      "D3.1.3-5",
      "D4.1.3-5",
      "ELD-SS.4-5"
    ]
  },
  "agent_rules": [
    "Always start with the authentic school task.",
    "Do not create a parallel easier curriculum from standards.",
    "Align only standards evidenced by the task; usually 1-3.",
    "Do not diagnose from one weak response; use NEEDS_EVIDENCE when ambiguous.",
    "Separate accuracy from support level and transfer.",
    "Choose the minimum scaffold that preserves student thinking.",
    "Fade support and return to the original task.",
    "WIDA is a language overlay, not replacement curriculum.",
    "C3 is a Grades 3-5 framework; school curriculum supplies social-studies content."
  ],
  "wida_language_layer": {
    "framework": "WIDA ELD Standards Framework, 2020 Edition",
    "grade_cluster": "4-5",
    "role_in_agent": "Language-demand overlay. It does not choose curriculum or replace content standards.",
    "components": [
      "ELD Standards Statements",
      "Key Language Uses",
      "Language Expectations",
      "Language Functions and Features",
      "Proficiency Level Descriptors"
    ],
    "key_language_uses": {
      "Narrate": "Use language to develop and interpret stories/events, including characters, settings, sequence, perspective, and detail.",
      "Inform": "Use language to identify, describe, classify, compare, and summarize information.",
      "Explain": "Use language to show how or why something happens, including sequence, cause/effect, relationships, procedures, evidence, and reasoning.",
      "Argue": "Use language to make or interpret claims, select evidence, reason, consider perspectives, and justify conclusions."
    },
    "standards": [
      {
        "id": "ELD-SI.4-12",
        "name": "Social and Instructional Language",
        "agent_use": "Classroom interaction, collaboration, procedures, clarification, reflection, and discussion across subjects."
      },
      {
        "id": "ELD-LA.4-5",
        "name": "Language for Language Arts",
        "agent_use": "Narrative, informational, and argumentative reading/writing."
      },
      {
        "id": "ELD-MA.4-5",
        "name": "Language for Mathematics",
        "agent_use": "Interpret and construct mathematical explanations and arguments."
      },
      {
        "id": "ELD-SC.4-5",
        "name": "Language for Science",
        "agent_use": "Interpret and construct scientific explanations and arguments."
      },
      {
        "id": "ELD-SS.4-5",
        "name": "Language for Social Studies",
        "agent_use": "Interpret and construct social-studies explanations and arguments."
      }
    ],
    "language_expectations": [
      {
        "id": "ELD-LA.4-5.Narrate.Interpretive",
        "mode": "Interpretive",
        "discipline": "Language Arts",
        "klu": "Narrate",
        "observable_demands": [
          "identify theme from details",
          "track how characters/actions develop across events",
          "determine contextual and figurative word/phrase meanings"
        ]
      },
      {
        "id": "ELD-LA.4-5.Narrate.Expressive",
        "mode": "Expressive",
        "discipline": "Language Arts",
        "klu": "Narrate",
        "observable_demands": [
          "orient audience to context",
          "develop characters and relationships",
          "develop complication/resolution and event sequence",
          "adjust language for audience"
        ]
      },
      {
        "id": "ELD-LA.4-5.Inform.Interpretive",
        "mode": "Interpretive",
        "discipline": "Language Arts",
        "klu": "Inform",
        "observable_demands": [
          "identify and summarize main ideas/key details",
          "analyze details/examples for attributes and characteristics",
          "consider effects of key word choices"
        ]
      },
      {
        "id": "ELD-LA.4-5.Inform.Expressive",
        "mode": "Expressive",
        "discipline": "Language Arts",
        "klu": "Inform",
        "observable_demands": [
          "introduce/define topic",
          "maintain objective stance",
          "add precise descriptive/comparative/classifying detail",
          "create cohesion"
        ]
      },
      {
        "id": "ELD-LA.4-5.Argue.Interpretive",
        "mode": "Interpretive",
        "discipline": "Language Arts",
        "klu": "Argue",
        "observable_demands": [
          "identify main ideas",
          "analyze points of view",
          "evaluate how details/reasons/evidence support points"
        ]
      },
      {
        "id": "ELD-LA.4-5.Argue.Expressive",
        "mode": "Expressive",
        "discipline": "Language Arts",
        "klu": "Argue",
        "observable_demands": [
          "introduce topic/claim",
          "support position with reasons/evidence",
          "connect claims and evidence",
          "close/restate position appropriately"
        ]
      },
      {
        "id": "ELD-MA.4-5.Explain.Interpretive",
        "mode": "Interpretive",
        "discipline": "Mathematics",
        "klu": "Explain",
        "observable_demands": [
          "identify mathematical concept/entity",
          "analyze problem-solving steps",
          "evaluate patterns/structures following a rule"
        ]
      },
      {
        "id": "ELD-MA.4-5.Explain.Expressive",
        "mode": "Expressive",
        "discipline": "Mathematics",
        "klu": "Explain",
        "observable_demands": [
          "introduce concept/entity",
          "share solution",
          "describe data/steps",
          "state reasoning for solution"
        ]
      },
      {
        "id": "ELD-MA.4-5.Argue.Interpretive",
        "mode": "Interpretive",
        "discipline": "Mathematics",
        "klu": "Argue",
        "observable_demands": [
          "compare conjectures with patterns/rules",
          "distinguish similarities/differences in justifications",
          "extract patterns/rules to generalize"
        ]
      },
      {
        "id": "ELD-MA.4-5.Argue.Expressive",
        "mode": "Expressive",
        "discipline": "Mathematics",
        "klu": "Argue",
        "observable_demands": [
          "create conjectures using definitions/patterns/rules",
          "generalize across cases",
          "justify conclusions",
          "evaluate others' arguments"
        ]
      },
      {
        "id": "ELD-SC.4-5.Explain.Interpretive",
        "mode": "Interpretive",
        "discipline": "Science",
        "klu": "Explain",
        "observable_demands": [
          "define investigable questions/design problems",
          "combine evidence/information to explain phenomena",
          "identify evidence supporting explanatory points"
        ]
      },
      {
        "id": "ELD-SC.4-5.Explain.Expressive",
        "mode": "Expressive",
        "discipline": "Science",
        "klu": "Explain",
        "observable_demands": [
          "describe phenomenon/problem",
          "develop reasoning connecting evidence and claims",
          "compare/summarize solutions using criteria/constraints"
        ]
      },
      {
        "id": "ELD-SC.4-5.Argue.Interpretive",
        "mode": "Interpretive",
        "discipline": "Science",
        "klu": "Argue",
        "observable_demands": [
          "identify relevant evidence from data/models/investigations",
          "compare reasoning and claims",
          "distinguish fact, reasoned judgment, and speculation"
        ]
      },
      {
        "id": "ELD-SC.4-5.Argue.Expressive",
        "mode": "Expressive",
        "discipline": "Science",
        "klu": "Argue",
        "observable_demands": [
          "introduce phenomenon",
          "make claim from evidence/data/model",
          "use objective stance",
          "connect reasoning and evidence logically"
        ]
      },
      {
        "id": "ELD-SS.4-5.Explain.Interpretive",
        "mode": "Interpretive",
        "discipline": "Social Studies",
        "klu": "Explain",
        "observable_demands": [
          "determine differing opinions in sources",
          "analyze contributing factors/causes",
          "evaluate disciplinary ideas open to interpretation"
        ]
      },
      {
        "id": "ELD-SS.4-5.Explain.Expressive",
        "mode": "Expressive",
        "discipline": "Social Studies",
        "klu": "Explain",
        "observable_demands": [
          "introduce event/phenomenon",
          "describe components/order/causes/effects with details",
          "generalize probable causes/effects"
        ]
      },
      {
        "id": "ELD-SS.4-5.Argue.Interpretive",
        "mode": "Interpretive",
        "discipline": "Social Studies",
        "klu": "Argue",
        "observable_demands": [
          "identify topic/purpose",
          "analyze information from multiple sources for claims",
          "evaluate point of view/source credibility and fact/opinion"
        ]
      },
      {
        "id": "ELD-SS.4-5.Argue.Expressive",
        "mode": "Expressive",
        "discipline": "Social Studies",
        "klu": "Argue",
        "observable_demands": [
          "introduce topic",
          "select relevant evidence from multiple sources",
          "establish perspective",
          "connect claims, reasons, and evidence"
        ]
      }
    ],
    "agent_language_dimensions": {
      "discourse": [
        "organization of ideas",
        "cohesion",
        "amount/density of language appropriate to task"
      ],
      "sentence": [
        "sentence patterns and relationships",
        "connectors for sequence/cause/condition/comparison",
        "clause complexity as needed"
      ],
      "word_phrase": [
        "general academic vocabulary",
        "discipline-specific vocabulary",
        "collocations/chunks",
        "precision of word choice"
      ]
    },
    "proficiency_use_rule": {
      "levels": "WIDA PLDs describe a continuum across six English proficiency levels.",
      "agent_rule": "Do not assign Ava a fixed WIDA level from one task. Record task-specific evidence by communication mode, language purpose, and support required; use PLDs only as a teacher-facing reference when sufficient evidence exists."
    },
    "bridge_mapping": {
      "LANGUAGE": [
        "word/phrase meaning",
        "task language",
        "sentence meaning",
        "disciplinary language features"
      ],
      "EXPRESSION": [
        "oral/written construction of discipline-appropriate language"
      ],
      "REASONING": [
        "language linking evidence, claims, causes, steps, patterns, or conclusions"
      ],
      "INDEPENDENCE": [
        "same language demand completed with reduced support"
      ]
    },
    "minimum_scaffold_examples": [
      "highlight or chunk only the language blocking meaning",
      "visual/diagram linked to the exact school language",
      "clarifying question about the task action",
      "temporary connector or sentence frame",
      "oral rehearsal before writing",
      "model one component, not the whole answer"
    ],
    "fading_evidence": [
      "understands the same task language with fewer cues",
      "uses target academic words/chunks without a visible bank",
      "explains or argues with fewer sentence frames",
      "returns to the original school task and succeeds",
      "transfers the language function to a new authentic task"
    ]
  },
  "integration_rule": "CONTENT STANDARD answers what grade-level content/disciplinary practice is expected; WIDA identifies the language demand; BRIDGE identifies Ava's current roadblock and support."
}
);

function loadStandardsLibrary() {
  return STANDARDS_LIBRARY_V2;
}
