import { GoogleGenerativeAI } from "@google/generative-ai";
import { RealityDebugReport } from "./schema";
import { REALITY_DEBUG_SCHEMA } from "./schema";
import fs from "fs";
import path from "path";

const SYSTEM_PROMPT = `You are Reality Debugger, a multimodal failure-investigation engine.
Goal: determine WHY a real-world failure happened (causal chain), not just WHAT happened.

Non-negotiables:
- Use evidence grounded in the provided media and user expectations.
- Provide timestamped observations (mm:ss) and link every causal step to evidence.
- Produce non-generic, domain-specific reasoning.
- If uncertain, state uncertainty AND list what evidence is missing.
- Do not moralize. Do not be inspirational. Be concise and technical.

Output must EXACTLY match the provided JSON schema.
No markdown. No extra keys. No commentary.`;

const FULL_ANALYSIS_USER_PROMPT_TEMPLATE = `Expectation (what should have happened):
{{EXPECTATION_TEXT}}

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
Return ONLY valid JSON per schema.`;

const SEGMENT_ANALYSIS_USER_PROMPT_TEMPLATE = `We are re-checking ONLY this time window:
t_start_sec={{T_START}}
t_end_sec={{T_END}}

Given the same expectation:
{{EXPECTATION_TEXT}}

Task:
- Update observations relevant to this segment.
- Update the timeline entries that fall within [t_start_sec, t_end_sec].
- If this segment changes the most likely root cause chain, reflect it, otherwise keep it consistent.

Return ONLY JSON that matches the SAME schema.
(If fields are unchanged, repeat them exactly; do not omit required fields.)`;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenerativeAI(apiKey);
}

async function readVideoFile(filePath: string): Promise<{ data: Buffer; mimeType: string }> {
  const data = await fs.promises.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === ".mp4" ? "video/mp4" : "video/*";
  return { data, mimeType };
}

export async function analyzeVideo(
  videoFilePath: string,
  expectationText: string
): Promise<RealityDebugReport> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-3-pro-preview",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: REALITY_DEBUG_SCHEMA as any,
    },
  });

  const { data: videoData, mimeType } = await readVideoFile(videoFilePath);

  const userPrompt = FULL_ANALYSIS_USER_PROMPT_TEMPLATE.replace(
    "{{EXPECTATION_TEXT}}",
    expectationText
  );

  const result = await model.generateContent([
    {
      text: SYSTEM_PROMPT,
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
    return JSON.parse(text) as RealityDebugReport;
  } catch (error) {
    throw new Error(`Failed to parse Gemini response as JSON: ${error}. Response: ${text.substring(0, 500)}`);
  }
}

export async function analyzeSegment(
  videoFilePath: string,
  expectationText: string,
  tStart: number,
  tEnd: number
): Promise<RealityDebugReport> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: REALITY_DEBUG_SCHEMA as any,
      // Flash model is faster by default for segment analysis
    },
  });

  const { data: videoData, mimeType } = await readVideoFile(videoFilePath);

  const userPrompt = SEGMENT_ANALYSIS_USER_PROMPT_TEMPLATE
    .replace("{{T_START}}", tStart.toString())
    .replace("{{T_END}}", tEnd.toString())
    .replace("{{EXPECTATION_TEXT}}", expectationText);

  const result = await model.generateContent([
    {
      text: SYSTEM_PROMPT,
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
    return JSON.parse(text) as RealityDebugReport;
  } catch (error) {
    throw new Error(`Failed to parse Gemini response as JSON: ${error}. Response: ${text.substring(0, 500)}`);
  }
}
