/**
 * Runtime type guards for Gemini API responses.
 *
 * These guards are the last line of defence before AI output reaches the
 * client. Both functions mutate the parsed object where needed (coercing
 * missing evidence keys to null) before checking — so the caller receives
 * a normalised object that matches the TypeScript type exactly.
 *
 * Neither function throws. Both return false on any failure so the route
 * can return HTTP 500 with a user-facing message.
 */

import type {
  ActionPlan,
  DocumentAnalysis,
  EligibilityVerdict,
} from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isStringOrNull(v: unknown): v is string | null {
  return v === null || typeof v === "string";
}

function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Coerce a missing or undefined evidence key to null on an object. */
function coerceEvidence(item: Record<string, unknown>): void {
  if (!("evidence" in item)) {
    item["evidence"] = null;
  }
}

// ─── isDocumentAnalysis ───────────────────────────────────────────────────────

/**
 * 7.1 — Validates and normalises a raw Gemini response as DocumentAnalysis.
 *
 * Coerces missing `evidence` keys to null on:
 *   eligibilityCriteria, requiredDocuments, deadlines, fees
 *
 * Returns false if any required field is missing or the wrong type.
 */
export function isDocumentAnalysis(value: unknown): value is DocumentAnalysis {
  if (!isObject(value)) return false;

  // readable — boolean
  if (typeof value.readable !== "boolean") return false;

  // documentScope — string literal union
  if (
    value.documentScope !== "in_scope" &&
    value.documentScope !== "out_of_scope"
  )
    return false;

  // documentType — string | null
  if (!isStringOrNull(value.documentType)) return false;

  // purpose — string | null
  if (!isStringOrNull(value.purpose)) return false;

  // All eight array fields must be arrays
  const arrayFields = [
    "eligibilityCriteria",
    "requiredDocuments",
    "deadlines",
    "fees",
    "applicationSteps",
    "warnings",
    "unknownFields",
    "questionsForUser",
  ] as const;

  for (const field of arrayFields) {
    if (!isArray(value[field])) return false;
  }

  // Coerce missing evidence keys to null on the four evidence-bearing arrays,
  // then validate each element's required fields.

  // eligibilityCriteria
  for (const item of value.eligibilityCriteria as unknown[]) {
    if (!isObject(item)) return false;
    coerceEvidence(item);
    if (typeof item.id !== "string") return false;
    if (typeof item.description !== "string") return false;
    if (!isStringOrNull(item.evidence)) return false;
  }

  // requiredDocuments
  for (const item of value.requiredDocuments as unknown[]) {
    if (!isObject(item)) return false;
    coerceEvidence(item);
    if (typeof item.id !== "string") return false;
    if (typeof item.description !== "string") return false;
    if (!isStringOrNull(item.evidence)) return false;
  }

  // deadlines
  for (const item of value.deadlines as unknown[]) {
    if (!isObject(item)) return false;
    coerceEvidence(item);
    if (typeof item.label !== "string") return false;
    if (!isStringOrNull(item.date)) return false;
    if (!isStringOrNull(item.evidence)) return false;
  }

  // fees
  for (const item of value.fees as unknown[]) {
    if (!isObject(item)) return false;
    coerceEvidence(item);
    if (typeof item.label !== "string") return false;
    if (!isStringOrNull(item.amount)) return false;
    if (!isStringOrNull(item.evidence)) return false;
  }

  // applicationSteps — evidence optional but coerced
  for (const item of value.applicationSteps as unknown[]) {
    if (!isObject(item)) return false;
    coerceEvidence(item);
    if (typeof item.order !== "number") return false;
    if (typeof item.description !== "string") return false;
    if (!isStringOrNull(item.evidence)) return false;
  }

  // warnings — evidence optional but coerced
  for (const item of value.warnings as unknown[]) {
    if (!isObject(item)) return false;
    coerceEvidence(item);
    if (typeof item.description !== "string") return false;
    if (!isStringOrNull(item.evidence)) return false;
  }

  // unknownFields — array of strings
  for (const item of value.unknownFields as unknown[]) {
    if (typeof item !== "string") return false;
  }

  // questionsForUser
  const validFieldTypes = new Set(["text", "number", "select", "boolean"]);
  for (const item of value.questionsForUser as unknown[]) {
    if (!isObject(item)) return false;
    if (typeof item.id !== "string") return false;
    if (typeof item.question !== "string") return false;
    if (!validFieldTypes.has(item.fieldType as string)) return false;
    if (typeof item.required !== "boolean") return false;
    if (typeof item.relevantCriterionId !== "string") return false;
    // options is optional — only required when fieldType === 'select'
    if (item.fieldType === "select") {
      if (!isArray(item.options)) return false;
    }
  }

  return true;
}

// ─── isActionPlan ─────────────────────────────────────────────────────────────

/**
 * 7.2 — Validates a raw Gemini response as ActionPlan.
 *
 * Returns false if any required field is missing or the wrong type.
 */
export function isActionPlan(value: unknown): value is ActionPlan {
  if (!isObject(value)) return false;

  // eligibilityVerdict — string literal union
  const validVerdicts: EligibilityVerdict[] = [
    "likely_eligible",
    "likely_not_eligible",
    "cannot_determine",
  ];
  if (!validVerdicts.includes(value.eligibilityVerdict as EligibilityVerdict))
    return false;

  // verdictRationale — string
  if (typeof value.verdictRationale !== "string") return false;

  // All four array fields must be arrays
  const arrayFields = [
    "satisfiedCriteria",
    "unmetCriteria",
    "unknownCriteria",
    "actionItems",
  ] as const;

  for (const field of arrayFields) {
    if (!isArray(value[field])) return false;
  }

  // satisfiedCriteria
  for (const item of value.satisfiedCriteria as unknown[]) {
    if (!isObject(item)) return false;
    if (typeof item.text !== "string") return false;
    if (!isStringOrNull(item.evidence)) return false;
  }

  // unmetCriteria
  for (const item of value.unmetCriteria as unknown[]) {
    if (!isObject(item)) return false;
    if (typeof item.text !== "string") return false;
    if (typeof item.reason !== "string") return false;
    if (!isStringOrNull(item.evidence)) return false;
  }

  // unknownCriteria
  for (const item of value.unknownCriteria as unknown[]) {
    if (!isObject(item)) return false;
    if (typeof item.text !== "string") return false;
    if (!isStringOrNull(item.evidence)) return false;
  }

  // actionItems
  for (const item of value.actionItems as unknown[]) {
    if (!isObject(item)) return false;
    if (typeof item.title !== "string") return false;
    if (typeof item.description !== "string") return false;
    if (!isStringOrNull(item.evidence)) return false;
    if (!isStringOrNull(item.deadline)) return false;
  }

  return true;
}
