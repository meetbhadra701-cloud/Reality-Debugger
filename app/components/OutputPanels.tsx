"use client";

import { RealityDebugReport } from "@/lib/schema";

interface OutputPanelsProps {
  report: RealityDebugReport;
}

export default function OutputPanels({ report }: OutputPanelsProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Root Cause Chain */}
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Root Cause Chain</h2>
        <div className="space-y-4">
          {report.root_cause_chain.map((step, idx) => (
            <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-blue-600">Step {step.step}:</span>
                    <span className="font-medium">{step.cause}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{step.mechanism}</p>
                  <div className="text-xs text-gray-500">
                    Linked observations: {step.linked_observation_indices.join(", ")}
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-xs text-gray-500 mb-1">Confidence</div>
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${step.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">
                    {(step.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Counterfactuals */}
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Counterfactuals</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {report.counterfactuals.map((cf, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <div className="font-semibold text-gray-800 mb-2">If: {cf.change}</div>
              <div className="text-sm text-gray-600 mb-2">
                Then: {cf.predicted_outcome_change}
              </div>
              <div className="text-xs text-gray-500 mb-2">{cf.why_it_changes}</div>
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Confidence</div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${cf.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600">
                  {(cf.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Minimal Intervention */}
      <div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Minimal Intervention</h2>
        <div className="space-y-3">
          <div>
            <div className="font-semibold text-gray-800 mb-1">Action:</div>
            <div className="text-lg text-gray-900">{report.minimal_intervention.action}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-800 mb-1">Why This Is Minimal:</div>
            <div className="text-gray-700">{report.minimal_intervention.why_this_is_minimal}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-800 mb-1">Expected Effect:</div>
            <div className="text-gray-700">{report.minimal_intervention.expected_effect}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-800 mb-1">Risk Tradeoffs:</div>
            <div className="text-gray-700">{report.minimal_intervention.risk_tradeoffs}</div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Expectation vs Reality Timeline</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left p-2">Time</th>
                <th className="text-left p-2">Expected State</th>
                <th className="text-left p-2">Observed State</th>
                <th className="text-left p-2">Divergence</th>
                <th className="text-left p-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {report.timeline.map((entry, idx) => (
                <tr key={idx} className="border-b border-gray-200">
                  <td className="p-2 font-mono text-sm">{formatTime(entry.t_sec)}</td>
                  <td className="p-2 text-sm">{entry.expected_state}</td>
                  <td className="p-2 text-sm">{entry.observed_state}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500"
                          style={{ width: `${entry.divergence_score * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {(entry.divergence_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="p-2 text-xs text-gray-500">{entry.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Observations */}
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Observations</h2>
        <div className="space-y-2">
          {report.observations.map((obs, idx) => (
            <div key={idx} className="border-l-2 border-gray-300 pl-3 py-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <span className="font-mono text-xs text-gray-500">
                    [{formatTime(obs.t_start_sec)} - {formatTime(obs.t_end_sec)}]
                  </span>
                  <span className="ml-2 text-xs px-2 py-1 bg-gray-100 rounded">
                    {obs.evidence_type}
                  </span>
                  <p className="text-sm text-gray-700 mt-1">{obs.observation}</p>
                </div>
                <div className="ml-4 text-xs text-gray-500">
                  {(obs.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
