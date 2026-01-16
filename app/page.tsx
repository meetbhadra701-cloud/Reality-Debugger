"use client";

import { useState } from "react";
import UploadPanel from "./components/UploadPanel";
import Timeline from "./components/Timeline";
import OutputPanels from "./components/OutputPanels";
import { RealityDebugReport } from "@/lib/schema";

export default function Home() {
  const [fileId, setFileId] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [report, setReport] = useState<RealityDebugReport | null>(null);
  const [isSegmentAnalyzing, setIsSegmentAnalyzing] = useState(false);
  const [expectationText, setExpectationText] = useState<string>("");

  const handleFileUploaded = (id: string, duration: number) => {
    setFileId(id);
    setVideoDuration(duration);
  };

  const handleAnalysisComplete = (newReport: RealityDebugReport) => {
    setReport(newReport);
  };

  const handleExpectationTextChange = (text: string) => {
    setExpectationText(text);
  };

  const handleSegmentAnalyze = async (tStart: number, tEnd: number) => {
    if (!fileId) return;

    setIsSegmentAnalyzing(true);
    try {
      const response = await fetch("/api/segmentAnalyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId,
          expectationText,
          tStart,
          tEnd,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Segment analysis failed");
      }

      const updatedReport: RealityDebugReport = await response.json();
      setReport(updatedReport);
    } catch (error: any) {
      console.error("Segment analysis error:", error);
      alert(`Failed to re-analyze segment: ${error.message}`);
    } finally {
      setIsSegmentAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Reality Debugger</h1>
          <p className="text-gray-600">
            Analyze failure videos with multimodal AI to discover root causes, counterfactuals, and minimal fixes
          </p>
        </div>

        <UploadPanel
          onFileUploaded={handleFileUploaded}
          onAnalysisComplete={handleAnalysisComplete}
          onExpectationTextChange={handleExpectationTextChange}
        />

        {report && (
          <>
            <OutputPanels report={report} />
            <Timeline
              videoDuration={videoDuration}
              onSegmentAnalyze={handleSegmentAnalyze}
              isAnalyzing={isSegmentAnalyzing}
            />
          </>
        )}
      </div>
    </main>
  );
}
