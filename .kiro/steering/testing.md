# Qadam — Testing Steering

## Testing Philosophy

Qadam operates in a high-stakes context. A fabricated deadline or invented eligibility requirement can cause a real person to miss a scholarship or submit a flawed government application. Testing must verify not just that the app runs, but that it behaves honestly and fails safely.

Every requirement must be expressed in a way that can be tested. If a requirement cannot be tested, it is not a requirement — it is a wish.

## What Must Be Tested

### AI Output Validation

- Stage 1 output must conform to the defined `DocumentAnalysis` TypeScript type before it is used
- Stage 2 output must conform to the defined `ActionPlan` TypeScript type before it is used
- If the AI returns a response that does not match the expected shape, the app must enter a recoverable error state — not crash, not silently render partial data
- Validate that required fields are present (e.g., `eligibilityVerdict`, `actionItems`) before rendering
- Validate that array fields are actually arrays before mapping over them

### The "No Invented Information" Rule

- Any field the document does not address must be represented as unknown/null/empty — never as a fabricated value
- Test with documents that have missing deadlines — the output must mark the deadline as unknown, not guess a date
- Test with documents that have missing fee information — the output must mark fees as unknown
- Test with documents that have ambiguous eligibility criteria — the output must reflect the ambiguity, not resolve it arbitrarily
- The prompt must explicitly instruct Gemini to use null or a designated unknown marker rather than guess

### Evidence Integrity

- Every claim rendered with an evidence interaction must have a non-empty evidence string in the underlying data
- If an evidence field is empty or null, the "View evidence" interaction must not appear — not appear broken
- Evidence text must be a direct excerpt or close paraphrase from the source document, not a generated summary
- Test that evidence chips render correctly for at least: an eligibility criterion, a required document, a deadline, a fee

### Invalid and Edge-Case Uploads

- Uploading a non-document image (a selfie, a random photo) must produce a graceful response indicating the document could not be analyzed, not a crash or fabricated analysis
- Uploading a blank or near-blank image must be handled gracefully
- Uploading an image that is too dark, blurry, or low-resolution must produce a clear "document unreadable" response
- Uploading a file that is not an image (PDF, DOCX, text file) must be rejected at the input level with a clear error message before any API call is made
- File size limits must be enforced client-side before upload — define and document the limit

### API Failure Handling

- If the Gemini API returns a non-200 response (rate limit, server error, quota exceeded), the user must see a clear, human-readable error message — not a blank screen or a raw error object
- If the API call times out, the user must see a timeout message with guidance (e.g., try again, or try a clearer image)
- If the API key is missing or invalid, the error must surface in a way that is useful for the developer without exposing the key itself
- Error states must be recoverable — the user must be able to go back and try again without refreshing the page

### Malformed AI Responses

- If Gemini returns valid JSON that does not match the expected schema, the app must detect this and show an error — not render broken UI
- If Gemini returns a response that is not valid JSON at all, the JSON parse error must be caught and handled
- If Gemini returns an empty `actionItems` array, the UI must handle this explicitly (show a message, not an empty list with no explanation)
- If Gemini returns an empty `eligibilityCriteria` array, the question step must handle this gracefully

### User Input Validation

- The upload step must not proceed if no file is selected
- The questions form must not proceed if required questions are left unanswered (define which questions are required vs. optional)
- Answers that are clearly out of range (e.g., CGPA of 10.0 on a 4.0 scale) should be caught by client-side validation where practical

### Mobile Responsiveness

- All pipeline stages (upload, document summary, questions form, action plan) must be usable on a 375px wide viewport (iPhone SE baseline)
- Evidence interactions (expandable excerpts) must be functional on touch devices
- File upload must work on mobile browsers (use a standard `<input type="file">` — do not use drag-and-drop as the only mechanism)
- Text must be legible at mobile font sizes — do not use text smaller than Tailwind's `text-sm` (14px) for body content

### Production Build

- Run `next build` before any deployment — do not deploy a build that fails
- TypeScript errors must be zero in production builds — `strict: true` must be enabled in `tsconfig.json`
- ESLint must pass with zero errors on production builds
- No `console.log` statements in production code — use conditional logging or remove before deployment
- Environment variables must be correctly set in Vercel project settings — test that the deployed app can reach the Gemini API

## Testing Approach for MVP

Given the solo developer and beginner/intermediate skill constraints, the testing approach is pragmatic:

**Manual testing is the primary approach for MVP.** Automated unit/integration tests are not required before launch, but the following manual test checklist must be executed before any public demo or deployment:

### Pre-Demo Checklist

- [ ] Upload a clear, readable document image → Stage 1 completes and returns valid structured data
- [ ] Upload a blurry or unreadable image → App shows a clear "could not read document" message
- [ ] Upload a non-document image (selfie, object photo) → App shows a graceful "unrecognized document" message
- [ ] Upload a non-image file (PDF, DOCX) → App rejects it at the input level with a clear message
- [ ] Complete the full pipeline with a scholarship document → Action plan renders with evidence interactions working
- [ ] Complete the full pipeline with a government document → Action plan renders with evidence interactions working
- [ ] Click every "View evidence" interaction → Correct source excerpt appears inline
- [ ] Disconnect from the internet mid-session → API failure is handled gracefully
- [ ] Run `next build` → Zero errors, zero TypeScript errors
- [ ] Open the app on a mobile device (or 375px Chrome devtools) → All stages are usable
- [ ] Deploy to Vercel → Live URL works end-to-end with real Gemini API calls

### What Automated Tests Would Cover (post-MVP)

If automated tests are added after MVP, prioritize:
1. Type validation of AI response shapes (unit tests for schema validators)
2. API route error handling (integration tests with mocked Gemini responses)
3. Evidence rendering logic (component tests verifying evidence chip behavior)

## Regression Triggers

Any change to the following must be manually re-tested end-to-end:

- Either AI prompt (`prompts.ts`)
- Either API route (`/api/analyze`, `/api/plan`)
- The TypeScript types for AI output shapes (`lib/types.ts`)
- The evidence rendering component
- The upload input component
