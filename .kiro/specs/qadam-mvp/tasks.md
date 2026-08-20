# Tasks Document

## Task List

### Task 1: Next.js Project Foundation

Set up the Next.js project with TypeScript, Tailwind CSS, and the correct configuration for the Qadam MVP.

- [ ] 1.1 Scaffold a new Next.js project using `create-next-app` with the App Router, TypeScript, Tailwind CSS, and ESLint enabled. Use the project name `qadam`.
- [ ] 1.2 Verify `tsconfig.json` has `"strict": true` enabled. Add it if missing.
- [ ] 1.3 Remove all default Next.js boilerplate from `src/app/page.tsx` and `src/app/globals.css`. `page.tsx` should render only a placeholder `<main>` element. `globals.css` should contain only the three Tailwind directives (`@tailwind base`, `@tailwind components`, `@tailwind utilities`).
- [ ] 1.4 Add `.env.local` to `.gitignore` if not already present. Create `.env.local` with a placeholder line `GEMINI_API_KEY=` (no value).
- [ ] 1.5 Install the `@google/generative-ai` package. Pin to an exact version (no `^` or `~`).
- [ ] 1.6 Run `next build`. Confirm zero TypeScript errors and zero ESLint errors.

**Testable outcome:** `next build` succeeds. `next dev` starts on localhost:3000 and shows a blank page with no console errors.

---

### Task 2: Application Shell

Create the top-level layout and the pipeline context skeleton before any feature UI is built.

- [ ] 2.1 Create `src/app/layout.tsx`. Set `lang="en"` on the `<html>` element. Set the page `<title>` to `"Qadam — Your Document, Decoded"`. Import `globals.css`. Wrap `children` in a `<body>` with a `max-w-2xl mx-auto px-4 py-8` container.
- [ ] 2.2 Create `src/lib/types.ts`. Define and export all TypeScript interfaces exactly as specified in the design document: `EligibilityCriterion`, `RequiredDocument`, `Deadline`, `Fee`, `ApplicationStep`, `Warning`, `ProfileQuestion`, `DocumentAnalysis`, `SatisfiedCriterion`, `UnmetCriterion`, `UnknownCriterion`, `ActionItem`, `EligibilityVerdict`, and `ActionPlan`. Use `string | null` for all optional value fields and `evidence` fields. Use no `any`.
- [ ] 2.3 Create `src/context/PipelineContext.tsx`. Define the `PipelineStage` type (`'upload' | 'summary' | 'questions' | 'plan'`), `PipelineState`, and `PipelineContextValue` interfaces. Implement the context provider with `useState`. Expose `setDocumentAnalysis`, `setUserAnswers`, `setActionPlan`, `goTo`, and `reset`. Leave localStorage integration as a stub (connect it in Task 10). Initialize stage as `'upload'`.
- [ ] 2.4 Create `src/hooks/usePipeline.ts`. Export a `usePipeline` hook that reads from `PipelineContext` and throws if used outside the provider.
- [ ] 2.5 Update `src/app/page.tsx` to wrap its content in `<PipelineProvider>`. Read `stage` from `usePipeline`. Render a placeholder `<div>` for each of the four stages based on the current stage value.
- [ ] 2.6 Run `next build`. Confirm zero errors.

**Testable outcome:** The app compiles. Changing the initial stage value in `PipelineContext` changes which placeholder div renders. TypeScript catches any type mismatches in the context shape.

---

### Task 3: Upload UI

Build the `UploadStep` component with file input, client-side validation, and submission flow. No real API call yet — stub the submission handler.

