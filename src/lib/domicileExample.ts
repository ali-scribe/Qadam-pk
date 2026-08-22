// Example data for the "Try a government service example" demo flow.
// Matches DocumentAnalysis and ActionPlan exactly as defined in src/lib/types.ts.
// Hand-authored to mirror what Gemini would realistically return for the
// demo/government-sample.jpg document — used so the full pipeline UI can be
// demonstrated and tested without a live Gemini API call.

import type { DocumentAnalysis, ActionPlan } from "./types";

export const DOMICILE_EXAMPLE_ANALYSIS: DocumentAnalysis = {
  readable: true,
  documentScope: "in_scope",
  documentType: "Government Service Information Sheet",
  purpose:
    "Explains the application requirements, fees, and process for obtaining a Domicile Certificate from the Punjab e-Khidmat Markaz service.",
  eligibilityCriteria: [
    {
      id: "elig-1",
      description:
        "Applicant must be a permanent resident of the district in which the certificate is sought, or a woman married to a permanent resident of Punjab.",
      evidence:
        "Applicant must be a permanent resident of the district in which the certificate is sought, or a woman married to a permanent resident of Punjab.",
    },
    {
      id: "elig-2",
      description:
        "Applicant (or applicant's father) must have resided in the district for at least three continuous years, unless established through property ownership.",
      evidence:
        "Applicant (or applicant's father) must have resided in the district for a continuous period of not less than three years, unless residency is established through property ownership.",
    },
  ],
  requiredDocuments: [
    {
      id: "doc-1",
      description: "Duly filled Form P and P1",
      evidence: "Duly filled Form P and P1, signed by the applicant",
    },
    {
      id: "doc-2",
      description: "Copy of applicant's CNIC (or B-Form if a minor)",
      evidence: "Copy of applicant's CNIC (or B-Form if applicant is a minor)",
    },
    {
      id: "doc-3",
      description: "Copy of father's CNIC",
      evidence: "Copy of father's CNIC",
    },
    {
      id: "doc-4",
      description: "Proof of residence",
      evidence: "Proof of residence (utility bill or property ownership document)",
    },
    {
      id: "doc-5",
      description: "Affidavit on Rs. 50 stamp paper, attested by an Oath Commissioner",
      evidence: "Affidavit on Rs. 50 stamp paper, attested by an Oath Commissioner",
    },
  ],
  deadlines: [],
  fees: [
    {
      label: "Domicile Fee",
      amount: "PKR 200",
      evidence:
        "Domicile Fee: Rs. 200 (payable via PSID through ATM, mobile banking, or over-the-counter at National Bank of Pakistan)",
    },
    {
      label: "e-Khidmat Markaz Service Charge",
      amount: "PKR 50–100",
      evidence: "e-Khidmat Markaz Service Charge: Rs. 50 to Rs. 100, depending on facilitation center",
    },
  ],
  applicationSteps: [
    {
      order: 1,
      description: "Fill Form P and P1 and gather all required supporting documents.",
      evidence: null,
    },
    {
      order: 2,
      description: "Pay the domicile fee and service charge at the facilitation center.",
      evidence: null,
    },
    {
      order: 3,
      description: "Submit the application at the e-Khidmat Markaz facilitation counter.",
      evidence: null,
    },
    {
      order: 4,
      description: "Await SMS notification once the certificate is ready for collection.",
      evidence: "Applicants will receive an SMS notification once the certificate is ready for collection.",
    },
  ],
  warnings: [
    {
      description: "Incomplete applications will not be accepted at the facilitation counter.",
      evidence: "Incomplete applications will not be accepted at the facilitation counter.",
    },
  ],
  unknownFields: [
    "The document does not clearly state whether the affidavit or proof-of-residence documents have a maximum allowed age at time of submission.",
  ],
  questionsForUser: [
    {
      id: "q-resident",
      question: "Are you a permanent resident of the district where you are applying, or a woman married to a Punjab resident?",
      fieldType: "text",
      required: true,
      relevantCriterionId: "elig-1",
    },
    {
      id: "q-years",
      question: "Have you (or your father) resided in this district for at least 3 continuous years, or do you own property there?",
      fieldType: "text",
      required: true,
      relevantCriterionId: "elig-2",
    },
  ],
};

export const DOMICILE_EXAMPLE_ANSWERS: Record<string, string> = {
  "q-resident": "Yes, permanent resident",
  "q-years": "Yes, lived here for 12 years",
};

export const DOMICILE_EXAMPLE_PLAN: ActionPlan = {
  eligibilityVerdict: "likely_eligible",
  verdictRationale:
    "Your answers confirm both stated eligibility conditions: permanent residency in the district and a qualifying period of continuous residence well beyond the 3-year minimum.",
  satisfiedCriteria: [
    {
      text: "Permanent resident of the district",
      evidence:
        "Applicant must be a permanent resident of the district in which the certificate is sought, or a woman married to a permanent resident of Punjab.",
    },
    {
      text: "Meets the minimum 3-year continuous residence requirement",
      evidence:
        "Applicant (or applicant's father) must have resided in the district for a continuous period of not less than three years, unless residency is established through property ownership.",
    },
  ],
  unmetCriteria: [],
  unknownCriteria: [
    {
      text: "Whether your proof-of-residence document meets any unstated recency requirement",
      evidence: null,
    },
  ],
  actionItems: [
    {
      title: "Fill Form P and P1",
      description: "Complete both required forms and sign them as the applicant.",
      evidence: "Duly filled Form P and P1, signed by the applicant",
      deadline: null,
    },
    {
      title: "Prepare an affidavit",
      description:
        "Have an affidavit prepared on Rs. 50 stamp paper and attested by an Oath Commissioner.",
      evidence: "Affidavit on Rs. 50 stamp paper, attested by an Oath Commissioner",
      deadline: null,
    },
    {
      title: "Gather CNIC copies and proof of residence",
      description:
        "Collect a copy of your own CNIC, your father's CNIC, and a utility bill or property document showing your address.",
      evidence: "Proof of residence (utility bill or property ownership document)",
      deadline: null,
    },
    {
      title: "Pay fees and submit at an e-Khidmat Markaz",
      description:
        "Pay the Rs. 200 domicile fee plus the facilitation center's service charge, then submit your complete application in person.",
      evidence:
        "Domicile Fee: Rs. 200 (payable via PSID through ATM, mobile banking, or over-the-counter at National Bank of Pakistan)",
      deadline: null,
    },
  ],
};
