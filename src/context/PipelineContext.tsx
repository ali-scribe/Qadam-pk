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
}

type PipelineAction =
  | { type: "SET_ANALYSIS"; payload: DocumentAnalysis }
  | { type: "SET_ANSWERS"; payload: Record<string, string> }
  | { type: "SET_PLAN"; payload: ActionPlan }
  | { type: "GO_TO"; payload: PipelineStage }
  | { type: "RESET" }
  | { type: "RESTORE"; payload: PipelineState };

const INITIAL_STATE: PipelineState = {
  stage: "upload",
  documentAnalysis: null,
  userAnswers: null,
  actionPlan: null,
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
}

// ─── Context ─────────────────────────────────────────────────────────────────

export const PipelineContext = createContext<PipelineContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function PipelineProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const analysis = loadDocumentAnalysis();
      const plan = loadActionPlan();

      if (analysis && plan) {
        dispatch({
          type: "RESTORE",
          payload: { stage: "plan", documentAnalysis: analysis, userAnswers: null, actionPlan: plan },
        });
      } else if (analysis) {
        dispatch({
          type: "RESTORE",
          payload: { stage: "questions", documentAnalysis: analysis, userAnswers: null, actionPlan: null },
        });
      }
      // else: start at 'upload' (initial state)
    } catch {
      // localStorage read failure — clear and start fresh
      clearAll();
    }
  }, []);

  const setDocumentAnalysis = useCallback((result: DocumentAnalysis) => {
    saveDocumentAnalysis(result);
    dispatch({ type: "SET_ANALYSIS", payload: result });
  }, []);

  const setUserAnswers = useCallback((answers: Record<string, string>) => {
    // User answers are not persisted — in-memory only
    dispatch({ type: "SET_ANSWERS", payload: answers });
  }, []);

  const setActionPlan = useCallback((plan: ActionPlan) => {
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

  return (
    <PipelineContext.Provider
      value={{ ...state, setDocumentAnalysis, setUserAnswers, setActionPlan, goTo, reset }}
    >
      {children}
    </PipelineContext.Provider>
  );
}
