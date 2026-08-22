# Qadam

**Know what comes next.**

Qadam is a Pakistan-focused AI application that turns confusing institutional documents — scholarship announcements, university notices, government-service instructions — into personalized, evidence-backed action plans.

🔗 **Live app:** _[add your Vercel URL here after deployment]_
🎥 **Demo video:** _[add your 2–4 minute demo link here]_

---

## Problem

Pakistan's government, university, and scholarship information is often publicly available — but that isn't the same as being *understandable*. People can find the document, but struggle to answer three basic questions:

- Does this actually apply to me?
- What am I missing?
- What do I do next?

The result is missed deadlines, incomplete applications, and people who qualify for support they never receive — not because the information didn't exist, but because it wasn't legible to them.

## Solution

Qadam reads an uploaded document image and turns it into a personalized action plan through a two-stage AI pipeline:

1. **Extraction** — the document is analyzed to identify its type, purpose, eligibility criteria, required documents, deadlines, fees, application steps, and warnings.
2. **Personalization** — Qadam asks only the profile questions relevant to *that specific document*, then determines an eligibility verdict, flags missing requirements, and produces an ordered action plan.

Every extracted claim is paired with evidence from the source document wherever possible. When the document doesn't say something clearly, Qadam says **"cannot determine"** instead of guessing.

Qadam is not a chatbot and not a generic document summarizer. It is a single, focused reasoning pipeline:

```
unstructured document → structured information → personalized reasoning → actionable plan
```

## Why Pakistan

This project is deliberately scoped to Pakistani institutional documents — HEC scholarships, provincial domicile certificates, and similar government/university services — because the underlying pattern (public information, low legibility, high consequence for getting it wrong) is especially common and especially costly here. A student who misreads a CGPA requirement or misses an income-affidavit deadline doesn't get a second attempt at that scholarship cycle.

## How Qadam Works

The user flow is a single-page, four-stage pipeline — no routing, no accounts, no database:

```
Upload  →  Summary  →  Questions  →  Plan
```

1. **Upload** — the user uploads a photo or screenshot of a document (JPG/PNG/WEBP/GIF, ≤10MB). The image is compressed client-side to ≤1MB before being sent to the server.
2. **Summary** — Stage 1 AI output is displayed: document type, purpose, eligibility criteria, required documents, deadlines, fees, steps, and warnings, each with an evidence excerpt where available.
3. **Questions** — Qadam asks only the profile questions generated from that specific document's criteria — never a generic universal form.
4. **Plan** — Stage 2 AI output: an eligibility verdict (*Likely Eligible* / *Likely Not Eligible* / *Cannot Determine*), a breakdown of satisfied, unmet, and undetermined criteria, and an ordered list of next steps.

Session state is held in `localStorage` only, so a page refresh mid-pipeline restores exactly where the user left off — no login required.

## AI Architecture

Qadam uses a two-stage Gemini pipeline, each stage a separate structured-JSON call:

| Stage | Input | Output |
|---|---|---|
| **1 — Analyze** | Document image (base64) | `DocumentAnalysis` — structured extraction with evidence citations |
| **2 — Plan** | `DocumentAnalysis` + user's answers | `ActionPlan` — eligibility verdict, criteria breakdown, action items |

**Trust mechanisms built into the pipeline, not bolted on after:**

- The Stage 1 prompt explicitly instructs the model: *"If a field's value is not stated in the document, set it to null. Do not guess, infer, or fabricate values."*
- Every claim-bearing field (`evidence`) is `string | null` at the type level — there is no way to render a claim without either a real excerpt or an explicit "not stated" state.
- Both AI responses are validated server-side against runtime type guards before ever reaching the client. Malformed AI output is rejected with a 500, not silently passed through.
- **No criterion can be marked "satisfied" in the final plan unless a real user answer backed it** — this is enforced in application code as a server-side rule, independent of what the model claims, guarding against LLM overconfidence.
- Numeric eligibility comparisons (income thresholds, CGPA cutoffs) happen in application logic, not left to the model's arithmetic.

## Kiro Development Process

Qadam was built using Kiro's spec-driven workflow from the start, not documented retroactively:

- `.kiro/steering/` — `product.md`, `tech.md`, `testing.md` establishing project context before any code was written
- `.kiro/specs/qadam-mvp/` — `requirements.md` (13 EARS-style acceptance criteria), `design.md` (architecture, API contracts, schemas), `tasks.md` (18 independently testable implementation tasks)
- Implementation proceeded task-by-task against `tasks.md`, with each task's output verified against `design.md` before the next task began
- Commit history reflects this process — steering and spec files were committed before implementation, and features were built incrementally rather than in one large generation pass

## Tech Stack

```
Frontend:      Next.js (App Router) + TypeScript (strict) + Tailwind CSS
AI:            Gemini API (structured JSON output)
Deployment:    Vercel
Persistence:   localStorage (no database)
Development:   Kiro
Repository:    GitHub
```

Deliberately **not** included in the MVP: authentication, a database, custom ML, RAG infrastructure, and any conversational/chat interface — these are outside the scope of what a document-to-plan tool needs to prove its value.

## Installation

```bash
git clone https://github.com/<your-username>/qadam-pk.git
cd qadam-pk
npm install
```

Create `.env.local` in the project root:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

Get a free key at [Google AI Studio](https://aistudio.google.com/apikey).

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Server-side only — never exposed to the client. Used for both the Stage 1 (analyze) and Stage 2 (plan) Gemini calls. |

## Deployment

Deployed on Vercel, connected directly to this repository. The `GEMINI_API_KEY` environment variable is configured in the Vercel project settings (Production scope) — never committed to the repository.

Both API routes declare an explicit `maxDuration` to control server-side execution time independently of the client-facing request timeout.

## Screenshots

_[Add screenshots of each pipeline stage here — Upload, Summary, Questions, Plan — before final submission]_

## Limitations

- **English-language documents only** for this MVP — Urdu and mixed-language documents may be uploaded, but extraction quality is not guaranteed and output is always in English.
- **Images only, no PDF** — PDF text-layer extraction was considered but postponed in favor of a smaller, more reliable image-only pipeline for the hackathon timeline.
- **No persistence beyond the browser session** — clearing browser storage or switching devices loses the current analysis; this is a deliberate MVP trade-off, not an oversight.
- **AI evidence extraction is not perfect** — Gemini occasionally paraphrases rather than quoting verbatim excerpts. See `demo/known-limitations.md` for specific examples observed during testing.
- **Not a substitute for official verification** — Qadam explicitly displays a disclaimer on every action plan recommending the user verify eligibility with the issuing authority directly.

## Future Improvements

- PDF support (text-layer extraction, falling back to OCR for scanned documents)
- Urdu-language UI and output
- Expanded document-type coverage beyond scholarships and domicile certificates
- Optional account-based history, for users who want to track multiple applications over time

---

Built for the **Build with Kiro 2026** hackathon.