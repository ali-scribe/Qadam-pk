# Design Document

## Overview

Qadam is a single-page Next.js application. The user uploads a document image, the application makes two sequential server-side calls to the Gemini API, and the result is a personalized eligibility verdict with an evidence-backed action plan. There is no database, no authentication, and no server-side state. All pipeline state lives in the browser.

The architecture is a deliberate straight line:

```
Browser (React UI)
  → Next.js API route (/api/analyze)
    → Gemini API (Stage 1: document analysis)
    → validated DocumentAnalysis JSON
  → Browser (renders summary + questions form)
  → Next.js API route (/api/plan)
    → Gemini API (Stage 2: eligibility reasoning)
    → validated ActionPlan JSON
  → Browser (renders verdict + action plan)
```

No additional hops. No background jobs. No queues. No external storage.

---

## Project Structure

```
src/
  app/
    page.tsx                  # Single page — renders the active pipeline step
    layout.tsx                # Root layout — fonts, metadata, Tailwind base
    globals.css               # Tailwind directives only
    api/
      analyze/
        route.ts              # POST — Stage 1: document analysis
      plan/
        route.ts              # POST — Stage 2: eligibility reasoning + action plan
  components/
    UploadStep.tsx            # File input, validation, compression, submission
    SummaryStep.tsx           # Extracted document information display
    QuestionsStep.tsx         # Dynamic profile questions form
    PlanStep.tsx              # Eligibility verdict + ordered action plan
    EvidenceBlock.tsx         # Inline blockquote for source excerpts
    ErrorMessage.tsx          # Reusable error + retry UI
    LoadingSpinner.tsx        # Reusable loading indicator
  context/
    PipelineContext.tsx       # React Context — pipeline state and transitions
  lib/
    gemini.ts                 # Gemini API client wrapper (server-side only)
    prompts.ts                # All prompt templates for Stage 1 and Stage 2
    types.ts                  # DocumentAnalysis and ActionPlan TypeScript types
    storage.ts                # localStorage read/write utilities
    validate.ts               # Runtime shape validators for AI output
  hooks/
    usePipeline.ts            # Convenience hook for consuming PipelineContext
.env.local                    # GEMINI_API_KEY (never committed)
```

---

## Page Structure

`src/app/page.tsx` is the only page. It reads the current pipeline step from `PipelineContext` and conditionally renders one of four step components. No routing is needed. No URL changes occur between steps.

```
PipelineContext.stage === 'upload'    → <UploadStep />
PipelineContext.stage === 'summary'   → <SummaryStep />
PipelineContext.stage === 'questions' → <QuestionsStep />
PipelineContext.stage === 'plan'      → <PlanStep />
```

The page is wrapped in a centered, max-width container (`max-w-2xl mx-auto px-4`) so it is readable on both mobile and desktop without separate layout work.

`layout.tsx` sets the HTML lang, page title ("Qadam — Your Document, Decoded"), and includes the disclaimer that Qadam is not a legal advisor in the site metadata.

---

## Component Design

### UploadStep

Responsibilities:
- Render `<input type="file" accept="image/jpeg,image/png,image/webp,image/gif">`
- Validate file type and size (≤ 10 MB) on selection, before submission
- Compress image to ≤ 1 MB using the Canvas API if needed
- Encode to base64 and `POST` to `/api/analyze`
- Show loading state while Stage 1 runs
- Display API errors inline with a retry path

File validation happens in the `onChange` handler before any state updates. Compression uses `HTMLCanvasElement.toBlob()` with iteratively reduced quality until the encoded size is ≤ 1 MB. No third-party image library needed.

### SummaryStep

Responsibilities:
- Display `documentType` and `purpose` from `DocumentAnalysis`
- Handle three states: unreadable document, out-of-scope document, normal extraction
- Render each extracted field (eligibility criteria, required documents, deadlines, fees, steps, warnings) with null/empty-array handling
- Render `<EvidenceBlock>` for each field that has a non-null evidence string
- Show "Not stated in document" for null values
- Show "None found in document" for empty arrays
- Render "Continue to questions" button to advance to QuestionsStep

### QuestionsStep

Responsibilities:
- Render a form from `DocumentAnalysis.questionsForUser` — one field per question
- Mark required questions with an asterisk
- Validate required fields before submission
- `POST` to `/api/plan` with `DocumentAnalysis` + answers
- Show loading state while Stage 2 runs
- Display API errors inline with retry