- [ ] 3.1 Create `src/components/LoadingSpinner.tsx`. Render an animated SVG or CSS spinner with `role="status"` and `aria-label="Loading"`. Accept an optional `label` string prop displayed next to the spinner.
- [ ] 3.2 Create `src/components/ErrorMessage.tsx`. Accept `message: string`, `onRetry?: () => void`, and `onBack?: () => void` props. Render a red-tinted alert (`bg-red-50 border border-red-300 text-red-700 rounded-md p-4`). Render a "Try again" button if `onRetry` is provided. Render a "Go back" button if `onBack` is provided. All text at minimum `text-sm`.
- [ ] 3.3 Create `src/components/UploadStep.tsx`. Render a `<label>` wrapping an `<input type="file" accept="image/jpeg,image/png,image/webp,image/gif">`. The label should be visually styled as the clickable upload area. Render a separate "Analyze document" submit button.
- [ ] 3.4 In `UploadStep`, add an `onChange` handler on the file input. When a file is selected: check the MIME type against the accepted list; if invalid, set an error message string in local state and clear the input value. Check file size; if > 10 MB, set an error message. If valid, clear any existing error and store the file in local state. Display the selected filename when a valid file is selected.
- [ ] 3.5 In `UploadStep`, add an `onSubmit` handler on the form. If no file is selected, set a validation error. If a file is selected, call a stub `onAnalyze` prop (typed as `(base64: string, mimeType: string) => Promise<void>`) with placeholder arguments. While the stub is pending, show `<LoadingSpinner>` and disable the submit button.
- [ ] 3.6 Wire `<UploadStep>` into `page.tsx` for the `'upload'` stage. Pass a no-op async function as `onAnalyze` for now.
- [ ] 3.7 Run `next build`. Confirm zero errors.

**Testable outcome:** Selecting a non-image file shows an inline error. Selecting a file over 10 MB shows an inline error. Selecting a valid image clears errors and shows the filename. Submitting without a file shows a validation message. All states are visible at 375px with no horizontal scroll.

---

### Task 4: Document Validation (client-side)

Add client-side image compression before the API call so large images stay within the Gemini payload limit.

- [ ] 4.1 In `UploadStep.tsx`, implement the image compression function. When the valid file is submitted, if its size is ≤ 1 MB, read it directly with `FileReader.readAsDataURL`. If its size is > 1 MB, draw it to an `HTMLCanvasElement`, call `canvas.toBlob()` with JPEG quality starting at 0.9, and reduce quality in steps of 0.1 until the resulting blob is ≤ 1 MB. Use the final blob for the base64 encoding.
- [ ] 4.2 Extract the MIME type from the compressed blob (it will be `image/jpeg` after canvas compression). Pass both the base64 string (strip the data URL prefix, keeping only the base64 content) and the MIME type string to the `onAnalyze` prop.
- [ ] 4.3 Confirm with a `console.log` (development only, gated on `process.env.NODE_ENV === 'development'`) that the compressed base64 length corresponds to ≤ 1 MB.
- [ ] 4.4 Run `next build`. Confirm zero errors.

**Testable outcome:** Uploading a 4 MB JPEG produces a base64 string whose byte length corresponds to ≤ 1 MB before transmission. Uploading a 500 KB PNG produces a base64 string with no compression applied (same content). The `onAnalyze` prop receives a clean base64 string without the `data:image/...;base64,` prefix.

---

### Task 5: Gemini Server API

Create the `gemini.ts` client wrapper and the two API routes as server-side modules. Use real Gemini API calls with the key from the environment.

- [ ] 5.1 Create `src/lib/gemini.ts`. Import `GoogleGenerativeAI` from `@google/generative-ai`. Initialize the client using `process.env.GEMINI_API_KEY`. Get the `gemini-2.0-flash` model with `generationConfig: { responseMimeType: 'application/json' }`. Export `analyzeDocument(imageBase64: string, mimeType: string): Promise<unknown>` and `generatePlan(analysis: DocumentAnalysis, answers: Record<string, string>): Promise<unknown>`. Both functions call `model.generateContent(...)` and return the raw response text parsed as `JSON.parse`. Both propagate errors without catching — the route handles all errors.
- [ ] 5.2 Implement the 9-second timeout in both functions. Wrap each `model.generateContent(...)` call in `Promise.race([geminiCall, timeoutPromise])` where `timeoutPromise` rejects with `{ code: 'TIMEOUT' }` after 9000 ms.
- [ ] 5.3 Create `src/app/api/analyze/route.ts`. Export an async `POST` handler that: (a) parses the request body as `{ imageBase64: string; mimeType: string }`, (b) validates both fields are non-empty strings and `mimeType` is one of the four accepted types — returns 400 if not, (c) calls `gemini.analyzeDocument`, catching errors and returning 502 for Gemini API errors and 504 for timeout errors, (d) returns 200 with the raw result for now (validation is added in Task 7). Wrap everything in try/catch. Never expose `process.env.GEMINI_API_KEY` in any response.
- [ ] 5.4 Create `src/app/api/plan/route.ts`. Export an async `POST` handler that: (a) parses the body as `{ documentAnalysis: unknown; userAnswers: unknown }`, (b) validates both are present non-null objects — returns 400 if not, (c) calls `gemini.generatePlan`, catching errors and returning 502 / 504 as above, (d) returns 200 with the raw result for now. Wrap everything in try/catch.
- [ ] 5.5 Add `GEMINI_API_KEY=your_actual_key` to `.env.local` (real key for development testing).
- [ ] 5.6 Manually test `/api/analyze` with a `curl` or Postman request containing a small valid base64 image. Confirm it returns a JSON response. Confirm the route returns 400 for missing fields.
- [ ] 5.7 Run `next build`. Confirm zero errors.

