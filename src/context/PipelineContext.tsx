"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import type { ActionPlan, DocumentAnalysis, PipelineStage } from "@/lib/types";
import {
  clearAll,
  loadActionPlan,
  loadDocumentAnalysis,
  saveActionPlan,
  saveDocumentAnalysis,
} from "@/lib/storage";

// ─── State & action types ────────────────────────────────────────────────────

interface PipelineState {
  stage: PipelineStage;
  documentAnalysis: DocumentAnalysis | null;
  userAnswers: Record<string, string> | null;
  actionPlan: ActionPlan | null;
  /** True when the current session was loaded from a built-in example.
   *  Example sessions are NOT persisted to localStorage. */
  isExample: boolean;
  /** Pre-baked answers for the current example, or null in real sessions. */
  exampleAnswers: Record<string, string> | null;
  /** Pre-baked plan for the current example, or null in real sessions. */
  examplePlan: ActionPlan | null;
}

type PipelineAction =
  | { type: "SET_ANALYSIS"; payload: DocumentAnalysis }
  | { type: "SET_ANSWERS"; payload: Record<string, string> }
  | { type: "SET_PLAN"; payload: ActionPlan }
  | { type: "GO_TO"; payload: PipelineStage }
  | { type: "RESET" }
  | { type: "RESTORE"; payload: PipelineState }
  | {
      type: "LOAD_EXAMPLE";
      payload: {
        analysis: DocumentAnalysis;
        answers: Record<string, string>;
        plan: ActionPlan;
      };
    };

const INITIAL_STATE: PipelineState = {
  stage: "upload",
  documentAnalysis: null,
  userAnswers: null,
  actionPlan: null,
  isExample: false,
  exampleAnswers: null,
  examplePlan: null,
};

function reducer(state: PipelineState, action: PipelineAction): PipelineState {
  switch (action.type) {
    case "SET_ANALYSIS":
      return { ...state, documentAnalysis: action.payload, stage: "summary" };
    case "SET_ANSWERS":
      return { ...state, userAnswers: action.payload };
    case "SET_PLAN":
      return { ...state, actionPlan: action.payload, stage: "plan" };
    case "GO_TO":
      return { ...state, stage: action.payload };
    case "RESET":
      return INITIAL_STATE;
    case "RESTORE":
      return action.payload;
    case "LOAD_EXAMPLE":
      // Example sessions go straight to 'summary'; no localStorage write.
      return {
        ...INITIAL_STATE,
        isExample: true,
        documentAnalysis: action.payload.analysis,
        exampleAnswers: action.payload.answers,
        examplePlan: action.payload.plan,
        stage: "summary",
      };
    default:
      return state;
  }
}

// ─── Context value type ──────────────────────────────────────────────────────

export interface PipelineContextValue extends PipelineState {
  setDocumentAnalysis: (result: DocumentAnalysis) => void;
  setUserAnswers: (answers: Record<string, string>) => void;
  setActionPlan: (plan: ActionPlan) => void;
  goTo: (stage: PipelineStage) => void;
  reset: () => void;
  loadExample: (
    analysis: DocumentAnalysis,
    answers: Record<string, string>,
    plan: ActionPlan
  ) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

export const PipelineContext = createContext<PipelineContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function PipelineProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // Restore from localStorage on mount (real sessions only — example sessions
  // are in-memory and should not survive a refresh)
  useEffect(() => {
    try {
      const analysis = loadDocumentAnalysis();
      const plan = loadActionPlan();

      if (analysis && plan) {
        dispatch({
          type: "RESTORE",
          payload: {
            stage: "plan",
            documentAnalysis: analysis,
            userAnswers: null,
            actionPlan: plan,
            isExample: false,
            exampleAnswers: null,
            examplePlan: null,
          },
        });
      } else if (analysis) {
        dispatch({
          type: "RESTORE",
          payload: {
            stage: "questions",
            documentAnalysis: analysis,
            userAnswers: null,
            actionPlan: null,
            isExample: false,
            exampleAnswers: null,
            examplePlan: null,
          },
        });
      }
      // else: start at 'upload' (INITIAL_STATE)
    } catch {
      // localStorage read failure — clear and start fresh
      clearAll();
    }
  }, []);

  const setDocumentAnalysis = useCallback((result: DocumentAnalysis) => {
    // Only persist real analyses — not example sessions
    saveDocumentAnalysis(result);
    dispatch({ type: "SET_ANALYSIS", payload: result });
  }, []);

  const setUserAnswers = useCallback((answers: Record<string, string>) => {
    dispatch({ type: "SET_ANSWERS", payload: answers });
  }, []);

  const setActionPlan = useCallback((plan: ActionPlan) => {
    // Only persist real plans — not example sessions
    saveActionPlan(plan);
    dispatch({ type: "SET_PLAN", payload: plan });
  }, []);

  const goTo = useCallback((stage: PipelineStage) => {
    dispatch({ type: "GO_TO", payload: stage });
  }, []);

  const reset = useCallback(() => {
    clearAll();
    dispatch({ type: "RESET" });
  }, []);

  const loadExample = useCallback(
    (
      analysis: DocumentAnalysis,
      answers: Record<string, string>,
      plan: ActionPlan
    ) => {
      // Intentionally does NOT call saveDocumentAnalysis or saveActionPlan —
      // example sessions must not persist across a page refresh.
      dispatch({ type: "LOAD_EXAMPLE", payload: { analysis, answers, plan } });
    },
    []
  );

  return (
    <PipelineContext.Provider
      value={{
        ...state,
        setDocumentAnalysis,
        setUserAnswers,
        setActionPlan,
        goTo,
        reset,
        loadExample,
      }}
    >
      {children}
    </PipelineContext.Provider>
  );
}
