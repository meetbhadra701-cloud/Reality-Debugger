// TypeScript interfaces for RealityDebugReport

export interface Observation {
  t_start_sec: number;
  t_end_sec: number;
  observation: string;
  evidence_type: "visual" | "audio" | "text_log" | "user_text";
  confidence: number;
}

export interface RootCauseStep {
  step: number;
  cause: string;
  mechanism: string;
  linked_observation_indices: number[];
  confidence: number;
}

export interface Counterfactual {
  change: string;
  predicted_outcome_change: string;
  why_it_changes: string;
  confidence: number;
}

export interface MinimalIntervention {
  action: string;
  why_this_is_minimal: string;
  expected_effect: string;
  risk_tradeoffs: string;
}

export interface TimelineEntry {
  t_sec: number;
  expected_state: string;
  observed_state: string;
  divergence_score: number;
  notes: string;
}

export interface Scenario {
  domain: "cooking_failure";
  failure_summary: string;
}

export interface RealityDebugReport {
  scenario: Scenario;
  observations: Observation[];
  root_cause_chain: RootCauseStep[];
  counterfactuals: Counterfactual[];
  minimal_intervention: MinimalIntervention;
  timeline: TimelineEntry[];
}

// JSON Schema for Gemini structured outputs
export const REALITY_DEBUG_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["scenario", "observations", "root_cause_chain", "counterfactuals", "minimal_intervention", "timeline"],
  properties: {
    scenario: {
      type: "object",
      additionalProperties: false,
      required: ["domain", "failure_summary"],
      properties: {
        domain: { type: "string", enum: ["cooking_failure"] },
        failure_summary: { type: "string", description: "1 sentence summary of what went wrong." }
      }
    },
    observations: {
      type: "array",
      minItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["t_start_sec", "t_end_sec", "observation", "evidence_type", "confidence"],
        properties: {
          t_start_sec: { type: "number" },
          t_end_sec: { type: "number" },
          observation: { type: "string", description: "Concrete, visible/audible observation. No speculation." },
          evidence_type: { type: "string", enum: ["visual", "audio", "text_log", "user_text"] },
          confidence: { type: "number", minimum: 0, maximum: 1 }
        }
      }
    },
    root_cause_chain: {
      type: "array",
      minItems: 4,
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["step", "cause", "mechanism", "linked_observation_indices", "confidence"],
        properties: {
          step: { type: "integer", minimum: 1 },
          cause: { type: "string" },
          mechanism: { type: "string", description: "How this cause leads to the next step; must be specific." },
          linked_observation_indices: {
            type: "array",
            minItems: 1,
            items: { type: "integer", minimum: 0 }
          },
          confidence: { type: "number", minimum: 0, maximum: 1 }
        }
      }
    },
    counterfactuals: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["change", "predicted_outcome_change", "why_it_changes", "confidence"],
        properties: {
          change: { type: "string", description: "Single controlled change." },
          predicted_outcome_change: { type: "string", description: "What would differ in the outcome." },
          why_it_changes: { type: "string", description: "Causal explanation, not generic." },
          confidence: { type: "number", minimum: 0, maximum: 1 }
        }
      }
    },
    minimal_intervention: {
      type: "object",
      additionalProperties: false,
      required: ["action", "why_this_is_minimal", "expected_effect", "risk_tradeoffs"],
      properties: {
        action: { type: "string", description: "Smallest viable fix." },
        why_this_is_minimal: { type: "string" },
        expected_effect: { type: "string" },
        risk_tradeoffs: { type: "string" }
      }
    },
    timeline: {
      type: "array",
      minItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["t_sec", "expected_state", "observed_state", "divergence_score", "notes"],
        properties: {
          t_sec: { type: "number" },
          expected_state: { type: "string" },
          observed_state: { type: "string" },
          divergence_score: { type: "number", minimum: 0, maximum: 1 },
          notes: { type: "string" }
        }
      }
    }
  }
} as const;