**Testable outcome:** A valid POST to `/api/analyze` returns a 200 response with JSON. A POST with a missing `imageBase64` field returns 400. A POST with an invalid `mimeType` returns 400. The API key does not appear in any response body.

---

### Task 6: Structured AI Response Schema

Create `prompts.ts` with both Stage 1 and Stage 2 prompts. The prompts embed the full JSON schema and all required instructions from the design document.

- [ ] 6.1 Create `src/lib/prompts.ts`. Export `buildStage1Prompt(): string`. This function returns a prompt string that includes: identity framing (Pakistan document context, Urdu/English/mixed), null discipline instruction (verbatim: "If a field's value is not stated in the document, set it to null. Do not guess, infer, or fabricate values."), readability check instruction, scope check instruction, evidence discipline instruction (verbatim excerpt, set to null if not traceable), question generation instruction (document-specific questions only, no generic questions), and the complete `DocumentAnalysis` JSON schema embedded as a JSON object with field descriptions. The schema must match `lib/types.ts` exactly.
- [ ] 6.2 Export `buildStage2Prompt(analysis: DocumentAnalysis, answers: Record<string, string>): string`. This function returns a prompt string that: embeds the full `DocumentAnalysis` JSON, embeds the user's answers formatted as a readable key-value list, includes eligibility assessment instruction, criterion classification rules (satisfied/unmet/unknown — never assume satisfied without a confirming answer), action plan ordering instruction (deadline-driven first, prerequisites before dependents), unknown discipline instruction (set `deadline` to null if not stated), and the complete `ActionPlan` JSON schema with field descriptions.
- [ ] 6.3 Update `gemini.ts` to use the prompts: `analyzeDocument` calls `buildStage1Prompt()` and sends it together with the image part. `generatePlan` calls `buildStage2Prompt(analysis, answers)` and sends the text-only prompt.
- [ ] 6.4 Manually test Stage 1 against one real scholarship document image. Check that the raw JSON response contains all expected fields. Check that null fields appear where the document does not state a value.
- [ ] 6.5 Run `next build`. Confirm zero errors.

**Testable outcome:** Stage 1 prompt contains the literal substring "Do not guess, infer, or fabricate values." Stage 1 prompt contains the full `DocumentAnalysis` schema. Stage 2 prompt contains the full `ActionPlan` schema. A real Gemini call returns JSON with all top-level fields present.

---

### Task 7: Response Validation

Create `validate.ts` with the two type guard functions, and integrate them into the API routes.

- [ ] 7.1 Create `src/lib/validate.ts`. Export `isDocumentAnalysis(value: unknown): value is DocumentAnalysis`. The guard checks: `readable` is boolean; `documentScope` is `'in_scope'` or `'out_of_scope'`; `documentType` is string or null; `purpose` is string or null; all eight array fields are actual arrays. For items in `eligibilityCriteria`, `requiredDocuments`, `deadlines`, and `fees`, coerce any missing `evidence` key to `null` (mutate the parsed object before checking). Return `false` if any check fails.
- [ ] 7.2 Export `isActionPlan(value: unknown): value is ActionPlan`. The guard checks: `eligibilityVerdict` is one of the three literal strings; `verdictRationale` is a string; `satisfiedCriteria`, `unmetCriteria`, `unknownCriteria`, `actionItems` are arrays; each element has all required fields with correct types (check `text` is string for criteria arrays; check `title`, `description` are strings and `evidence`, `deadline` are string or null for `actionItems`).
- [ ] 7.3 Update `/api/analyze/route.ts`. After receiving the raw Gemini response, run `isDocumentAnalysis()`. If it returns false, return HTTP 500 with `{ "error": "AI returned an unrecognized response structure. Please try again." }`. If it returns true, return the validated `DocumentAnalysis` object.
- [ ] 7.4 Update `/api/plan/route.ts`. After receiving the raw Gemini response, run `isActionPlan()`. If it returns false, return HTTP 500. If it returns true, return the validated `ActionPlan` object. Also validate the Stage 2 rule: verify no criterion appears in `satisfiedCriteria` if its corresponding answer key was absent or null in the submitted `userAnswers` map. Return HTTP 500 if this condition is violated.
- [ ] 7.5 Test the validation manually: modify a real Gemini response to remove a required field, pass it through the validator, confirm it returns false. Pass a valid response, confirm it returns true.
- [ ] 7.6 Run `next build`. Confirm zero errors.

