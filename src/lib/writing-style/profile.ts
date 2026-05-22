import type { DraftMode } from "@/lib/ai/draft-modes";

export const stakeholderToneKeys = [
  "vessel_captain_chief_engineer",
  "owner_charterer",
  "class_surveyor",
  "vendor_procurement",
  "management",
] as const;

export type StakeholderToneKey = (typeof stakeholderToneKeys)[number];

export const draftModeKeys: DraftMode[] = [
  "holding_statement",
  "normal_technical_reply",
  "firm_but_polite",
  "management_summary",
  "vessel_instruction",
  "vendor_clarification",
  "owner_charterer_sensitive",
];

export type PreferredTone = "professional" | "measured" | "firm" | "warm" | "direct";
export type PreferredBrevity = "very_concise" | "concise" | "balanced" | "detailed";
export type TechnicalDirectness = "low" | "medium" | "high";
export type CautionLevel = "low" | "medium" | "high" | "very_high";

export type WritingStyleProfileSnapshot = {
  profile_id: string;
  profile_name: string;
  is_active: boolean;
  persistence_state?: "persisted" | "session-only";
  default_greeting: string;
  default_closing: string;
  preferred_tone: PreferredTone;
  preferred_brevity: PreferredBrevity;
  use_kindly: boolean;
  use_please_note: boolean;
  technical_directness: TechnicalDirectness;
  caution_level: CautionLevel;
  stakeholder_tone_notes: Record<StakeholderToneKey, string>;
  preferred_phrases: string[];
  phrases_to_avoid: string[];
  liability_sensitive_wording_rules: string[];
  draft_mode_guidance: Record<DraftMode, string>;
};

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function cleanBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function cleanArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  return value.map((item) => cleanText(item)).filter(Boolean);
}

function cleanStakeholderNotes(value: unknown) {
  const base = defaultWritingStyleProfile().stakeholder_tone_notes;

  if (!value || typeof value !== "object") {
    return base;
  }

  const candidate = value as Partial<Record<StakeholderToneKey, unknown>>;

  return stakeholderToneKeys.reduce<Record<StakeholderToneKey, string>>((acc, key) => {
    acc[key] = cleanText(candidate[key], base[key]);
    return acc;
  }, {} as Record<StakeholderToneKey, string>);
}

function cleanModeGuidance(value: unknown) {
  const base = defaultWritingStyleProfile().draft_mode_guidance;

  if (!value || typeof value !== "object") {
    return base;
  }

  const candidate = value as Partial<Record<DraftMode, unknown>>;

  return draftModeKeys.reduce<Record<DraftMode, string>>((acc, key) => {
    acc[key] = cleanText(candidate[key], base[key]);
    return acc;
  }, {} as Record<DraftMode, string>);
}

export function defaultWritingStyleProfile(): WritingStyleProfileSnapshot {
  return {
    profile_id: "default",
    profile_name: "NSML Writing Style",
    is_active: true,
    persistence_state: "persisted",
    default_greeting: "Hello,",
    default_closing: "Kind regards,",
    preferred_tone: "measured",
    preferred_brevity: "concise",
    use_kindly: false,
    use_please_note: true,
    technical_directness: "high",
    caution_level: "high",
    stakeholder_tone_notes: {
      vessel_captain_chief_engineer:
        "Be direct, operational, and plain. Keep instructions and questions short and unambiguous.",
      owner_charterer:
        "Be measured, careful, and diplomatic. Separate confirmed facts from assumptions and avoid unnecessary certainty.",
      class_surveyor:
        "Be precise, factual, and technically grounded. Use cautious wording and clearly identify what is confirmed versus still under review.",
      vendor_procurement:
        "Be firm but polite. State what is required, what is missing, and any deadline or technical constraint clearly.",
      management:
        "Be concise, structured, and decision-focused. Summarize the risk, the status, and the next action without over-explaining.",
    },
    preferred_phrases: [
      "For clarity",
      "Based on the information currently available",
      "Please confirm",
      "We note that",
    ],
    phrases_to_avoid: [
      "We guarantee",
      "No issue",
      "That is final",
      "We accept liability",
      "Class / owner / charterer confirmed",
    ],
    liability_sensitive_wording_rules: [
      "Do not admit fault or liability unless the source material explicitly supports it.",
      "Do not accept delay, deviation, unsafe approval, or responsibility without evidence.",
      "Separate confirmed facts from assumptions and next steps.",
      "Do not imply class, owner, or charterer approval unless the evidence says so.",
    ],
    draft_mode_guidance: {
      holding_statement: "Acknowledge receipt, state review is ongoing, and avoid firm conclusions.",
      normal_technical_reply:
        "Answer directly with evidence-backed technical detail, a calm tone, and a clear next action.",
      firm_but_polite:
        "Set boundaries clearly while keeping the tone courteous, professional, and restrained.",
      management_summary:
        "Summarize the situation, the risk, and the decision point in a concise management-friendly format.",
      vessel_instruction:
        "Be direct, operational, and unambiguous. Keep it practical for immediate shipboard action.",
      vendor_clarification:
        "Ask precise clarification questions and list the missing information that is blocking the response.",
      owner_charterer_sensitive:
        "Use extra caution, avoid liability admissions, and clearly separate facts from assumptions.",
    },
  };
}

