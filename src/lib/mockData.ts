/**
 * Realistic demo data for the /result page.
 *
 * This represents the output of Stage 2 (ActionPlan) for a fictional
 * HEC Need-Based Scholarship application. It is used only for UI
 * demonstration. No AI is involved.
 */

import type { ActionPlan, DocumentAnalysis } from "@/lib/types";

export const MOCK_DOCUMENT_ANALYSIS: DocumentAnalysis = {
  readable: true,
  documentScope: "in_scope",
  documentType: "Scholarship Circular",
  purpose:
    "HEC Need-Based Scholarship Programme — Undergraduate students at HEC-recognised universities in Pakistan",
  eligibilityCriteria: [
    {
      id: "ec1",
      description: "Pakistani national enrolled in a recognised HEC university",
      evidence:
        "The applicant must be a citizen of Pakistan and enrolled as a full-time student at an HEC-recognised institution.",
    },
    {
      id: "ec2",
      description: "Undergraduate student (Bachelor's level only)",
      evidence:
        "This scholarship is open to undergraduate (Bachelor's degree) students only. Graduate and postgraduate students are not eligible.",
    },
    {
      id: "ec3",
      description: "Minimum CGPA of 2.5 on a 4.0 scale",
      evidence:
        "Applicants must maintain a minimum Cumulative Grade Point Average (CGPA) of 2.50 on a 4-point scale.",
    },
    {
      id: "ec4",
      description: "Family income below PKR 45,000 per month",
      evidence:
        "The combined monthly household income of the applicant's family shall not exceed PKR 45,000.",
    },
    {
      id: "ec5",
      description: "Domicile of Punjab, KPK, Balochistan, Sindh, or AJK",
      evidence:
        "Applicant must possess a valid domicile certificate issued by their home province or territory.",
    },
  ],
  requiredDocuments: [
    {
      id: "rd1",
      description: "Duly filled application form (HEC Form-B)",
      evidence: "Submit HEC Form-B, duly filled and signed by the applicant.",
    },
    {
      id: "rd2",
      description: "Attested copy of CNIC / B-Form",
      evidence:
        "Attested photocopy of the applicant's CNIC or, for students under 18, B-Form.",
    },
    {
      id: "rd3",
      description: "Official transcript with CGPA (attested by Registrar)",
      evidence:
        "Official academic transcript attested by the university Registrar, showing current CGPA.",
    },
    {
      id: "rd4",
      description: "Family income certificate (from Union Council or Tehsildar)",
      evidence:
        "Income certificate issued by the Union Council, Tehsildar, or Revenue Officer confirming family income.",
    },
    {
      id: "rd5",
      description: "Domicile certificate (attested)",
      evidence: "Attested copy of domicile certificate issued by local authority.",
    },
    {
      id: "rd6",
      description: "Two recent passport-size photographs",
      evidence: "Two recent coloured passport-size photographs.",
    },
  ],
  deadlines: [
    {
      label: "Application submission deadline",
      date: "March 31, 2026",
      evidence:
        "The last date for submission of applications is 31st March, 2026. Late applications will not be entertained.",
    },
    {
      label: "Document verification",
      date: "April 15, 2026",
      evidence:
        "All supporting documents must be verified and submitted to the university focal person by 15th April, 2026.",
    },
  ],
  fees: [
    {
      label: "Application fee",
      amount: null,
      evidence: null,
    },
  ],
  applicationSteps: [
    {
      order: 1,
      description: "Download HEC Form-B from the HEC website (hec.gov.pk)",
      evidence: "Application forms are available at www.hec.gov.pk/scholarships",
    },
    {
      order: 2,
      description: "Fill in all sections of the form completely",
      evidence:
        "Incomplete forms will be rejected without further correspondence.",
    },
    {
      order: 3,
      description: "Collect all required attested documents",
      evidence: null,
    },
    {
      order: 4,
      description:
        "Submit the complete application to your university's Scholarship/Financial Aid Office",
      evidence:
        "Applications must be submitted through the university's designated scholarship coordinator.",
    },
    {
      order: 5,
      description:
        "University forwards shortlisted applications to HEC by the verification deadline",
      evidence: null,
    },
  ],
  warnings: [
    {
      description:
        "Incomplete or late applications will be rejected without notice.",
      evidence:
        "HEC reserves the right to reject incomplete applications or those submitted after the deadline.",
    },
    {
      description:
        "Providing false information is grounds for immediate disqualification and legal action.",
      evidence:
        "Any misrepresentation of facts will result in disqualification and may lead to legal proceedings.",
    },
  ],
  unknownFields: ["Scholarship amount / stipend value"],
  questionsForUser: [],
};