**Testable outcome:** Posting a response body with a missing `eligibilityVerdict` field to a test of `isActionPlan` returns `false`. Posting a valid `DocumentAnalysis`-shaped object returns `true`. The API routes return 500 for invalid shapes, not 200 with partial data.

---

### Task 8: Result Page — SummaryStep

Build `SummaryStep` to display the Stage 1 output correctly, including all null and empty-array states.

- [ ] 8.1 Create `src/components/EvidenceBlock.tsx`. Accept `evidence: string` and optional `label?: string` (default: `"View source"`). Use `useState` for open/collapsed state. When collapsed, render a small `<button>` styled as a muted text link showing the label with a `▶` or `▸` icon. When expanded, render the evidence text in a `<blockquote>` with a left border (`border-l-4 border-gray-300 pl-4`), italic text (`italic text-gray-600 text-sm`), and a "Hide source" toggle button. Fully accessible: button has a descriptive `aria-expanded` attribute. No props other than `evidence` and `label` — all state is internal.
- [ ] 8.2 Create `src/components/SummaryStep.tsx`. Accept `analysis: DocumentAnalysis` and `onContinue: () => void` as props. Implement the three conditional render paths: (a) `readable === false` → show unreadable message + "Try a different image" button that calls `usePipeline().goTo('upload')`; (b) `documentScope === 'out_of_scope'` → show unsupported message + "Try a different document" button; (c) normal path → render all extracted fields.
- [ ] 8.3 In the normal render path of `SummaryStep`, render each section (eligibility criteria, required documents, deadlines, fees, application steps, warnings) as a labeled card or section. For each item: if the primary value field (`description`, `date`, `amount`) is `null`, show "Not stated in document". If the item has a non-null non-empty `evidence` field, render `<EvidenceBlock evidence={item.evidence} />` beneath it. If `evidence` is null or `""`, render nothing for evidence.
- [ ] 8.4 In `SummaryStep`, handle empty arrays. If any array field is `[]`, render "None found in document" in place of the item list — not an empty section.
- [ ] 8.5 In `SummaryStep`, render the `unknownFields` array beneath all sections with the heading "Could not determine from document" if non-empty.
- [ ] 8.6 In `SummaryStep`, render the "Continue to questions" button (calls `onContinue`) only when `readable === true` and `documentScope !== 'out_of_scope'`.
- [ ] 8.7 Wire `<SummaryStep>` into `page.tsx` for the `'summary'` stage. Pass `analysis={pipelineState.documentAnalysis!}` and `onContinue={() => goTo('questions')}`.
- [ ] 8.8 Run `next build`. Confirm zero errors.

**Testable outcome:** Given a `DocumentAnalysis` with `readable: false`, only the unreadable message and retry button render. Given a normal analysis with a null `deadline.date`, "Not stated in document" renders. Given an empty `warnings` array, "None found in document" renders. Given a non-null `evidence` string, `EvidenceBlock` renders — clicking it shows the blockquote. Given `evidence: null`, no "View source" button appears.

---

### Task 9: Eligibility Reasoning — QuestionsStep

Build `QuestionsStep` to render the dynamic questions form and call Stage 2.

