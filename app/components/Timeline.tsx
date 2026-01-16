"use client";

import { useState } from "react";

interface TimelineProps {
  videoDuration: number;
  onSegmentAnalyze: (tStart: number, tEnd: number) => void;
  isAnalyzing: boolean;
}

export default function Timeline({ videoDuration, onSegmentAnalyze, isAnalyzing }: TimelineProps) {
  const [tStart, setTStart] = useState(0);
  const [tEnd, setTEnd] = useState(Math.min(videoDuration, 10));

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleRecheck = () => {
    if (tStart >= tEnd || tStart < 0 || tEnd > videoDuration) {
      return;
    }
    onSegmentAnalyze(tStart, tEnd);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Timeline Scrub</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Time Window (0:00 - {formatTime(videoDuration)})
          </label>
          
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-600">Start Time (seconds)</label>
              <input
                type="number"
                min="0"
                max={videoDuration}
                step="0.1"
                value={tStart}
                onChange={(e) => setTStart(Math.max(0, Math.min(parseFloat(e.target.value) || 0, videoDuration)))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isAnalyzing || videoDuration === 0}
              />
              <span className="text-xs text-gray-500">{formatTime(tStart)}</span>
            </div>
            
            <div>
              <label className="text-xs text-gray-600">End Time (seconds)</label>
              <input
                type="number"
                min="0"
                max={videoDuration}
                step="0.1"
                value={tEnd}
                onChange={(e) => setTEnd(Math.max(0, Math.min(parseFloat(e.target.value) || 0, videoDuration)))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isAnalyzing || videoDuration === 0}
              />
              <span className="text-xs text-gray-500">{formatTime(tEnd)}</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="relative w-full h-2 bg-gray-200 rounded-full">
              <div
                className="absolute h-2 bg-blue-500 rounded-full"
                style={{
                  left: `${(tStart / videoDuration) * 100}%`,
                  width: `${((tEnd - tStart) / videoDuration) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleRecheck}
          disabled={isAnalyzing || videoDuration === 0 || tStart >= tEnd}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? "Re-checking..." : "Re-check Segment"}
        </button>

        {tStart >= tEnd && (
          <p className="text-sm text-red-600">Start time must be less than end time</p>
        )}
      </div>
    </div>
  );
}