export const MOCK_ACTION_PLAN: ActionPlan = {
  eligibilityVerdict: "likely_eligible",
  verdictRationale:
    "Based on your answers, you appear to meet the core eligibility criteria: Pakistani national, enrolled as an undergraduate, CGPA above the 2.5 threshold, family income within the limit, and a valid domicile. Your main remaining risk is ensuring all attested documents are ready before the March 31 deadline.",
  satisfiedCriteria: [
    {
      text: "Pakistani national enrolled in a recognised HEC university",
      evidence:
        "The applicant must be a citizen of Pakistan and enrolled as a full-time student at an HEC-recognised institution.",
    },
    {
      text: "Undergraduate student (Bachelor's level only)",
      evidence:
        "This scholarship is open to undergraduate (Bachelor's degree) students only.",
    },
    {
      text: "Minimum CGPA of 2.5 on a 4.0 scale",
      evidence:
        "Applicants must maintain a minimum Cumulative Grade Point Average (CGPA) of 2.50 on a 4-point scale.",
    },
    {
      text: "Family income below PKR 45,000 per month",
      evidence:
        "The combined monthly household income of the applicant's family shall not exceed PKR 45,000.",
    },
  ],
  unmetCriteria: [],
  unknownCriteria: [
    {
      text: "Valid domicile certificate for eligible province/territory",
      evidence:
        "Applicant must possess a valid domicile certificate issued by their home province or territory.",
    },
  ],
  actionItems: [
    {
      title: "Get your domicile certificate confirmed",
      description:
        "You did not confirm whether you have a valid domicile certificate. If you do not have one, apply at your local Tehsil Office immediately — it can take 2–4 weeks to process.",
      evidence:
        "Applicant must possess a valid domicile certificate issued by their home province or territory.",
      deadline: "Well before March 31, 2026",
    },
    {
      title: "Download HEC Form-B",
      description:
        "Go to hec.gov.pk/scholarships and download the latest version of Form-B. Do not use older printed copies.",
      evidence: "Application forms are available at www.hec.gov.pk/scholarships",
      deadline: "As soon as possible",
    },
    {
      title: "Obtain attested transcript from your Registrar",
      description:
        "Request an official academic transcript from your university Registrar's office. Ensure it shows your current CGPA and is attested. Processing times vary — request it now.",
      evidence:
        "Official academic transcript attested by the university Registrar, showing current CGPA.",
      deadline: "Allow 5–10 working days",
    },
    {
      title: "Get your family income certificate",
      description:
        "Visit your local Union Council, Tehsildar, or Revenue Officer to obtain a family income certificate confirming combined household income.",
      evidence:
        "Income certificate issued by the Union Council, Tehsildar, or Revenue Officer confirming family income.",
      deadline: "Allow 3–7 working days",
    },
    {
      title: "Collect remaining documents",
      description:
        "Gather attested copies of your CNIC (or B-Form if under 18), two recent passport-size photographs, and your attested domicile certificate.",
      evidence:
        "Attested photocopy of the applicant's CNIC or, for students under 18, B-Form.",
      deadline: null,
    },
    {
      title: "Submit complete application to your university",
      description:
        "Submit the fully completed HEC Form-B and all attested documents to your university's Scholarship / Financial Aid Office. Do not submit directly to HEC — your university forwards the application.",
      evidence:
        "Applications must be submitted through the university's designated scholarship coordinator.",
      deadline: "March 31, 2026",
    },
    {
      title: "Follow up on university forwarding status",
      description:
        "After submission, check with your university's focal person that your application has been included in the batch forwarded to HEC by April 15, 2026.",
      evidence:
        "All supporting documents must be verified and submitted to the university focal person by 15th April, 2026.",
      deadline: "April 15, 2026",
    },
  ],
};