- [ ] 9.1 Create `src/components/QuestionsStep.tsx`. Accept `analysis: DocumentAnalysis` and `onPlanReady: (plan: ActionPlan) => void` as props. Import `usePipeline` for `goTo` and `setUserAnswers`. Use local state for: `answers` (a `Record<string, string>`), `loading` boolean, `error` string or null.
- [ ] 9.2 If `analysis.questionsForUser` is an empty array, render the message "No profile questions are needed for this document" and a "Generate action plan" button that submits with an empty answers object.
- [ ] 9.3 For each question in `questionsForUser`, render a labeled form field based on `fieldType`: `'text'` → `<input type="text">`, `'number'` → `<input type="number">`, `'boolean'` → two radio buttons labeled "Yes" / "No", `'select'` → `<select>` populated from `question.options`. All fields are `text-sm` minimum. Required questions show an asterisk after the label. Store answer changes in the `answers` state object keyed by `question.id`.
- [ ] 9.4 Add form submission validation. When the submit button is clicked: find all questions where `required === true` and `answers[question.id]` is empty or undefined. If any exist, set an inline error message listing the missing question labels. Do not call the API.
- [ ] 9.5 On valid submission: set `loading` to true, disable the submit button, call `setUserAnswers(answers)` on the pipeline context, then `POST` to `/api/plan` with `{ documentAnalysis: analysis, userAnswers: answers }`. Handle the response: on success, call `onPlanReady(data)`. On non-2xx, set the error message from the response body's `error` field or the fallback "Something went wrong. Please try again." On network failure, set the network error message. Always set `loading` to false when done.
- [ ] 9.6 Render `<LoadingSpinner label="Generating your action plan..." />` while loading. Render `<ErrorMessage>` with `onRetry` (re-enables the form) and `onBack={() => goTo('summary')}` when an error is set.
- [ ] 9.7 Wire `<QuestionsStep>` into `page.tsx` for the `'questions'` stage. Pass `onPlanReady={(plan) => { setActionPlan(plan); goTo('plan'); }}`.
- [ ] 9.8 Run `next build`. Confirm zero errors.

**Testable outcome:** Submitting with a required question unanswered shows the field name in the validation error. Submitting a complete form sends a POST to `/api/plan`. A successful response calls `onPlanReady`. A non-2xx response shows the error message inline with a retry button and a "Go back" button. The form is disabled while loading.

---

### Task 10: Missing Requirement Logic — localStorage + Pipeline Restore

Add `storage.ts` and wire localStorage into `PipelineContext` so sessions survive a page refresh.

- [ ] 10.1 Create `src/lib/storage.ts`. Export five functions: `saveDocumentAnalysis(data: DocumentAnalysis): void` — wraps `localStorage.setItem('qadam_document_analysis', JSON.stringify(data))` in try/catch, silently ignores errors. `loadDocumentAnalysis(): DocumentAnalysis | null` — wraps `JSON.parse(localStorage.getItem('qadam_document_analysis') ?? '')` in try/catch, returns null on any failure. `saveActionPlan(data: ActionPlan): void`. `loadActionPlan(): ActionPlan | null`. `clearAll(): void` — calls `localStorage.removeItem` for both keys.
- [ ] 10.2 Update `PipelineContext.tsx`. On mount (inside a `useEffect`): call `loadDocumentAnalysis()` and `loadActionPlan()`. Apply restore logic: if both are non-null and valid, set both in state and set stage to `'plan'`; if only `documentAnalysis` is non-null, set it in state and set stage to `'questions'`; otherwise, start at `'upload'`. Wrap the entire restore block in try/catch — on any error, call `clearAll()` and set stage to `'upload'`.
- [ ] 10.3 In `PipelineContext.tsx`, call `saveDocumentAnalysis` inside `setDocumentAnalysis`. Call `saveActionPlan` inside `setActionPlan`. Call `clearAll()` inside `reset()`.
- [ ] 10.4 Wire the real `onAnalyze` handler into `page.tsx`. Replace the no-op stub with a real async function that: POSTs to `/api/analyze` with the base64 and mimeType, handles the response (calls `setDocumentAnalysis` on success, surfaces errors inline), and transitions to `'summary'` via `goTo`.
- [ ] 10.5 Manually verify the restore flow: complete Stage 1 on a document, refresh the page, confirm the QuestionsStep is shown with the previous document's questions. Complete both stages, refresh, confirm PlanStep is shown.
- [ ] 10.6 Run `next build`. Confirm zero errors.

**Testable outcome:** After Stage 1 completes and the page is refreshed, the pipeline restores to `'questions'`. After Stage 2 completes and the page is refreshed, the pipeline restores to `'plan'`. After "Start over" is clicked, the pipeline is at `'upload'` and localStorage contains no qadam keys.

---

### Task 11: Action Plan Rendering — PlanStep

