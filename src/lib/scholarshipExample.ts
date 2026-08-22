// Example data for the "Try a scholarship example" demo flow.
// Matches DocumentAnalysis and ActionPlan exactly as defined in src/lib/types.ts.
// This data is hand-authored to mirror what Gemini would realistically return
// for the demo/scholarship-sample.jpg document — used so the full pipeline UI
// can be demonstrated and tested without a live Gemini API call.

import type { DocumentAnalysis, ActionPlan } from "./types";

export const SCHOLARSHIP_EXAMPLE_ANALYSIS: DocumentAnalysis = {
  readable: true,
  documentScope: "in_scope",
  documentType: "Scholarship Notification",
  purpose:
    "Announces the HEC Need-Based Undergraduate Scholarship (NBS) for the 2026 cycle, providing a monthly stipend and tuition coverage to financially deserving undergraduate students.",
  eligibilityCriteria: [
    {
      id: "elig-1",
      description:
        "Applicant must be enrolled in, or have secured admission to, a 4-year undergraduate program at a public sector university recognized by HEC.",
      evidence:
        "Applicant must be enrolled in, or have secured admission to, a 4-year undergraduate program at a public sector university recognized by the Higher Education Commission.",
    },
    {
      id: "elig-2",
      description: "Applicant must hold Pakistani nationality, verifiable through a valid CNIC or Form-B.",
      evidence:
        "Applicant must hold Pakistani nationality, verifiable through a valid CNIC or Form-B.",
    },
    {
      id: "elig-3",
      description: "Combined family monthly income must not exceed Rs. 45,000.",
      evidence:
        "Combined family monthly income must not exceed Rs. 45,000, as certified by an authorized income certificate issued by the relevant Union Council.",
    },
    {
      id: "elig-4",
      description: "Applicant must maintain a minimum CGPA of 2.0 in each preceding semester.",
      evidence:
        "Applicant must maintain a minimum CGPA of 2.0 in each preceding semester to remain eligible for renewal in subsequent years.",
    },
    {
      id: "elig-5",
      description: "Applicant must not currently be receiving any other full government-funded scholarship.",
      evidence:
        "Applicant must not be a current recipient of any other full government-funded scholarship at the time of application.",
    },
  ],
  requiredDocuments: [
    {
      id: "doc-1",
      description: "Duly filled NBS application form",
      evidence: "Duly filled NBS application form (available on the university FAO portal)",
    },
    {
      id: "doc-2",
      description: "Copy of CNIC (applicant) and CNIC (father/guardian)",
      evidence: "Copy of CNIC (applicant) and CNIC (father/guardian)",
    },
    {
      id: "doc-3",
      description: "Income certificate issued by Union Council, not older than 3 months",
      evidence: "Income certificate issued by Union Council, not older than 3 months",
    },
    {
      id: "doc-4",
      description: "Latest semester transcript / result card",
      evidence: "Latest semester transcript / result card",
    },
  ],
  deadlines: [
    {
      label: "Application submission deadline",
      date: "2026-09-30",
      evidence:
        "Applications must be submitted through the university Financial Assistance Office (FAO) on or before 30th September 2026.",
    },
  ],
  fees: [
    {
      label: "Monthly stipend amount",
      amount: "PKR 6,000/month",
      evidence: "The scholarship provides a monthly stipend of Rs. 6,000 along with full tuition fee coverage.",
    },
  ],
  applicationSteps: [
    {
      order: 1,
      description: "Obtain and fill the NBS application form from the university FAO portal.",
      evidence: null,
    },
    {
      order: 2,
      description: "Collect required supporting documents (CNIC copies, income certificate, transcript).",
      evidence: null,
    },
    {
      order: 3,
      description: "Submit the completed application to the university Financial Assistance Office.",
      evidence:
        "Applications must be submitted through the university Financial Assistance Office (FAO).",
    },
  ],
  warnings: [
    {
      description: "Late submissions will not be entertained under any circumstance.",
      evidence: "Late submissions will not be entertained under any circumstance.",
    },
    {
      description: "Submission of false information will result in immediate disqualification.",
      evidence: "Submission of false information will result in immediate disqualification.",
    },
  ],
  unknownFields: [
    "Whether a bank statement or additional financial proof is required beyond the income certificate is not stated in the document.",
  ],
  questionsForUser: [
    {
      id: "q-enrolled",
      question: "Are you currently enrolled in, or admitted to, a 4-year undergraduate program at an HEC-recognized public university?",
      fieldType: "text",
      required: true,
      relevantCriterionId: "elig-1",
    },
    {
      id: "q-cnic",
      question: "Do you hold a valid Pakistani CNIC or Form-B?",
      fieldType: "text",
      required: true,
      relevantCriterionId: "elig-2",
    },
    {
      id: "q-income",
      question: "What is your combined family monthly income (in PKR)?",
      fieldType: "text",
      required: true,
      relevantCriterionId: "elig-3",
    },
    {
      id: "q-cgpa",
      question: "What is your current CGPA?",
      fieldType: "text",
      required: true,
      relevantCriterionId: "elig-4",
    },
    {
      id: "q-other-scholarship",
      question: "Are you currently receiving any other full government-funded scholarship?",
      fieldType: "text",
      required: true,
      relevantCriterionId: "elig-5",
    },
  ],
};

