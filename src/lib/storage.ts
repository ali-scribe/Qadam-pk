import type { ActionPlan, DocumentAnalysis } from "@/lib/types";

const ANALYSIS_KEY = "qadam_document_analysis";
const PLAN_KEY = "qadam_action_plan";

export function saveDocumentAnalysis(data: DocumentAnalysis): void {
  try {
    localStorage.setItem(ANALYSIS_KEY, JSON.stringify(data));
  } catch {
    // Storage quota exceeded or unavailable — fail silently
  }
}

export function loadDocumentAnalysis(): DocumentAnalysis | null {
  try {
    const raw = localStorage.getItem(ANALYSIS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DocumentAnalysis;
  } catch {
    return null;
  }
}

export function saveActionPlan(data: ActionPlan): void {
  try {
    localStorage.setItem(PLAN_KEY, JSON.stringify(data));
  } catch {
    // Fail silently
  }
}

export function loadActionPlan(): ActionPlan | null {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActionPlan;
  } catch {
    return null;
  }
}

export function clearAll(): void {
  try {
    localStorage.removeItem(ANALYSIS_KEY);
    localStorage.removeItem(PLAN_KEY);
  } catch {
    // Fail silently
  }
}
