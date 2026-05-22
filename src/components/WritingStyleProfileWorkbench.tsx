"use client";

import { useMemo, useState, type ReactNode } from "react";
import { PenLine, Sparkles } from "lucide-react";
import { saveWritingStyleProfileAction } from "@/app/(protected)/settings/writing-style/actions";
import { StatusBadge } from "@/components/StatusBadge";
import { draftModeOptions } from "@/lib/ai/draft-modes";
import {
  defaultWritingStyleProfile,
  normalizeWritingStyleProfile,
  stakeholderToneKeys,
  type CautionLevel,
  type PreferredBrevity,
  type PreferredTone,
  type TechnicalDirectness,
  type WritingStyleProfileSnapshot,
} from "@/lib/writing-style/profile";

const preferredToneOptions: Array<{ value: PreferredTone; label: string }> = [
  { value: "professional", label: "Professional" },
  { value: "measured", label: "Measured" },
  { value: "firm", label: "Firm" },
  { value: "warm", label: "Warm" },
  { value: "direct", label: "Direct" },
];

const preferredBrevityOptions: Array<{ value: PreferredBrevity; label: string }> = [
  { value: "very_concise", label: "Very concise" },
  { value: "concise", label: "Concise" },
  { value: "balanced", label: "Balanced" },
  { value: "detailed", label: "Detailed" },
];

const technicalDirectnessOptions: Array<{ value: TechnicalDirectness; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const cautionLevelOptions: Array<{ value: CautionLevel; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "very_high", label: "Very high" },
];

const stakeholderToneLabels: Record<(typeof stakeholderToneKeys)[number], string> = {
  vessel_captain_chief_engineer: "Vessel / captain / chief engineer",
  owner_charterer: "Owner / charterer",
  class_surveyor: "Class / surveyor",
  vendor_procurement: "Vendor / procurement",
  management: "Management",
};

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLines(items: string[]) {
  return items.join("\n");
}

function makeSummary(profile: WritingStyleProfileSnapshot) {
  return [
    `Greeting: ${profile.default_greeting}`,
    `Closing: ${profile.default_closing}`,
    `Tone: ${profile.preferred_tone}`,
    `Brevity: ${profile.preferred_brevity.replace(/_/g, " ")}`,
    `Technical directness: ${profile.technical_directness}`,
    `Caution level: ${profile.caution_level}`,
    `Kindly: ${profile.use_kindly ? "yes" : "no"}`,
    `Please note: ${profile.use_please_note ? "yes" : "no"}`,
  ];
}