export const SCHOLARSHIP_EXAMPLE_ANSWERS: Record<string, string> = {
  "q-enrolled": "Yes, 3rd semester at a public university",
  "q-cnic": "Yes",
  "q-income": "38000",
  "q-cgpa": "3.4",
  "q-other-scholarship": "No",
};

export const SCHOLARSHIP_EXAMPLE_PLAN: ActionPlan = {
  eligibilityVerdict: "likely_eligible",
  verdictRationale:
    "Your answers satisfy all five stated eligibility criteria: you are enrolled in an eligible program, hold valid identification, your family income falls below the Rs. 45,000 threshold, your CGPA exceeds the 2.0 minimum, and you are not currently receiving another full scholarship.",
  satisfiedCriteria: [
    {
      text: "Enrolled in an HEC-recognized public sector undergraduate program",
      evidence:
        "Applicant must be enrolled in, or have secured admission to, a 4-year undergraduate program at a public sector university recognized by the Higher Education Commission.",
    },
    {
      text: "Holds valid Pakistani identification",
      evidence: "Applicant must hold Pakistani nationality, verifiable through a valid CNIC or Form-B.",
    },
    {
      text: "Family income (PKR 38,000) is below the Rs. 45,000 threshold",
      evidence:
        "Combined family monthly income must not exceed Rs. 45,000, as certified by an authorized income certificate issued by the relevant Union Council.",
    },
    {
      text: "CGPA (3.4) exceeds the 2.0 minimum requirement",
      evidence: "Applicant must maintain a minimum CGPA of 2.0 in each preceding semester.",
    },
    {
      text: "Not currently receiving another full government scholarship",
      evidence:
        "Applicant must not be a current recipient of any other full government-funded scholarship at the time of application.",
    },
  ],
  unmetCriteria: [],
  unknownCriteria: [
    {
      text: "Whether additional financial proof beyond the income certificate will be requested during review",
      evidence: null,
    },
  ],
  actionItems: [
    {
      title: "Obtain an income certificate",
      description:
        "Visit your local Union Council office to request an official income certificate. It must not be older than 3 months at the time of submission.",
      evidence: "Income certificate issued by Union Council, not older than 3 months",
      deadline: "2026-09-30",
    },
    {
      title: "Collect CNIC copies",
      description: "Prepare clear photocopies of your own CNIC and your father's or guardian's CNIC.",
      evidence: "Copy of CNIC (applicant) and CNIC (father/guardian)",
      deadline: null,
    },
    {
      title: "Request your latest transcript",
      description: "Obtain your most recent semester transcript or result card from your university's examination department.",
      evidence: "Latest semester transcript / result card",
      deadline: null,
    },
    {
      title: "Submit your application through the FAO",
      description:
        "Submit the completed NBS application form along with all supporting documents to your university's Financial Assistance Office before the deadline.",
      evidence:
        "Applications must be submitted through the university Financial Assistance Office (FAO) on or before 30th September 2026.",
      deadline: "2026-09-30",
    },
  ],
};