Each question in `questionsForUser` has a `fieldType` field (`"text"` | `"number"` | `"select"` | `"boolean"`). The QuestionsStep renders the appropriate input element based on this field. No question type is hardcoded — the component reads the type from the data.

### PlanStep

Responsibilities:
- Display eligibility verdict with distinct color treatment per verdict value
- Display verdict rationale
- Display disclaimer (Qadam is not a legal advisor)
- Display satisfied, unmet, and unknown criteria in labeled sections
- Render ordered action items, numbered from 1
- Render `<EvidenceBlock>` for action items with evidence
- Display deadline on each action item when present
- Render "Start over" button to reset pipeline

Verdict color mapping:
- `likely_eligible` → green (`bg-green-50 border-green-500 text-green-800`)
- `likely_not_eligible` → red (`bg-red-50 border-red-500 text-red-800`)
- `cannot_determine` → amber (`bg-amber-50 border-amber-500 text-amber-800`)

### EvidenceBlock

A single-purpose component that renders an expandable/collapsible inline blockquote. Used in both SummaryStep and PlanStep.

Props:
```typescript
interface EvidenceBlockProps {
  evidence: string;
  label?: string; // defaults to "View source"
}
```

When collapsed: renders a small button ("View source") styled as a text link with an expand icon.
When expanded: renders the evidence text in a left-bordered blockquote with muted italic text, with a "Hide source" toggle.

State is local to the component — no lifting needed.

### ErrorMessage

Props:
```typescript
interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;    // renders "Try again" button when provided
  onBack?: () => void;     // renders "Go back" button when provided
}
```

Styled as a red-tinted inline alert (`bg-red-50 border border-red-300 text-red-700`). Appears within the current step, not as an overlay or toast.

### LoadingSpinner

A simple animated spinner with an accessible `role="status"` and `aria-label`. Used inside UploadStep and QuestionsStep while API calls are pending.

---

## Pipeline State (PipelineContext)

`PipelineContext` holds all cross-step state and exposes a typed API for transitions.

```typescript
type PipelineStage = 'upload' | 'summary' | 'questions' | 'plan';

interface PipelineState {
  stage: PipelineStage;
  documentAnalysis: DocumentAnalysis | null;
  userAnswers: Record<string, string> | null;
  actionPlan: ActionPlan | null;
}

interface PipelineContextValue extends PipelineState {
  setDocumentAnalysis: (result: DocumentAnalysis) => void;
  setUserAnswers: (answers: Record<string, string>) => void;
  setActionPlan: (plan: ActionPlan) => void;
  goTo: (stage: PipelineStage) => void;
  reset: () => void;
}
```

On mount, `PipelineContext` reads from localStorage via `Storage_Util`. If both keys are present and parseable, it restores to the appropriate stage. If localStorage throws or contains invalid data, it silently clears both keys and starts at `'upload'`.

`userAnswers` is never written to localStorage. Only `documentAnalysis` and `actionPlan` are persisted.

---

## localStorage Schema

Two keys, both storing serialized JSON strings:

| Key | Value type | When written | When cleared |
|---|---|---|---|
| `qadam_document_analysis` | `DocumentAnalysis` as JSON string | After Stage 1 success | On `reset()` |
| `qadam_action_plan` | `ActionPlan` as JSON string | After Stage 2 success | On `reset()` |

`storage.ts` exposes four functions:
```typescript
saveDocumentAnalysis(data: DocumentAnalysis): void
loadDocumentAnalysis(): DocumentAnalysis | null
saveActionPlan(data: ActionPlan): void
loadActionPlan(): ActionPlan | null
clearAll(): void
```

Each load function wraps `JSON.parse` in a try/catch and returns `null` on failure. The caller (PipelineContext) decides what to do with a null result.

---

## TypeScript Types (lib/types.ts)

### DocumentAnalysis

