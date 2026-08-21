import { useContext } from "react";
import { PipelineContext, type PipelineContextValue } from "@/context/PipelineContext";

export function usePipeline(): PipelineContextValue {
  const ctx = useContext(PipelineContext);
  if (!ctx) {
    throw new Error("usePipeline must be used inside <PipelineProvider>");
  }
  return ctx;
}
