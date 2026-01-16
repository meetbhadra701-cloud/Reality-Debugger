import { RealityDebugReport, Observation, RootCauseStep, Counterfactual, TimelineEntry } from "./schema";
import { analyzeVideo } from "./gemini";
import fs from "fs";

export function validateReport(report: any): report is RealityDebugReport {
  if (!report || typeof report !== "object") {
    return false;
  }

  // Check required top-level fields
  if (!report.scenario || !report.observations || !report.root_cause_chain || 
      !report.counterfactuals || !report.minimal_intervention || !report.timeline) {
    return false;
  }

  // Validate scenario
  if (report.scenario.domain !== "cooking_failure" || typeof report.scenario.failure_summary !== "string") {
    return false;
  }

  // Validate observations
  if (!Array.isArray(report.observations) || report.observations.length < 5) {
    return false;
  }
  for (const obs of report.observations) {
    if (typeof obs.t_start_sec !== "number" || typeof obs.t_end_sec !== "number" ||
        typeof obs.observation !== "string" || typeof obs.confidence !== "number" ||
        !["visual", "audio", "text_log", "user_text"].includes(obs.evidence_type)) {
      return false;
    }
  }

  // Validate root_cause_chain
  if (!Array.isArray(report.root_cause_chain) || report.root_cause_chain.length < 4 || report.root_cause_chain.length > 10) {
    return false;
  }
  for (const step of report.root_cause_chain) {
    if (typeof step.step !== "number" || typeof step.cause !== "string" ||
        typeof step.mechanism !== "string" || typeof step.confidence !== "number" ||
        !Array.isArray(step.linked_observation_indices) || step.linked_observation_indices.length === 0) {
      return false;
    }
  }

  // Validate counterfactuals (exactly 3)
  if (!Array.isArray(report.counterfactuals) || report.counterfactuals.length !== 3) {
    return false;
  }
  for (const cf of report.counterfactuals) {
    if (typeof cf.change !== "string" || typeof cf.predicted_outcome_change !== "string" ||
        typeof cf.why_it_changes !== "string" || typeof cf.confidence !== "number") {
      return false;
    }
  }

  // Validate minimal_intervention
  if (typeof report.minimal_intervention.action !== "string" ||
      typeof report.minimal_intervention.why_this_is_minimal !== "string" ||
      typeof report.minimal_intervention.expected_effect !== "string" ||
      typeof report.minimal_intervention.risk_tradeoffs !== "string") {
    return false;
  }

  // Validate timeline
  if (!Array.isArray(report.timeline) || report.timeline.length < 6) {
    return false;
  }
  for (const entry of report.timeline) {
    if (typeof entry.t_sec !== "number" || typeof entry.expected_state !== "string" ||
        typeof entry.observed_state !== "string" || typeof entry.divergence_score !== "number" ||
        typeof entry.notes !== "string") {
      return false;
    }
  }

  return true;
}

const REPAIR_PROMPT_SUFFIX = `

IMPORTANT: The previous response was invalid JSON or did not match the schema. 
Please return ONLY valid JSON that exactly matches the provided schema.
- Fix any type mismatches (e.g., strings where numbers are required)
- Ensure all enum values are correct
- Remove any extra keys not in the schema
- Ensure all required fields are present
- Ensure arrays meet minimum length requirements
- Do not include markdown formatting, code blocks, or any text outside the JSON object.`;

export async function retryWithRepair(
  videoFilePath: string,
  expectationText: string,
  originalError: string
): Promise<RealityDebugReport> {
  // Import here to avoid circular dependency
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const { REALITY_DEBUG_SCHEMA } = await import("./schema");
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const model = genAI.getGenerativeModel({
    model: "gemini-3-pro-preview",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: REALITY_DEBUG_SCHEMA as any,
    },
  });

  const videoData = await fs.promises.readFile(videoFilePath);
  const mimeType = "video/mp4";

  const userPrompt = `Expectation (what should have happened):
${expectationText}

Task:
1) Extract timestamped observations from the media.
2) Propose multiple plausible causes, then prune to the most likely root cause chain.
3) Provide exactly 3 counterfactuals.
4) Provide the minimal intervention (smallest fix).
5) Build an expectation-vs-reality timeline with divergence scores.

Guardrails:
- Every root_cause_chain step must reference linked_observation_indices.
- If you cannot see key evidence in the video/audio, say so in observations and lower confidence.
- Avoid generic cooking advice; tie claims to observed evidence.
Return ONLY valid JSON per schema.${REPAIR_PROMPT_SUFFIX}

Previous error: ${originalError}`;

  const result = await model.generateContent([
    {
      text: `You are Reality Debugger, a multimodal failure-investigation engine.
Goal: determine WHY a real-world failure happened (causal chain), not just WHAT happened.

Non-negotiables:
- Use evidence grounded in the provided media and user expectations.
- Provide timestamped observations (mm:ss) and link every causal step to evidence.
- Produce non-generic, domain-specific reasoning.
- If uncertain, state uncertainty AND list what evidence is missing.
- Do not moralize. Do not be inspirational. Be concise and technical.

Output must EXACTLY match the provided JSON schema.
No markdown. No extra keys. No commentary.`,
    },
    {
      inlineData: {
        data: videoData.toString("base64"),
        mimeType,
      },
    },
    {
      text: userPrompt,
    },
  ]);

  const response = result.response;
  const text = response.text();
  
  try {
    const parsed = JSON.parse(text) as RealityDebugReport;
    if (!validateReport(parsed)) {
      throw new Error("Repaired response still does not match schema");
    }
    return parsed;
  } catch (error) {
    throw new Error(`Failed to repair JSON response: ${error}. Response: ${text.substring(0, 500)}`);
  }
}