```typescript
export interface EligibilityCriterion {
  id: string;
  description: string;
  evidence: string | null;
}

export interface RequiredDocument {
  id: string;
  description: string;
  evidence: string | null;
}

export interface Deadline {
  label: string;
  date: string | null;       // null = not stated in document
  evidence: string | null;
}

export interface Fee {
  label: string;
  amount: string | null;     // null = not stated in document
  evidence: string | null;
}

export interface ApplicationStep {
  order: number;
  description: string;
  evidence: string | null;
}

export interface Warning {
  description: string;
  evidence: string | null;
}

export interface ProfileQuestion {
  id: string;
  question: string;
  fieldType: 'text' | 'number' | 'select' | 'boolean';
  options?: string[];        // only for fieldType === 'select'
  required: boolean;
  relevantCriterionId: string;
}

export interface DocumentAnalysis {
  readable: boolean;
  documentScope: 'in_scope' | 'out_of_scope';
  documentType: string | null;
  purpose: string | null;
  eligibilityCriteria: EligibilityCriterion[];
  requiredDocuments: RequiredDocument[];
  deadlines: Deadline[];
  fees: Fee[];
  applicationSteps: ApplicationStep[];
  warnings: Warning[];
  unknownFields: string[];
  questionsForUser: ProfileQuestion[];
}
```

### ActionPlan

```typescript
export interface SatisfiedCriterion {
  text: string;
  evidence: string | null;
}

export interface UnmetCriterion {
  text: string;
  reason: string;
  evidence: string | null;
}

export interface UnknownCriterion {
  text: string;
  evidence: string | null;
}

export interface ActionItem {
  title: string;
  description: string;
  evidence: string | null;
  deadline: string | null;
}

export type EligibilityVerdict =
  | 'likely_eligible'
  | 'likely_not_eligible'
  | 'cannot_determine';

export interface ActionPlan {
  eligibilityVerdict: EligibilityVerdict;
  verdictRationale: string;
  satisfiedCriteria: SatisfiedCriterion[];
  unmetCriteria: UnmetCriterion[];
  unknownCriteria: UnknownCriterion[];
  actionItems: ActionItem[];
}
```

---

## Runtime Validation (lib/validate.ts)

Because Gemini is not fully guaranteed to return the declared schema, every API route validates the response before returning it to the client. Validation uses plain TypeScript type guards — no Zod, no external schema library.

### isDocumentAnalysis

Checks:
- `readable` is boolean
- `documentScope` is `'in_scope'` or `'out_of_scope'`
- `documentType` is string or null
- `purpose` is string or null
- All eight array fields (`eligibilityCriteria`, `requiredDocuments`, `deadlines`, `fees`, `applicationSteps`, `warnings`, `unknownFields`, `questionsForUser`) are actual arrays
- Each item in `eligibilityCriteria`, `requiredDocuments`, `deadlines`, `fees` has an `evidence` key (missing keys are coerced to `null` before validation)

### isActionPlan

Checks:
- `eligibilityVerdict` is one of the three literal strings
- `verdictRationale` is a string
- `satisfiedCriteria`, `unmetCriteria`, `unknownCriteria`, `actionItems` are arrays
- Each element of each array has all required fields with correct types

If validation fails, the route returns HTTP 500 with `{ "error": "AI returned an unrecognized response structure. Please try again." }`. The raw Gemini response is never forwarded to the client.

---

## API Routes

### POST /api/analyze

**Input:**
```typescript
{ imageBase64: string; mimeType: string }
```

**Flow:**
1. Validate that `imageBase64` is a non-empty string and `mimeType` is one of the accepted types. Return HTTP 400 if not.
2. Call `gemini.analyzeDocument(imageBase64, mimeType)` with a 9-second timeout.
3. Parse the response as JSON. Return HTTP 500 if parse fails.
4. Run `isDocumentAnalysis()` validation. Return HTTP 500 if invalid.
5. Normalize missing `evidence` keys to `null` on all array items.
6. Return HTTP 200 with the validated `DocumentAnalysis` object.

**Error responses:**
- `400` — missing or invalid input
- `500` — invalid AI response shape or JSON parse failure
- `502` — Gemini API returned non-2xx
- `504` — Gemini call timed out

### POST /api/plan

**Input:**
```typescript
{ documentAnalysis: DocumentAnalysis; userAnswers: Record<string, string> }
```

**Flow:**
1. Validate that `documentAnalysis` conforms to `DocumentAnalysis` type. Return HTTP 400 if not.
2. Validate that `userAnswers` is a non-null object. Return HTTP 400 if not.
3. Call `gemini.generatePlan(documentAnalysis, userAnswers)` with a 9-second timeout.
4. Parse the response as JSON. Return HTTP 500 if parse fails.
5. Run `isActionPlan()` validation. Return HTTP 500 if invalid.
6. Return HTTP 200 with the validated `ActionPlan` object.

**Error responses:**
- `400` — missing or invalid input
- `500` — invalid AI response shape or JSON parse failure
- `502` — Gemini API returned non-2xx
- `504` — Gemini call timed out

