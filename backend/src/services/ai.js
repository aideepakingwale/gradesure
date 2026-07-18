// ===========================================================================
// Generative-AI study-guide service.
//   Primary:  Groq (OpenAI-compatible chat completions, JSON mode)
//   Fallback: Google Gemini (free tier)
//   Safety net: deterministic rule-based generator (works with NO API keys)
// Always returns the same JSON shape, so the app is functional either way.
// ===========================================================================
import { config } from "../config.js";
import { RESOURCES, GENERAL_RESOURCES } from "../data/resources.js";
import { loadReferenceMap, subjectLevelRefs } from "./referenceStore.js";

// ---- Prompt -------------------------------------------------------------
function buildPrompt(ctx) {
  const subjectLines = ctx.subjects
    .map(
      (s) =>
        `- ${s.name} (${s.board}${s.tier ? ", " + s.tier + " tier" : ""}): current grade ${s.current}, target ${s.target}, ~${s.sessionsPerWeek} sessions/week`
    )
    .join("\n");
  return `You are an expert UK GCSE tutor and study coach. Build a personalised study guide for a Year ${ctx.year_group} student sitting GCSEs in ${ctx.exam_series} (exam window ${ctx.exam_start} to ${ctx.exam_end}), about ${ctx.months_to_exam} months away.

Subjects (current -> target grade):
${subjectLines}

Foundation-tier subjects cap at grade 5 — flag any that must move to Higher tier.

Respond with STRICT JSON only, matching this exact schema:
{
  "headline": string,
  "summary": string (2-3 sentences, motivating and specific),
  "subjects": [ { "key": string, "name": string, "focus": string, "strategy": string (2 sentences, board-specific, exam-technique focused) } ],
  "techniques": [ { "name": string, "description": string } ],
  "evaluation_rubric": {
     "cadence": string,
     "on_track": string, "at_risk": string, "off_track": string,
     "signals": [ string ]
  }
}
Use the subject "key" values exactly as given: ${ctx.subjects.map((s) => s.key).join(", ")}.`;
}

// ---- Providers ----------------------------------------------------------
async function callGroq(prompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.ai.groqKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.ai.groqModel,
      messages: [
        { role: "system", content: "You are an expert UK GCSE tutor. Output strict JSON only." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.ai.geminiModel}:generateContent?key=${config.ai.geminiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5, responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return JSON.parse(text);
}

// ---- Rule-based safety net (no keys required) ---------------------------
function ruleBasedGuide(ctx) {
  const subjects = ctx.subjects.map((s) => {
    const foundation = s.tier === "Foundation";
    const res = RESOURCES[s.key];
    const focus = foundation
      ? `Move to Higher tier, then close the gap to grade ${s.target}.`
      : s.target - s.current >= 3
      ? `A ${s.target - s.current}-grade climb — heavy exam-question practice.`
      : `Refine toward grade ${s.target} via past papers.`;
    const strategy = res?.note
      ? res.note
      : `Use ${res?.resources?.[0]?.name || "past papers"} for ${s.name}, then mark every answer against the ${s.board} mark scheme. Convert notes into timed exam questions.`;
    return { key: s.key, name: s.name, focus, strategy };
  });

  return {
    headline: `Your route to grade 8–9 by ${ctx.exam_series}`,
    summary: `A personalised ${ctx.months_to_exam}-month plan across ${ctx.subjects.length} subjects, weighted toward your weakest and Foundation-tier subjects. Swap passive revision for active exam training — past papers, mark schemes, and spaced recall.`,
    subjects,
    techniques: [
      { name: "Blurting", description: "Read for 5 min, close the book, write everything from memory, then fill gaps in red pen." },
      { name: "Spaced repetition", description: "Anki/Quizlet daily for vocab, formulae and quotes — little and often." },
      { name: "Mark-scheme hack", description: "Study mark schemes and examiner reports to learn the exact words that score." },
      { name: "10-mark rule", description: "One timed answer per day, graded strictly against the scheme." },
    ],
    evaluation_rubric: {
      cadence: "Every 2 weeks",
      on_track: "≥ 80% of scheduled tasks completed",
      at_risk: "50–79% completed — tighten routine and prioritise weak topics",
      off_track: "< 50% completed — rescope the plan and reduce load to rebuild the habit",
      signals: [
        "Completion rate vs scheduled tasks",
        "Balance across subjects (no subject ignored)",
        "Tasks marked 'halted' with blockers noted",
        "Time logged trending up into mock season",
      ],
    },
  };
}

function attachResources(guide, refMap) {
  // Enrich every subject with links from the admin-managed reference library
  // (falls back to the built-in directory for uncovered subjects).
  guide.subjects = guide.subjects.map((s) => {
    const fromDb = refMap ? subjectLevelRefs(refMap, s.key) : [];
    const fallback = (RESOURCES[s.key]?.resources || []).slice(0, 4).map((r) => ({ name: r.name, url: r.url, tag: r.tag }));
    return {
      ...s,
      board: RESOURCES[s.key]?.board,
      resources: fromDb.length ? fromDb : fallback,
    };
  });
  const general = refMap?.get("general|")?.slice(0, 5);
  guide.general_resources = general?.length ? general : GENERAL_RESOURCES.slice(0, 5);
  return guide;
}

/**
 * Generate a study guide. Returns { generated_by, model, guide }.
 */
export async function generateStudyGuide(ctx) {
  const prompt = buildPrompt(ctx);
  const refMap = await loadReferenceMap([...ctx.subjects.map((s) => s.key), "general"]).catch(() => null);

  if (config.ai.groqKey) {
    try {
      const guide = await callGroq(prompt);
      return { generated_by: "groq", model: config.ai.groqModel, guide: attachResources(guide, refMap) };
    } catch (err) {
      console.warn("[ai] Groq failed, trying Gemini:", err.message);
    }
  }
  if (config.ai.geminiKey) {
    try {
      const guide = await callGemini(prompt);
      return { generated_by: "gemini", model: config.ai.geminiModel, guide: attachResources(guide, refMap) };
    } catch (err) {
      console.warn("[ai] Gemini failed, using rule-based:", err.message);
    }
  }
  return { generated_by: "rule-based", model: null, guide: attachResources(ruleBasedGuide(ctx), refMap) };
}
