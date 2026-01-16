# Reality Debugger

A multimodal failure-investigation application that analyzes cooking failure videos using Gemini 3 API. The app generates causal root-cause chains, counterfactuals, minimal fixes, and expectation-vs-reality timelines with low-latency timeline scrubbing capabilities.

## Features

- **Multimodal Video Analysis**: Upload MP4 videos (10-30 seconds) with audio and text expectations
- **Root Cause Chain**: Step-by-step causal analysis with evidence links
- **Counterfactuals**: Three "what-if" scenarios showing how changes would affect the outcome
- **Minimal Intervention**: Smallest viable fix recommendation
- **Timeline Analysis**: Expectation vs reality comparison with divergence scores
- **Interactive Scrubbing**: Re-analyze specific time segments with low-latency updates

## Tech Stack

- **Next.js 14** (App Router) with TypeScript
- **Gemini 3 Pro** for full multimodal analysis
- **Gemini 3 Flash** for fast segment re-analysis
- **Structured Outputs** with JSON schema validation
- **Tailwind CSS** for styling

## Prerequisites

- Node.js 18+ and npm
- Gemini API key from [Google AI Studio](https://ai.google.dev/)

## Getting Started

### 1. Install Dependencies

```bash
cd reality-debugger
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
GEMINI_API_KEY=your_api_key_here
```

Get your API key from [https://ai.google.dev/](https://ai.google.dev/)

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

## How to Use

1. **Upload Video**: Select an MP4 video file (10-30 seconds recommended)
2. **Enter Expectation**: Describe what should have happened (e.g., "Soufflé should rise steadily for first 15 minutes and stay tall after removing from oven")
3. **Analyze**: Click "Analyze" to generate the full report
4. **Review Results**: 
   - Root cause chain with evidence links
   - Three counterfactuals
   - Minimal intervention recommendation
   - Timeline with divergence scores
5. **Scrub Timeline**: Select a time window and click "Re-check Segment" for fast re-analysis

## Demo Video

To test the application, you'll need a demo video showing a cooking failure (e.g., collapsed soufflé or cake that didn't rise). See `DEMO_VIDEO_INSTRUCTIONS.md` for details on creating or obtaining a demo video.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add environment variable `GEMINI_API_KEY` in Vercel dashboard
4. Deploy!

Vercel will automatically detect Next.js and configure the build settings.

### Environment Variables

Make sure to set `GEMINI_API_KEY` in your deployment environment.

## Project Structure

```
reality-debugger/
  app/
    page.tsx                    # Main UI page
    layout.tsx                   # Root layout
    globals.css                  # Global styles
    components/
      UploadPanel.tsx           # File upload + expectation input
      Timeline.tsx              # Timeline slider + scrub controls
      OutputPanels.tsx          # Root cause, counterfactuals, minimal fix
    api/
      upload/route.ts           # Handle video upload
      analyze/route.ts          # Full analysis with Gemini 3 Pro
      segmentAnalyze/route.ts   # Fast segment re-analysis with Flash
  lib/
    gemini.ts                   # Gemini API client wrapper
    schema.ts                   # JSON schema definitions
    validate.ts                 # Schema validation + retry logic
  public/
    demo.mp4                    # Demo video (optional)
  package.json
  tsconfig.json
  next.config.js
  README.md
```

## Gemini Integration

Gemini 3 is used as the core multimodal investigator. The app uploads a real-world failure video (with audio) plus a user-written "expectation" of what should have happened. A Gemini 3 Pro call performs joint perception and causal reasoning across modalities, generating a schema-validated JSON report containing: timestamped observations, an explicit root-cause reasoning chain grounded to those observations, three counterfactual simulations, a minimal intervention recommendation, and an expectation-vs-reality divergence timeline. Outputs are enforced using Gemini structured outputs (`response_mime_type: application/json` + `response_json_schema`) to guarantee predictable UI rendering and prevent generic freeform responses. For interactive "timeline scrubbing," the app makes faster Gemini 3 Flash calls with constrained thinking (`thinking_level: low/minimal`) to re-check a selected time window and update evidence/timeline quickly. This design cannot be replaced by a text-only LLM because it depends on native multimodal understanding (video+audio+text together) and schema-locked, low-latency iterative analysis.

## License

MIT
