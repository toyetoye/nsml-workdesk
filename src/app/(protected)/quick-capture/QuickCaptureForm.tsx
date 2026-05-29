"use client";

import { useState, useTransition } from "react";
import { saveIntakeItemAction } from "@/app/(protected)/import/actions";
import type { IntakeSubmission } from "@/lib/workbench-data";
import type { ImportWorkspaceAssignment } from "@/lib/mock-data";

const WORKSPACES: Array<{ value: ImportWorkspaceAssignment; label: string }> = [
  { value: "Import/Staging", label: "Import / Staging (unclassified)" },
  { value: "LNG PORTHARCOURT II", label: "LNG Port Harcourt II" },
  { value: "LPG ALFRED TEMILE", label: "LPG Alfred Temile" },
  { value: "LPG ALFRED TEMILE 10", label: "LPG Alfred Temile 10" },
  { value: "Projects", label: "Projects" },
  { value: "Other", label: "Other" },
  { value: "Assurance", label: "Assurance" },
];

function isValidWorkspace(value: string): value is ImportWorkspaceAssignment {
  return WORKSPACES.some((w) => w.value === value);
}

const fieldStyle: React.CSSProperties = {
  marginBottom: 16,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "var(--color-text-secondary)",
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid var(--color-border-secondary)",
  borderRadius: 8,
  fontSize: 14,
  background: "var(--color-background-secondary)",
  color: "var(--color-text-primary)",
};

const btnPrimary: React.CSSProperties = {
  width: "100%",
  padding: "10px 0",
  background: "#155fa5",
  color: "#fff",
  border: 0,
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  width: "100%",
  padding: "10px 0",
  background: "transparent",
  color: "var(--color-text-secondary)",
  border: "1px solid var(--color-border-secondary)",
  borderRadius: 8,
  fontSize: 14,
  cursor: "pointer",
  marginTop: 8,
};

type Props = {
  defaultSubject: string;
  defaultFrom: string;
  defaultBody: string;
  defaultWorkspace: string;
};

export default function QuickCaptureForm({
  defaultSubject,
  defaultFrom,
  defaultBody,
  defaultWorkspace,
}: Props) {
  const [subject, setSubject] = useState(defaultSubject);
  const [from, setFrom] = useState(defaultFrom);
  const [body, setBody] = useState(defaultBody);
  const [workspace, setWorkspace] = useState<ImportWorkspaceAssignment>(
    isValidWorkspace(defaultWorkspace) ? defaultWorkspace : "Import/Staging",
  );
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCapture() {
    if (!subject.trim() && !body.trim()) {
      setErrorMsg("A subject or body is required.");
      setStatus("error");
      return;
    }

    setStatus("idle");
    setErrorMsg("");

    startTransition(async () => {
      try {
        const submission: IntakeSubmission = {
          title: subject.trim() || "Untitled email",
          sourceType: "pasted-email",
          workspaceAssignment: workspace,
          status: "unclassified",
          senderSource: from.trim(),
          dateTime: new Date().toISOString(),
          bodyContent: body.trim(),
          tags: "",
        };

        await saveIntakeItemAction(submission);
        setStatus("success");
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Capture failed.";
        setErrorMsg(msg);
        setStatus("error");
      }
    });
  }

  if (status === "success") {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
        <p style={{ fontWeight: 600, fontSize: 18, color: "var(--color-text-success, #0f6e56)", margin: "0 0 6px" }}>
          Captured
        </p>
        <p style={{ color: "var(--color-text-secondary)", margin: "0 0 24px", fontSize: 14 }}>
          {subject || "Email"} saved to <strong>{workspace}</strong>.
        </p>
        <button
          style={btnSecondary}
          onClick={() => window.close()}
        >
          Close tab
        </button>
        <button
          style={{ ...btnSecondary, marginTop: 8 }}
          onClick={() => {
            setSubject("");
            setFrom("");
            setBody("");
            setWorkspace("Import/Staging");
            setStatus("idle");
          }}
        >
          Capture another
        </button>
      </div>
    );
  }

  return (
    <div>
      {!defaultBody && (
        <div
          style={{
            padding: "10px 14px",
            background: "var(--color-background-warning)",
            color: "var(--color-text-warning)",
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          No body text was passed. Select the email text in Outlook, then click the bookmark again.
        </div>
      )}

      <div style={fieldStyle}>
        <label style={labelStyle}>Subject</label>
        <input
          style={inputStyle}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject"
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>From</label>
        <input
          style={inputStyle}
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="sender@example.com"
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Workspace</label>
        <select
          style={inputStyle}
          value={workspace}
          onChange={(e) => setWorkspace(e.target.value as ImportWorkspaceAssignment)}
        >
          {WORKSPACES.map((w) => (
            <option key={w.value} value={w.value}>
              {w.label}
            </option>
          ))}
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Body</label>
        <textarea
          style={{ ...inputStyle, minHeight: 180, resize: "vertical", fontFamily: "inherit" }}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Email body text…"
        />
      </div>

      {status === "error" && (
        <p style={{ color: "var(--color-text-danger)", fontSize: 13, marginBottom: 12 }}>
          {errorMsg}
        </p>
      )}

      <button
        style={{ ...btnPrimary, opacity: isPending ? 0.6 : 1 }}
        onClick={handleCapture}
        disabled={isPending}
      >
        {isPending ? "Capturing…" : "Capture email"}
      </button>
    </div>
  );
}
