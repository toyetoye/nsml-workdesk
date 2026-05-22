export type DraftMode =
  | "holding_statement"
  | "normal_technical_reply"
  | "firm_but_polite"
  | "management_summary"
  | "vessel_instruction"
  | "vendor_clarification"
  | "owner_charterer_sensitive";

export const draftModeOptions: Array<{ value: DraftMode; label: string }> = [
  { value: "holding_statement", label: "Holding statement" },
  { value: "normal_technical_reply", label: "Normal technical reply" },
  { value: "firm_but_polite", label: "Firm but polite" },
  { value: "management_summary", label: "Management summary" },
  { value: "vessel_instruction", label: "Vessel instruction" },
  { value: "vendor_clarification", label: "Vendor clarification" },
  { value: "owner_charterer_sensitive", label: "Owner / charterer sensitive" },
];

export function describeDraftMode(mode: DraftMode) {
  return draftModeOptions.find((entry) => entry.value === mode)?.label ?? mode;
}
