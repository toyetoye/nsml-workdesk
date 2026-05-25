import { draftModeOptions, type DraftMode } from "./draft-modes";
import type { TriageSourceType } from "./types";

export function describeTriageSourceType(sourceType: TriageSourceType) {
  switch (sourceType) {
    case "intake_item":
      return "Intake item";
    case "correspondence_thread":
      return "Correspondence thread";
    case "case":
      return "Case";
    default:
      return sourceType;
  }
}

export function describeDraftMode(mode: DraftMode) {
  return draftModeOptions.find((entry) => entry.value === mode)?.label ?? mode;
}