Build `PlanStep` to display the Stage 2 output with the eligibility verdict, criteria sections, and ordered action items.

- [ ] 11.1 Create `src/components/PlanStep.tsx`. Accept `plan: ActionPlan` and `onStartOver: () => void` as props.
- [ ] 11.2 Render the eligibility verdict card at the top. Map verdict values to Tailwind classes: `likely_eligible` → `bg-green-50 border-l-4 border-green-500 text-green-800`; `likely_not_eligible` → `bg-red-50 border-l-4 border-red-500 text-red-800`; `cannot_determine` → `bg-amber-50 border-l-4 border-amber-500 text-amber-800`. Each verdict also renders a distinct label string: "Likely Eligible", "Likely Not Eligible", "Cannot Determine". Render `verdictRationale` beneath the verdict label. If `verdictRationale` is empty or null, render "Rationale not provided."
- [ ] 11.3 Render the disclaimer immediately below the verdict card: "Qadam is not a legal advisor. Please verify your eligibility with the issuing authority." Style it as a muted note (`text-sm text-gray-500 italic`). It must be visible in the initial viewport at 375px without scrolling.
- [ ] 11.4 Render three labeled sections for `satisfiedCriteria`, `unmetCriteria`, and `unknownCriteria`. Use distinct heading colors: satisfied → green, unmet → red, unknown → amber. For each section, if the array is empty, render "None" under the heading — do not omit the section. For each criterion item, render its `text`. If it has non-null `evidence`, render `<EvidenceBlock evidence={item.evidence} />`.
- [ ] 11.5 Render the action items section. If `actionItems` is empty, show "No specific action items could be determined from this document." If non-empty, render each item as a numbered list starting from 1. For each item: render `title` as a bold heading, `description` as body text below it. If `deadline` is non-null and non-empty, render it labeled "Deadline:" adjacent to the title. If `evidence` is non-null and non-empty, render `<EvidenceBlock evidence={item.evidence} />` below the description.
- [ ] 11.6 Render a "Start over" button at the bottom that calls `onStartOver`. Clicking it calls `reset()` on the pipeline context.
- [ ] 11.7 Wire `<PlanStep>` into `page.tsx` for the `'plan'` stage. Pass `plan={pipelineState.actionPlan!}` and `onStartOver={reset}`.
- [ ] 11.8 Run `next build`. Confirm zero errors.

**Testable outcome:** Given `likely_eligible`, the verdict card has a green color scheme and the label "Likely Eligible". Given `cannot_determine`, the amber scheme appears. Empty `satisfiedCriteria` renders the "None" label, not an empty section. An action item with a non-null `evidence` shows a working "View source" button. An action item with `evidence: null` shows no button. "Start over" resets the pipeline to the upload step.

---

### Task 12: Evidence and Uncertainty UI Polish

Verify and refine the evidence and uncertainty representations across `SummaryStep` and `PlanStep`.

- [ ] 12.1 Audit every rendered field in `SummaryStep` for null handling. Confirm that for each field where the value is null: the text "Not stated in document" is shown, no blank or dash renders. Confirm for `date: null` in Deadline: "Not stated in document". For `amount: null` in Fee: "Not stated in document".
- [ ] 12.2 Audit every `EvidenceBlock` usage in both `SummaryStep` and `PlanStep`. Confirm the component only renders when the `evidence` prop is a non-empty string. Add a guard at the call sites: `{item.evidence ? <EvidenceBlock evidence={item.evidence} /> : null}`.
- [ ] 12.3 Confirm `EvidenceBlock`'s expanded blockquote is visually distinct from Qadam-generated text: left border present, text is italic, color is muted gray (`text-gray-600`), background is lightly tinted (`bg-gray-50`). Do not remove or simplify this styling.
- [ ] 12.4 Confirm that when `unknownFields` is non-empty in a `DocumentAnalysis`, the SummaryStep renders them under the heading "Could not determine from document." If `unknownFields` is empty or `[]`, this section does not render.
- [ ] 12.5 Confirm the `unknownCriteria` section in `PlanStep` always renders with its heading (even if empty — showing "None"), and that its items are labeled in a way that makes the uncertainty explicit (heading: "Could Not Be Determined").
- [ ] 12.6 Run `next build`. Confirm zero errors.

**Testable outcome:** No "View source" button appears anywhere in the UI for an item with `evidence: null`. No blank or dash renders in place of a null field value. The expanded evidence blockquote is visually different from surrounding text. The `unknownCriteria` section always renders in `PlanStep`.

