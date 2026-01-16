import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { existsSync } from "fs";
import { analyzeVideo } from "@/lib/gemini";
import { validateReport, retryWithRepair } from "@/lib/validate";

const UPLOAD_DIR = join(process.cwd(), "uploads");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId, expectationText } = body;

    if (!fileId || !expectationText) {
      return NextResponse.json(
        { error: "fileId and expectationText are required" },
        { status: 400 }
      );
    }

    if (expectationText.length < 10) {
      return NextResponse.json(
        { error: "expectationText must be at least 10 characters" },
        { status: 400 }
      );
    }

    // Find the uploaded file
    let filePath: string | null = null;
    if (existsSync(UPLOAD_DIR)) {
      const fs = await import("fs");
      const files = await fs.promises.readdir(UPLOAD_DIR);
      const matchingFile = files.find((f) => f.startsWith(fileId));
      if (matchingFile) {
        filePath = join(UPLOAD_DIR, matchingFile);
      }
    }

    if (!filePath || !existsSync(filePath)) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Call Gemini API
    let report;
    try {
      report = await analyzeVideo(filePath, expectationText);
    } catch (error: any) {
      console.error("Gemini API error:", error);
      return NextResponse.json(
        { error: `Analysis failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Validate response
    if (!validateReport(report)) {
      console.warn("Invalid report structure, attempting repair...");
      try {
        report = await retryWithRepair(
          filePath,
          expectationText,
          "Report did not match schema"
        );
      } catch (repairError: any) {
        return NextResponse.json(
          { error: `Validation failed and repair failed: ${repairError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
