"use client";

import { useState } from "react";
import { RealityDebugReport } from "@/lib/schema";

interface UploadPanelProps {
  onAnalysisComplete: (report: RealityDebugReport) => void;
  onFileUploaded: (fileId: string, duration: number) => void;
  onExpectationTextChange: (text: string) => void;
}

export default function UploadPanel({ onAnalysisComplete, onFileUploaded, onExpectationTextChange }: UploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [expectationText, setExpectationText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("video/") && !selectedFile.name.toLowerCase().endsWith(".mp4")) {
        setError("Please select an MP4 video file");
        return;
      }
      setFile(selectedFile);
      setError(null);
      
      // Get video duration
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;
        setVideoDuration(duration);
      };
      video.src = URL.createObjectURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      setFileId(data.fileId);
      onFileUploaded(data.fileId, videoDuration || data.duration || 0);
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!fileId) {
      setError("Please upload a file first");
      return;
    }

    if (expectationText.length < 10) {
      setError("Expectation text must be at least 10 characters");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId,
          expectationText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Analysis failed");
      }

      const report: RealityDebugReport = await response.json();
      onAnalysisComplete(report);
    } catch (err: any) {
      setError(err.message || "Failed to analyze video");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Reality Debugger</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Upload Failure Video (MP4, 10-30s)</label>
          <input
            type="file"
            accept="video/mp4"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={isUploading || isAnalyzing}
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {file && !fileId && (
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        )}

        {fileId && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Expectation (what should have happened)
            </label>
            <textarea
              value={expectationText}
              onChange={(e) => {
                setExpectationText(e.target.value);
                onExpectationTextChange(e.target.value);
              }}
              placeholder="e.g., Soufflé should rise steadily for first 15 minutes and stay tall after removing from oven"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              disabled={isAnalyzing}
            />
            <p className="mt-1 text-xs text-gray-500">
              {expectationText.length}/10 minimum characters
            </p>
          </div>
        )}

        {fileId && expectationText.length >= 10 && (
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
          >
            {isAnalyzing ? "Analyzing..." : "Analyze"}
          </button>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