---

### Task 13: Demo Examples

Prepare two real Pakistani document examples for the hackathon demo. These are test inputs, not code changes.

- [ ] 13.1 Find or create a clear, readable image of a Pakistani scholarship document (HEC undergraduate scholarship, provincial scholarship, or similar). It should have: at least two eligibility criteria, at least one deadline, at least one required document, and ideally a domicile or CGPA requirement. Save it as `demo/scholarship-sample.jpg` in the repository.
- [ ] 13.2 Find or create a clear, readable image of a Pakistani government service document (NADRA CNIC application requirements, passport application, domicile certificate requirements, or similar). It should have: a fee listed, required documents, and at least one eligibility condition. Save it as `demo/government-sample.jpg`.
- [ ] 13.3 Run the full pipeline manually against `scholarship-sample.jpg`. Confirm: Stage 1 extracts eligibility criteria with evidence; at least one question is generated; Stage 2 produces a verdict and at least two action items; "View source" buttons appear and show correct excerpts.
- [ ] 13.4 Run the full pipeline manually against `government-sample.jpg`. Confirm the same outputs are produced for the government document type.
- [ ] 13.5 Identify any field in either demo run where Gemini hallucinated evidence (produced a plausible but non-verbatim excerpt). Note these in `demo/known-limitations.md` for the demo presentation. Do not treat hallucination as a build failure — document it honestly.

**Testable outcome:** Both sample documents produce a complete, non-empty action plan with at least one working evidence interaction. The demo can be walked through in under 4 minutes from upload to final plan.

---

### Task 14: Loading and Error States

Complete all loading and error UI paths across the full pipeline.

- [ ] 14.1 In `UploadStep`, confirm `<LoadingSpinner>` renders with the label "Analyzing your document..." while the Stage 1 API call is in progress. Confirm the submit button is disabled and the file input is disabled during this time.
- [ ] 14.2 In `UploadStep`, confirm the error display for each case: invalid file type (inline, before any API call), file too large (inline), network error from `/api/analyze` (shows `<ErrorMessage>` with `onRetry` that re-enables the form), non-2xx from `/api/analyze` (shows the `error` field from the response body or the fallback message).
- [ ] 14.3 In `QuestionsStep`, confirm `<LoadingSpinner>` renders with the label "Generating your action plan..." while the Stage 2 API call is in progress. Confirm the submit button is disabled.
- [ ] 14.4 In `QuestionsStep`, confirm the error display: network failure shows the connection error message; non-2xx shows the `error` field or fallback. Both states render a "Try again" button that re-enables the submit button and a "Go back" button that transitions to `'summary'`.
- [ ] 14.5 Test each error state manually by temporarily modifying the API route to return specific error codes (400, 500, 502, 504) and confirming the correct UI message appears in each case. Restore the routes after testing.
- [ ] 14.6 Confirm that no error state advances the pipeline stage. The pipeline context must stay on the current stage while an error is active.
- [ ] 14.7 Run `next build`. Confirm zero errors.

**Testable outcome:** Every documented error scenario from the design's error handling table produces a visible, human-readable error message. Every error state has at least one recovery action (retry or go back). No error leaves the user on a blank screen.

---

### Task 15: Tests

Execute the full manual testing checklist from the testing steering document. Document the results.

- [ ] 15.1 Run through the pre-demo manual checklist from `testing.md`. For each item, record pass or fail in a comment or in `demo/test-results.md`. Do not proceed to Task 16 if any item fails.
  - Upload a clear scholarship document → Stage 1 returns structured data
  - Upload a blurry image → SummaryStep shows "could not read document" message
  - Upload a non-document image → SummaryStep shows "unrecognized document" message  
  - Upload a PDF → UploadStep rejects it before any API call
  - Upload a file over 10 MB → UploadStep rejects it before any API call
  - Complete the full pipeline with the scholarship sample → action plan renders with evidence
  - Complete the full pipeline with the government sample → action plan renders with evidence
  - Click every "View source" button → correct excerpt appears inline
  - Disable network → error message appears with retry
  - Refresh mid-session after Stage 1 → pipeline restores to QuestionsStep
  - Refresh mid-session after Stage 2 → pipeline restores to PlanStep
  - Click "Start over" → localStorage cleared, UploadStep shown
  - Run `next build` → zero errors
  - Open at 375px devtools → no horizontal scroll, all elements reachable
