/**
 * AI prompt templates for Qadam's two-stage pipeline.
 *
 * These are the most important files in the application — they directly
 * control what Gemini extracts and how it reasons. Any change to either
 * function requires a full end-to-end manual retest (see testing.md).
 *
 * Both prompts embed the complete target JSON schema so Gemini has an
 * unambiguous structure to fill. The schemas must stay in sync with
 * lib/types.ts — if a type changes, update the schema here too.
 */

import type { DocumentAnalysis } from "@/lib/types";

// ─── Stage 1 schema (must match DocumentAnalysis in lib/types.ts) ─────────────

const DOCUMENT_ANALYSIS_SCHEMA = `
{
  "readable": boolean,
  "documentScope": "in_scope" | "out_of_scope",
  "documentType": string | null,
  "purpose": string | null,
  "eligibilityCriteria": [
    {
      "id": string,
      "description": string,
      "evidence": string | null
    }
  ],
  "requiredDocuments": [
    {
      "id": string,
      "description": string,
      "evidence": string | null
    }
  ],
  "deadlines": [
    {
      "label": string,
      "date": string | null,
      "evidence": string | null
    }
  ],
  "fees": [
    {
      "label": string,
      "amount": string | null,
      "evidence": string | null
    }
  ],
  "applicationSteps": [
    {
      "order": number,
      "description": string,
      "evidence": string | null
    }
  ],
  "warnings": [
    {
      "description": string,
      "evidence": string | null
    }
  ],
  "unknownFields": [string],
  "questionsForUser": [
    {
      "id": string,
      "question": string,
      "fieldType": "text" | "number" | "select" | "boolean",
      "options": [string] | undefined,
      "required": boolean,
      "relevantCriterionId": string
    }
  ]
}
`.trim();

// ─── Stage 2 schema (must match ActionPlan in lib/types.ts) ──────────────────

const ACTION_PLAN_SCHEMA = `
{
  "eligibilityVerdict": "likely_eligible" | "likely_not_eligible" | "cannot_determine",
  "verdictRationale": string,
  "satisfiedCriteria": [
    {
      "text": string,
      "evidence": string | null
    }
  ],
  "unmetCriteria": [
    {
      "text": string,
      "reason": string,
      "evidence": string | null
    }
  ],
  "unknownCriteria": [
    {
      "text": string,
      "evidence": string | null
    }
  ],
  "actionItems": [
    {
      "title": string,
      "description": string,
      "evidence": string | null,
      "deadline": string | null
    }
  ]
}
`.trim();

// ─── Stage 1: document analysis prompt ───────────────────────────────────────

/**
 * Builds the Stage 1 prompt sent to Gemini together with the document image.
 *
 * The prompt instructs Gemini to:
 * - Identify and extract all structured information from the document
 * - Use null for any field not explicitly stated (never guess or fabricate)
 * - Produce verbatim evidence excerpts for every claim
 * - Signal unreadable or out-of-scope documents via flags
 * - Generate only document-specific profile questions
 */
export function buildStage1Prompt(): string {
  return `
You are analyzing a document image from Pakistan. The document may be in English, Urdu, or a mix of both. Your task is to extract structured information from the document and return it as a single JSON object matching the schema below.

## CRITICAL RULES — read carefully before responding

**Null discipline:**
If a field's value is not stated in the document, set it to null. Do not guess, infer, or fabricate values. Only state what the document explicitly says.

**Evidence discipline:**
For every "evidence" field, copy a verbatim excerpt from the visible document text that directly supports the extracted value. The excerpt must be text you can see in the image. If you cannot identify a specific excerpt from the document text, set "evidence" to null. Do not paraphrase or invent evidence text.

**Readability check:**
If the image is too blurry, dark, rotated, or unclear to extract meaningful information, set "readable" to false and set all other fields to null or empty arrays. Do not attempt to guess content from an unclear image.

**Scope check:**
If the uploaded image does not appear to be a Pakistani institutional document (scholarship, government service, university admission, or similar), set "documentScope" to "out_of_scope". Examples of out-of-scope images: selfies, random photos, receipts, menus, unrelated documents. If it is a recognisable institutional document, set "documentScope" to "in_scope".

**Question generation:**
Generate only the profile questions whose answers are necessary to assess eligibility for THIS specific document. Do not generate generic questions unrelated to the document's criteria. For each question, set "relevantCriterionId" to the "id" of the eligibility criterion it is assessing. If no questions are needed, return an empty array.

**fieldType guidance for questionsForUser:**
- Use "text" for open-ended answers (e.g. institution name, city)
- Use "number" for numeric answers (e.g. CGPA, age, income)
- Use "boolean" for yes/no answers (e.g. "Are you a Pakistani national?")
- Use "select" for answers from a fixed list — include the "options" array

**unknownFields:**
List the names of any schema fields that exist for this document type but whose values could not be determined from the image (e.g. "fees" if fees are not mentioned). Use the schema field names as listed below.

## OUTPUT SCHEMA

Return ONLY the following JSON object. No explanation, no markdown, no wrapping text:

${DOCUMENT_ANALYSIS_SCHEMA}

## DOCUMENT IMAGE

Analyse the document image provided with this prompt.
`.trim();
}

// ─── Stage 2: eligibility reasoning + action plan prompt ─────────────────────

/**
 * Builds the Stage 2 prompt sent to Gemini as a text-only request.
 *
 * The prompt instructs Gemini to:
 * - Classify each extracted criterion as satisfied / unmet / unknown
 *   based solely on the user's answers — never assume satisfaction
 * - Produce an eligibility verdict with rationale
 * - Generate an ordered action plan (deadlines first, prerequisites first)
 * - Set deadline to null for any action item with no stated deadline
 */
export function buildStage2Prompt(
  analysis: DocumentAnalysis,
  answers: Record<string, string>
): string {
  const answersFormatted =
    Object.keys(answers).length === 0
      ? "(No answers provided — assess all criteria as unknown unless evident from the document alone)"
      : Object.entries(answers)
          .map(([id, value]) => `  ${id}: ${value}`)
          .join("\n");

  return `
You are assessing whether a user is eligible for the following Pakistani institutional document, and producing a personalised action plan.

## CRITICAL RULES — read carefully before responding

**Eligibility assessment:**
Based only on the extracted document criteria and the user's answers below, determine whether the user appears to be eligible. Use "cannot_determine" if the available information is insufficient to make a reasonable assessment.

**Criterion classification:**
For each eligibility criterion from the document analysis:
- Mark as "satisfied" if the user's answer directly confirms it is met.
- Mark as "unmet" if the user's answer shows the criterion is not met.
- Mark as "unknown" if the user's answer is missing, ambiguous, or insufficient to determine satisfaction.
Never mark a criterion as satisfied without a confirming answer from the user.

**Action plan ordering:**
Order actionItems by urgency and dependency: deadline-driven items first, prerequisite documents before the steps that require them.

**Null discipline:**
If an action item has no stated deadline in the document, set "deadline" to null. Do not invent dates.

**Evidence discipline:**
For every "evidence" field in satisfiedCriteria, unmetCriteria, unknownCriteria, and actionItems: copy the verbatim excerpt from the document analysis that supports the claim. If no specific excerpt is available, set "evidence" to null.

## DOCUMENT ANALYSIS (Stage 1 output)

${JSON.stringify(analysis, null, 2)}

## USER ANSWERS

${answersFormatted}

## OUTPUT SCHEMA

Return ONLY the following JSON object. No explanation, no markdown, no wrapping text:

${ACTION_PLAN_SCHEMA}
`.trim();
}
