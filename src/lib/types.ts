// ─── Stage 1: Document Analysis ──────────────────────────────────────────────

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
  date: string | null; // null = not stated in document
  evidence: string | null;
}

export interface Fee {
  label: string;
  amount: string | null; // null = not stated in document
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
  fieldType: "text" | "number" | "select" | "boolean";
  options?: string[]; // only for fieldType === 'select'
  required: boolean;
  relevantCriterionId: string;
}

export interface DocumentAnalysis {
  readable: boolean;
  documentScope: "in_scope" | "out_of_scope";
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

// ─── Stage 2: Action Plan ─────────────────────────────────────────────────────

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
  | "likely_eligible"
  | "likely_not_eligible"
  | "cannot_determine";

export interface ActionPlan {
  eligibilityVerdict: EligibilityVerdict;
  verdictRationale: string;
  satisfiedCriteria: SatisfiedCriterion[];
  unmetCriteria: UnmetCriterion[];
  unknownCriteria: UnknownCriterion[];
  actionItems: ActionItem[];
}

// ─── Pipeline state ───────────────────────────────────────────────────────────

export type PipelineStage = "upload" | "summary" | "questions" | "plan";
