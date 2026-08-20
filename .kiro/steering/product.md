# Qadam — Product Steering

## What Qadam Is

Qadam is a Pakistan-focused AI application that transforms confusing government, university, scholarship, and bureaucratic documents into personalized, evidence-backed action plans.

The name "Qadam" (قدم) means "step" in Urdu — reflecting the product's core promise: turning an overwhelming document into a clear set of next steps.

## The Problem

Pakistani citizens regularly encounter documents they cannot act on confidently:

- Scholarship circulars with dense eligibility criteria written in formal Urdu or bureaucratic English
- Government service requirement lists with unclear fees, deadlines, and document checklists
- University admission notices with conditional criteria buried in fine print
- Forms that reference other forms, domicile certificates, attested copies, and NOCs without explaining what those actually are

The result is that eligible people miss opportunities, submit incomplete applications, or give up entirely — not because they are ineligible, but because the process is opaque.

## Target Users

- Pakistani university students applying for scholarships or admissions
- Scholarship applicants navigating HEC, provincial, or institutional funding
- Citizens dealing with NADRA, passport, domicile, or other government services
- People who are unfamiliar with bureaucratic processes and have no institutional support

These users may have limited time, limited English proficiency (documents may be in Urdu or mixed), and no access to advisors or lawyers.

## The Core Mechanism

Qadam is not a chatbot. It is not a document summarizer. The central mechanism is a structured pipeline:

```
Unstructured document → Structured extraction → Personalized reasoning → Actionable plan
```

1. The user uploads a document image or screenshot
2. AI identifies what the document is and what it governs
3. AI extracts eligibility criteria, required documents, deadlines, fees, and application steps
4. Qadam asks only the profile questions relevant to that specific document's criteria
5. AI reasons about whether the user appears eligible, based on their answers
6. Qadam identifies which requirements the user has met, which are missing, and which cannot be determined
7. Qadam produces an ordered action plan
8. Important claims are backed by evidence excerpted from the source document
9. Information that cannot be determined from the document is marked as unknown — never guessed

This pipeline runs on every document regardless of category. There is no separate logic for scholarships vs. government services vs. university documents.

## MVP Boundary

The MVP includes:

- Document image upload (photo, screenshot, scan)
- Two-stage AI pipeline (extraction, then reasoning + plan)
- Dynamic question generation based on extracted criteria
- Eligibility verdict with supporting reasoning
- Ordered action plan with evidence citations
- Clear handling of unknown/unclear information
- Client-side session state only
- English-language interface and output

The MVP does not include:

- User authentication or accounts
- A database or persistent server-side storage
- PDF text extraction or multi-page document handling
- A language selector (Urdu UI output)
- Mobile native application
- Broad coverage of every Pakistani document type — 2–3 representative demo examples are sufficient
- Custom ML model training
- Paid APIs or paid infrastructure

## Evidence and Uncertainty — Non-Negotiable

The trust contract with the user is the product's most important property.

- Every important claim in the output must be traceable to a specific excerpt from the source document
- Claims based on inference (not directly stated) must be labeled as inference
- Information the document does not contain must be marked as "not stated in document" — never fabricated
- If the document is unreadable, ambiguous, or outside Qadam's scope, the user must be told clearly and honestly

Inventing a deadline, a fee, or an eligibility requirement in a high-stakes application context causes real harm. Qadam must never do this.

## What Qadam Is Not

- Not a generic AI chatbot that can answer arbitrary questions
- Not a document summarizer that produces the same output regardless of who the user is
- Not a legal or financial advisor
- Not a replacement for reading the original document — Qadam helps the user act on it
- Not a service that works on every type of document — it should degrade gracefully when it cannot help