---

## Gemini API Integration (lib/gemini.ts)

All Gemini calls are made server-side. The API key is read from `process.env.GEMINI_API_KEY` — it is never imported into any client-side module.

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    responseMimeType: 'application/json',
  },
});
```

`gemini.ts` exports two functions:
- `analyzeDocument(imageBase64: string, mimeType: string): Promise<unknown>`
- `generatePlan(analysis: DocumentAnalysis, answers: Record<string, string>): Promise<unknown>`

Both return `unknown`. The API route is responsible for parsing and validating the result. Neither function throws a user-facing error — they let the raw Gemini SDK error propagate to the route, which catches it.

The 9-second timeout is implemented by wrapping the Gemini call in a `Promise.race` against a `setTimeout` that rejects with a timeout signal. The route catches the timeout signal and returns HTTP 504.

---

## Prompt Design (lib/prompts.ts)

Both prompts are plain TypeScript template literals. They are the most important code in the application — they directly control what Qadam extracts and how it reasons.

### Stage 1 Prompt — Key Instructions

The prompt must include all of the following, in substance:

1. **Identity framing** — "You are analyzing a document image from Pakistan. The document may be in English, Urdu, or a mix of both."
2. **Extraction instruction** — List every field in `DocumentAnalysis` with its type and a brief description.
3. **Null discipline** — "If a field's value is not stated in the document, set it to `null`. Do not guess, infer, or fabricate values. Only state what the document explicitly says."
4. **Readability check** — "If the image is too blurry, dark, or unclear to extract meaningful information, set `readable` to `false` and all other fields to `null` or empty arrays."
5. **Scope check** — "If the image does not appear to be an institutional document (scholarship, government service, university, or similar), set `documentScope` to `'out_of_scope'`."
6. **Evidence discipline** — "For every `evidence` field, copy a verbatim excerpt from the document text that directly supports the extracted value. If you cannot identify a specific excerpt, set `evidence` to `null`."
7. **Question generation** — "Generate only the questions whose answers are necessary to assess eligibility for this specific document. Do not generate generic profile questions. For each question, include the `id`, `question` text, `fieldType`, and `required` flag."
8. **Schema** — The complete JSON schema of `DocumentAnalysis` is embedded in the prompt as a JSON object, so Gemini has an unambiguous target structure.

### Stage 2 Prompt — Key Instructions

1. **Input framing** — Embed the full `DocumentAnalysis` JSON and the user's answers as structured data.
2. **Eligibility assessment** — "Based only on the extracted criteria and the user's answers, determine whether the user appears to be eligible. Use `'cannot_determine'` if the available information is insufficient."
3. **Criterion classification** — "For each eligibility criterion: if the user's answer confirms it, mark as satisfied; if the answer shows the criterion is not met, mark as unmet; if the answer is missing or ambiguous, mark as unknown. Never mark a criterion as satisfied without a confirming answer."
4. **Action plan ordering** — "Order action items by urgency and dependency: deadline-driven items first, prerequisite documents before the steps that require them."
5. **Unknown discipline** — "If a required document or step has no stated deadline, set `deadline` to `null`. Do not invent dates."
6. **Schema** — The complete JSON schema of `ActionPlan` is embedded in the prompt.

---

## Evidence Representation

Evidence is a `string | null` field on every extracted item. The design guarantees the following:

- The prompt instructs Gemini to use verbatim text from the document.
- The API route normalizes missing `evidence` keys to `null` before returning.
- The UI suppresses the "View source" button for any item where `evidence` is `null` or `""`.
- The `EvidenceBlock` component renders evidence text in a visually distinct blockquote that is clearly differentiated from Qadam-generated text.

This means the UI never shows a broken "View source" button and never displays a blank evidence panel. Either the button exists with real content behind it, or it does not appear at all.

---

## Uncertainty Representation

The design uses three mechanisms to represent uncertainty honestly:

**1. Null fields with explicit labels**
Any `DocumentAnalysis` field that is `null` renders as "Not stated in document" — never as a blank, dash, or guessed value. This applies to deadlines, fees, eligibility criterion values, and purpose.

**2. Empty arrays with explicit labels**
Any array field that is `[]` renders as "None found in document" rather than an empty section.

**3. The `unknownFields` array**
Stage 1 returns an array of field names that could not be determined. The SummaryStep renders this list under "Could not determine from document" when non-empty.

**4. The `cannot_determine` verdict**
Stage 2 can return `cannot_determine` as the eligibility verdict. This is a first-class outcome with its own visual treatment — it is not an error and not a failure.

**5. `unknownCriteria` section**
Criteria that could not be assessed from the user's answers are placed in `unknownCriteria` — never in `satisfiedCriteria`. The PlanStep renders this section with a label that makes the uncertainty explicit.

---

## Error Handling

All errors are recoverable. No error leaves the user on a blank screen.

| Scenario | Route behaviour | UI behaviour |
|---|---|---|
| Invalid file type/size | n/a — caught client-side | Inline error, file selection cleared |
| No file selected | n/a — caught client-side | Inline validation message |
| Gemini returns non-2xx | Route returns 502 + error message | ErrorMessage component + retry button |
| Gemini call times out | Route returns 504 + message | ErrorMessage component + retry button |
| Gemini returns invalid JSON | Route catches parse error, returns 500 | ErrorMessage component + retry button |
| Gemini response fails validation | Route returns 500 + message | ErrorMessage component + retry button |
| Network error (no response) | fetch() throws | ErrorMessage with "check your connection" + retry |
| localStorage read failure | PipelineContext catches, clears, resets | Pipeline starts at UploadStep silently |

Error messages shown to users come from the route's `{ "error": string }` response body. If the field is absent, the UI falls back to "Something went wrong. Please try again."

Raw stack traces, API keys, and internal error objects are never included in any response body.

---

## API Key Security

- `GEMINI_API_KEY` is stored in `.env.local` for local development and in Vercel environment variables for production.
- `.env.local` is listed in `.gitignore` and is never committed.
- `gemini.ts` is imported only by the two API routes, which are server-side modules. Next.js never bundles server-side modules into the client.
- No client component imports from `gemini.ts` or `prompts.ts` directly.
- The API routes never echo the key in any response field.

---

## Mobile Layout

The application uses a single-column Tailwind layout. The outer container is `max-w-2xl mx-auto px-4 py-8`. All interactive elements use `min-h-[44px]` to meet touch-target requirements. Text never goes below `text-sm`.

No media query overrides are needed. The layout is naturally single-column and adapts to any width from 375px upward by default.

---

## Testing Strategy

### Manual Pre-Demo Checklist

Before any public demonstration, verify:

- Upload a clear scholarship document → Stage 1 returns structured data
- Upload a blurry image → SummaryStep shows "could not read" message with retry
- Upload a non-document image (e.g. a photo) → SummaryStep shows "unsupported document" message
- Upload a PDF or DOCX → UploadStep rejects it inline before any API call
- Upload a file over 10 MB → UploadStep rejects it inline
- Complete the full pipeline → Action plan renders with "View source" buttons working
- Click every "View source" button → Correct blockquote appears inline
- Disable network mid-session → Error message appears with retry option
- Refresh mid-session → Pipeline restores from localStorage at correct step
- Click "Start over" → localStorage cleared, UploadStep shown
- Run `next build` → Zero TypeScript errors, zero ESLint errors
- Open at 375px in Chrome devtools → No horizontal scroll, all elements reachable
- Deploy to Vercel → Live URL completes a full pipeline run

### Regression Triggers

Any change to the following files requires a full end-to-end manual retest:

- `lib/prompts.ts` — prompt changes affect all AI output
- `lib/types.ts` — type changes affect validation logic
- `lib/validate.ts` — validation changes affect what reaches the UI
- `app/api/analyze/route.ts` — Stage 1 route
- `app/api/plan/route.ts` — Stage 2 route
- `components/EvidenceBlock.tsx` — evidence rendering

---

## Deployment

Deployment is zero-config Vercel. The repository connects to a Vercel project. Every push to `main` triggers a deployment.

**Environment variable to set in Vercel project settings:**
```
GEMINI_API_KEY = <your key>
```

No other environment variables are required.

**Build command:** `next build` (Vercel default)
**Output directory:** `.next` (Vercel default)
**Node.js version:** 18.x or 20.x (both compatible with Next.js 14+)

The two API routes deploy as Vercel Serverless Functions. They are stateless — no file system writes, no shared memory between invocations. Each request is independent.

The Gemini calls target a 9-second client-side timeout, leaving 1 second of margin within Vercel Hobby's 10-second function limit. If latency exceeds this in practice, the first mitigation is reducing the image size on the client before sending, not increasing the timeout.