- [ ] 15.2 Fix any failures found in 15.1 before continuing.
- [ ] 15.3 Confirm no `console.log` calls exist in production code (check with a grep for `console.log` excluding files in `demo/` and `node_modules/`).

**Testable outcome:** All 14 checklist items pass. Zero `console.log` statements in `src/`.

---

### Task 16: Responsive Polish

Final pass on layout and touch usability at 375px viewport width.

- [ ] 16.1 Open the app in Chrome devtools at 375px (iPhone SE) and walk through all four pipeline steps. Check for horizontal scroll bars. If any exist, identify the element causing overflow and add `overflow-x-hidden` or fix the width constraint.
- [ ] 16.2 Check every interactive element (buttons, file input, form fields, evidence toggle buttons) at 375px. Each must have a touch target of at least 44px height. Add `min-h-[44px]` to any element below this threshold.
- [ ] 16.3 Check all body text and form labels. No text should be smaller than `text-sm` (14px). Replace any `text-xs` instances in body content with `text-sm`.
- [ ] 16.4 Check the verdict card and disclaimer in `PlanStep` at 375px. The disclaimer must be visible in the initial viewport without scrolling. If it is below the fold, move the disclaimer directly below the verdict rationale and before the criteria sections.
- [ ] 16.5 Check `EvidenceBlock` in expanded state at 375px. The blockquote text must not overflow its container. Add `break-words` or `overflow-wrap: anywhere` if long Arabic/Urdu words cause overflow.
- [ ] 16.6 Run `next build`. Confirm zero errors.

**Testable outcome:** At 375px, all four pipeline steps render without horizontal scrollbars. All buttons and inputs have ≥ 44px height. No text is smaller than 14px. The disclaimer is visible on first load of PlanStep without scrolling.

---

### Task 17: Production Build

Verify the production build is clean before deployment.

- [ ] 17.1 Run `next build`. Fix any TypeScript errors. Fix any ESLint errors. The build must complete with zero errors before continuing.
- [ ] 17.2 Run `grep -r "console\.log" src/` (or PowerShell equivalent: `Select-String -Recurse -Path "src\" -Pattern "console\.log"`). Remove or gate every instance behind `process.env.NODE_ENV === 'development'`.
- [ ] 17.3 Confirm `.env.local` is in `.gitignore`. Confirm the actual API key value is not present in any committed file. Run `git status` to verify `.env.local` is untracked.
- [ ] 17.4 Run the production build locally with `next start` (after `next build`). Walk through the full pipeline once against the scholarship demo document. Confirm it completes end-to-end with no runtime errors in the terminal.
- [ ] 17.5 Run `next build` one final time and record the output. It must show 0 errors and 0 warnings related to TypeScript or ESLint.

**Testable outcome:** `next build` exits with code 0. `next start` serves the app. A full pipeline run in the production build completes successfully. No `console.log` in `src/`. No secrets in git.

---

### Task 18: Deployment

Deploy the production build to Vercel and verify the live URL works end-to-end.

- [ ] 18.1 Create a Vercel account (or log into an existing one) and create a new project connected to the Qadam GitHub repository.
- [ ] 18.2 In the Vercel project settings, add the environment variable `GEMINI_API_KEY` with the production API key value.
- [ ] 18.3 Trigger the first deployment by pushing the current `main` branch. Monitor the Vercel build log. The build must complete with zero errors.
- [ ] 18.4 Open the deployed Vercel URL. Upload the scholarship sample document. Confirm Stage 1 completes and returns a valid document summary.
- [ ] 18.5 Complete the full pipeline on the live URL against the scholarship sample. Confirm the action plan renders with at least one working "View source" interaction.
- [ ] 18.6 Open the live URL on a real mobile device (or via BrowserStack). Confirm the pipeline is usable at the device's native viewport. Check for horizontal scroll, tap target sizes, and text legibility.
- [ ] 18.7 Confirm the live URL is served over HTTPS (check the browser padlock).
- [ ] 18.8 Record the live Vercel URL in the repository `README.md` for the hackathon submission.

**Testable outcome:** The Vercel deployment URL loads the Qadam application over HTTPS. A complete pipeline run on the live URL produces a valid action plan. The app is usable on a real mobile device. The URL is recorded in README.md.