export function WritingStyleProfileWorkbench({
  initialProfile,
}: {
  initialProfile: WritingStyleProfileSnapshot;
}) {
  const [profile, setProfile] = useState<WritingStyleProfileSnapshot>(() =>
    normalizeWritingStyleProfile(initialProfile ?? defaultWritingStyleProfile()),
  );
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const summaryItems = useMemo(() => makeSummary(profile), [profile]);

  function updateField<K extends keyof WritingStyleProfileSnapshot>(
    key: K,
    value: WritingStyleProfileSnapshot[K],
  ) {
    setProfile((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaveNotice(null);

    try {
      const response = await saveWritingStyleProfileAction(profile);
      setProfile(normalizeWritingStyleProfile(response.profile));
      setSaveNotice(response.note);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save writing style profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Writing Style
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">Writing Style Profile</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Tune greeting, closing, tone, brevity, stakeholder framing, and mode guidance so
            generated drafts sound more like you while still staying evidence-based and
            red-team controlled.
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <Sparkles aria-hidden className="text-teal-700" size={16} />
            <span className="font-semibold">Draft calibration only</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Style can shape wording and tone, but it cannot override safety, evidence, or
            red-team review.
          </p>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="space-y-5">
          <CardSection title="Core preferences" description="Set the baseline voice for draft generation.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Profile name">
                <input
                  className="field-input"
                  value={profile.profile_name}
                  onChange={(event) => updateField("profile_name", event.target.value)}
                />
              </Field>
              <Field label="Default greeting">
                <input
                  className="field-input"
                  value={profile.default_greeting}
                  onChange={(event) => updateField("default_greeting", event.target.value)}
                />
              </Field>
              <Field label="Default closing">
                <input
                  className="field-input"
                  value={profile.default_closing}
                  onChange={(event) => updateField("default_closing", event.target.value)}
                />
              </Field>
              <Field label="Preferred tone">
                <select
                  className="field-input"
                  value={profile.preferred_tone}
                  onChange={(event) =>
                    updateField("preferred_tone", event.target.value as PreferredTone)
                  }
                >
                  {preferredToneOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Preferred brevity">
                <select
                  className="field-input"
                  value={profile.preferred_brevity}
                  onChange={(event) =>
                    updateField("preferred_brevity", event.target.value as PreferredBrevity)
                  }
                >
                  {preferredBrevityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Technical directness">
                <select
                  className="field-input"
                  value={profile.technical_directness}
                  onChange={(event) =>
                    updateField("technical_directness", event.target.value as TechnicalDirectness)
                  }
                >
                  {technicalDirectnessOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Caution level">
                <select
                  className="field-input"
                  value={profile.caution_level}
                  onChange={(event) => updateField("caution_level", event.target.value as CautionLevel)}
                >
                  {cautionLevelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                <ToggleRow
                  label="Use kindly"
                  description="Let drafts use kind / gentle wording when appropriate."
                  checked={profile.use_kindly}
                  onChange={(checked) => updateField("use_kindly", checked)}
                />
                <ToggleRow
                  label="Use please note"
                  description="Allow 'please note' for emphasis when a cautionary line is needed."
                  checked={profile.use_please_note}
                  onChange={(checked) => updateField("use_please_note", checked)}
                />
              </div>
            </div>
          </CardSection>

          <CardSection
            title="Stakeholder tone profiles"
            description="Adjust the way the draft frames requests for different recipients."
          >
            <div className="grid gap-4">
              {stakeholderToneKeys.map((key) => (
                <Field key={key} label={stakeholderToneLabels[key]}>
                  <textarea
                    className="field-input min-h-[96px]"
                    value={profile.stakeholder_tone_notes[key]}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        stakeholder_tone_notes: {
                          ...current.stakeholder_tone_notes,
                          [key]: event.target.value,
                        },
                      }))
                    }
                  />
                </Field>
              ))}
            </div>
          </CardSection>

          <CardSection
            title="Phrase guidance"
            description="Use one phrase per line. These are style cues only and do not override safety."
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <Field label="Preferred phrases">
                <textarea
                  className="field-input min-h-[180px]"
                  value={joinLines(profile.preferred_phrases)}
                  onChange={(event) =>
                    updateField("preferred_phrases", splitLines(event.target.value))
                  }
                />
              </Field>
              <Field label="Phrases to avoid">
                <textarea
                  className="field-input min-h-[180px]"
                  value={joinLines(profile.phrases_to_avoid)}
                  onChange={(event) =>
                    updateField("phrases_to_avoid", splitLines(event.target.value))
                  }
                />
              </Field>
              <Field label="Liability-sensitive wording rules">
                <textarea
                  className="field-input min-h-[180px]"
                  value={joinLines(profile.liability_sensitive_wording_rules)}
                  onChange={(event) =>
                    updateField(
                      "liability_sensitive_wording_rules",
                      splitLines(event.target.value),
                    )
                  }
                />
              </Field>
            </div>
          </CardSection>

          <CardSection
            title="Draft mode guidance"
            description="Keep mode-specific guidance short, practical, and aligned with the profile."
          >
            <div className="grid gap-4">
              {draftModeOptions.map((mode) => (
                <Field key={mode.value} label={mode.label}>
                  <textarea
                    className="field-input min-h-[88px]"
                    value={profile.draft_mode_guidance[mode.value]}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        draft_mode_guidance: {
                          ...current.draft_mode_guidance,
                          [mode.value]: event.target.value,
                        },
                      }))
                    }
                  />
                </Field>
              ))}
            </div>
          </CardSection>
        </div>

        <aside className="space-y-5">
          <CardSection
            title="What this profile affects"
            description="This is the calibration layer for generated drafts."
          >
            <ul className="space-y-2 text-sm leading-6 text-slate-700">
              {[
                "Greeting and closing style",
                "Tone, brevity, directness, and caution",
                "Stakeholder framing for vessel, owner, class, vendor, and management recipients",
                "Preferred phrases and phrases to avoid",
                "Mode-specific guidance for each draft type",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardSection>

          <CardSection title="Current summary" description="A quick view of the active style settings.">
            <div className="space-y-2">
              {summaryItems.map((item) => (
                <div key={item} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm leading-6 text-slate-800">{item}</p>
                </div>
              ))}
            </div>
          </CardSection>

          <CardSection title="Safety guardrails" description="Style can shape wording, not truth or approval.">
            <div className="space-y-3">
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-950">
                Red-team review still controls whether a draft can be copied. Style settings do not
                unlock copy, mark a draft ready, or change workflow state.
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
                {profile.persistence_state === "persisted"
                  ? "This profile is saved to the repository."
                  : "This profile is session-only for now because persistence is unavailable."}
              </div>
            </div>
          </CardSection>

          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            {saveNotice ? (
              <div className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm leading-6 text-teal-950">
                {saveNotice}
              </div>
            ) : null}
            {saveError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-950">
                {saveError}
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save writing style profile"}
              </button>
              <StatusBadge tone={profile.persistence_state === "persisted" ? "accent" : "warning"}>
                {profile.persistence_state === "persisted" ? "Persisted" : "Session-only"}
              </StatusBadge>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function CardSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="card p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-800">
          <PenLine aria-hidden size={18} />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      {children}
    </label>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-700"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
      </span>
    </label>
  );
}