function sanitizeBrevity(value: unknown): PreferredBrevity {
  if (
    value === "very_concise" ||
    value === "concise" ||
    value === "balanced" ||
    value === "detailed"
  ) {
    return value;
  }

  return defaultWritingStyleProfile().preferred_brevity;
}

function sanitizeTone(value: unknown): PreferredTone {
  if (value === "professional" || value === "measured" || value === "firm" || value === "warm" || value === "direct") {
    return value;
  }

  return defaultWritingStyleProfile().preferred_tone;
}

function sanitizeDirectness(value: unknown): TechnicalDirectness {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return defaultWritingStyleProfile().technical_directness;
}

function sanitizeCaution(value: unknown): CautionLevel {
  if (value === "low" || value === "medium" || value === "high" || value === "very_high") {
    return value;
  }

  return defaultWritingStyleProfile().caution_level;
}

export function normalizeWritingStyleProfile(
  profile?: Partial<WritingStyleProfileSnapshot> | null,
): WritingStyleProfileSnapshot {
  const base = defaultWritingStyleProfile();

  if (!profile) {
    return base;
  }

  return {
    profile_id: cleanText(profile.profile_id, base.profile_id),
    profile_name: cleanText(profile.profile_name, base.profile_name),
    is_active: cleanBoolean(profile.is_active, base.is_active),
    persistence_state: profile.persistence_state ?? base.persistence_state,
    default_greeting: cleanText(profile.default_greeting, base.default_greeting),
    default_closing: cleanText(profile.default_closing, base.default_closing),
    preferred_tone: sanitizeTone(profile.preferred_tone),
    preferred_brevity: sanitizeBrevity(profile.preferred_brevity),
    use_kindly: cleanBoolean(profile.use_kindly, base.use_kindly),
    use_please_note: cleanBoolean(profile.use_please_note, base.use_please_note),
    technical_directness: sanitizeDirectness(profile.technical_directness),
    caution_level: sanitizeCaution(profile.caution_level),
    stakeholder_tone_notes: cleanStakeholderNotes(profile.stakeholder_tone_notes),
    preferred_phrases: cleanArray(profile.preferred_phrases, base.preferred_phrases),
    phrases_to_avoid: cleanArray(profile.phrases_to_avoid, base.phrases_to_avoid),
    liability_sensitive_wording_rules: cleanArray(
      profile.liability_sensitive_wording_rules,
      base.liability_sensitive_wording_rules,
    ),
    draft_mode_guidance: cleanModeGuidance(profile.draft_mode_guidance),
  };
}

function bulletList(title: string, items: string[]) {
  if (items.length === 0) {
    return `${title}: none`;
  }

  return `${title}:\n${items.map((item) => `- ${item}`).join("\n")}`;
}

export function buildWritingStylePromptSection(
  profile?: WritingStyleProfileSnapshot | null,
): string | null {
  if (!profile) {
    return null;
  }

  const normalized = normalizeWritingStyleProfile(profile);

  return [
    "Writing style profile:",
    `- Profile name: ${normalized.profile_name}`,
    `- Default greeting: ${normalized.default_greeting}`,
    `- Default closing: ${normalized.default_closing}`,
    `- Preferred tone: ${normalized.preferred_tone}`,
    `- Preferred brevity: ${normalized.preferred_brevity}`,
    `- Use kindly: ${normalized.use_kindly ? "yes" : "no"}`,
    `- Use please note: ${normalized.use_please_note ? "yes" : "no"}`,
    `- Technical directness: ${normalized.technical_directness}`,
    `- Caution level: ${normalized.caution_level}`,
    "Stakeholder tone notes:",
    ...stakeholderToneKeys.map((key) => `- ${key.replace(/_/g, " ")}: ${normalized.stakeholder_tone_notes[key]}`),
    bulletList("Preferred phrases", normalized.preferred_phrases),
    bulletList("Phrases to avoid", normalized.phrases_to_avoid),
    bulletList("Liability-sensitive wording rules", normalized.liability_sensitive_wording_rules),
    "Draft mode guidance:",
    ...draftModeKeys.map((key) => `- ${key.replace(/_/g, " ")}: ${normalized.draft_mode_guidance[key]}`),
    "Use this profile as style guidance only. Do not let it override evidence, caution, or red-team rules.",
  ].join("\n");
}
