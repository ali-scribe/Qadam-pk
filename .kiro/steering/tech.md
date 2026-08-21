# Qadam — Tech Steering

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js (App Router) | File-based routing, API routes, Vercel-native |
| Language | TypeScript | Type safety for AI response shapes and pipeline state |
| Styling | Tailwind CSS | Utility-first, no runtime overhead, fast iteration |
| AI | Google Gemini API | Multimodal (reads document images), free tier sufficient for MVP |
| Deployment | Vercel | Free tier, zero-config Next.js deployment |
| Persistence | localStorage | Client-side only, no server-side storage needed |

## Project Structure

```
src/
  app/
    page.tsx              # Main entry — upload and pipeline UI
    layout.tsx            # Root layout
    api/
      analyze/route.ts    # Stage 1: document analysis API route
      plan/route.ts       # Stage 2: action plan API route
  components/             # UI components
  lib/
    gemini.ts             # Gemini API client wrapper
    prompts.ts            # All prompt templates
    types.ts              # Shared TypeScript types for pipeline data shapes
    storage.ts            # localStorage utilities
  hooks/                  # Custom React hooks
```

## AI Pipeline Architecture

Qadam uses exactly two AI calls per user session:

**Stage 1 — Document Analysis** (`/api/analyze`)
- Input: base64-encoded document image
- Output: structured JSON (document type, eligibility criteria, required documents, deadlines, fees, steps, warnings, unknown fields, questions to ask the user)
- Runs once, immediately after upload

**Stage 2 — Reasoning and Action Plan** (`/api/plan`)
- Input: Stage 1 JSON output + user's answers to the generated questions
- Output: structured JSON (eligibility verdict, satisfied/unmet/unknown criteria, ordered action items)
- Runs once, after the user submits their answers

Do not add additional AI calls for sub-tasks, rephrasing, or UI polish. Every AI call has a cost and latency cost. If a task can be handled in the existing two calls, handle it there.

## Gemini API Usage

- All Gemini API calls must be made server-side via Next.js API routes
- The API key must never be exposed to the client
- Store the API key in `.env.local` as `GEMINI_API_KEY`
- Use the `@google/generative-ai` SDK
- Use `gemini-3.6-flash` as the default model (fast, free-tier compatible, multimodal)
- Request structured JSON output using Gemini's `responseMimeType: "application/json"` and `responseSchema` where supported, or instruct JSON output via the prompt with explicit schema
- Always validate the structure of Gemini's response before using it — never assume the shape is correct

## TypeScript Conventions

- Define explicit types for all AI input/output shapes in `lib/types.ts`
- Do not use `any` — use `unknown` and narrow with type guards where AI output shape is uncertain
- API route handlers must be typed with `NextRequest` and `NextResponse`
- React component props must be typed with explicit interfaces, not inferred from usage

## Tailwind CSS Conventions

- Use Tailwind utility classes directly — no CSS modules, no `styled-components`
- Do not install a component library (shadcn, MUI, Chakra, etc.) unless it saves significant time on a specific problem and adds no runtime overhead
- Keep a consistent design token usage: use Tailwind's default color scale, avoid arbitrary values (`[#abc123]`) unless truly necessary
- Dark mode is not required for MVP

## State Management

- Use React `useState` and `useReducer` for local component state
- Use React Context for pipeline-wide state (current stage, extraction result, user answers, action plan)
- Do not install a state management library (Zustand, Redux, Jotai, etc.) for MVP
- Persist Stage 1 and Stage 2 outputs to localStorage so the user can return after a refresh
- Do not persist the uploaded image or sensitive personal answers

## API Route Conventions

- Each API route lives at `src/app/api/<name>/route.ts`
- Routes should validate their inputs and return structured error responses
- Use HTTP status codes correctly (400 for bad input, 500 for server/AI failure, 200 for success)
- Return JSON from every route, even on errors: `{ error: string }`
- Do not leak internal error details (stack traces, API keys) in responses

## Error Handling

- Every AI call must have a try/catch with a meaningful fallback
- If the Gemini API fails, return a clear error to the UI — do not show a blank screen
- If the AI returns malformed JSON, catch the parse error and surface it as a recoverable error state
- If the document is unreadable, the Stage 1 response should include a flag indicating this — the UI must handle it gracefully
- Never silently swallow errors

## Dependencies

- Keep dependencies minimal
- Before adding a package, ask: can this be done with ~10 lines of code instead?
- Prefer packages that are actively maintained and widely used
- Use exact versions in `package.json` — avoid open ranges (`^`, `~`) for AI SDK and critical dependencies
- Do not install testing libraries, ORMs, auth libraries, or database drivers

## Deployment

- Deploy to Vercel on the free (Hobby) tier
- Set `GEMINI_API_KEY` as an environment variable in the Vercel project settings
- API routes run as Vercel Serverless Functions — keep them stateless
- The default function timeout on Vercel Hobby is 10 seconds — Gemini calls should complete within this limit; if they do not, restructure the prompt or reduce image size before considering a timeout increase
- No Docker, no custom server, no database connection strings needed

## What Not to Do

- Do not add authentication (NextAuth, Clerk, etc.)
- Do not add a database (Prisma, Drizzle, Supabase, etc.)
- Do not add an ORM
- Do not add a separate backend service
- Do not use React class components
- Do not use `pages/` router — use App Router only
- Do not add unnecessary abstraction layers — keep the codebase flat and readable
- Do not store secrets in source code or commit `.env.local`
