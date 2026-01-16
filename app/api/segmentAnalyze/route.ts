import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { existsSync } from "fs";
import { analyzeSegment } from "@/lib/gemini";
import { validateReport } from "@/lib/validate";

const UPLOAD_DIR = join(process.cwd(), "uploads");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId, expectationText, tStart, tEnd } = body;

    if (!fileId || !expectationText || typeof tStart !== "number" || typeof tEnd !== "number") {
      return NextResponse.json(
        { error: "fileId, expectationText, tStart, and tEnd are required" },
        { status: 400 }
      );
    }

    if (tStart >= tEnd || tStart < 0) {
      return NextResponse.json(
        { error: "Invalid time window: tStart must be < tEnd and >= 0" },
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

    // Call Gemini API with Flash model for speed
    let report;
    try {
      report = await analyzeSegment(filePath, expectationText, tStart, tEnd);
    } catch (error: any) {
      console.error("Gemini API error:", error);
      return NextResponse.json(
        { error: `Segment analysis failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Validate response
    if (!validateReport(report)) {
      return NextResponse.json(
        { error: "Invalid report structure from segment analysis" },
        { status: 500 }
      );
    }

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Segment analysis error:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
