# Quick Setup Guide

## 1. Install Dependencies

```bash
cd reality-debugger
npm install
```

## 2. Configure Environment

Create a `.env.local` file in the `reality-debugger` directory:

```
GEMINI_API_KEY=your_api_key_here
```

Get your API key from: https://ai.google.dev/

## 3. Run Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

## 4. Test the Application

1. Upload a 10-30 second MP4 video showing a cooking failure (e.g., collapsed soufflé)
2. Enter an expectation (e.g., "Soufflé should rise steadily for first 15 minutes and stay tall after removing from oven")
3. Click "Analyze" and wait for results
4. Try the timeline scrub feature to re-analyze specific segments

## Project Structure

- `app/` - Next.js App Router pages and API routes
- `lib/` - Core logic (Gemini integration, schema, validation)
- `public/` - Static assets (demo video goes here)

## Troubleshooting

- **"GEMINI_API_KEY not set"**: Make sure `.env.local` exists with your API key
- **Upload fails**: Check file size (max 50MB) and format (MP4)
- **Analysis fails**: Verify your API key is valid and has access to Gemini 3 models
- **Build errors**: Run `npm install` again to ensure all dependencies are installed
