import assert from "node:assert/strict";
import test from "node:test";
import { isRedTeamCopyPermitted } from "../src/lib/ai/red-team-copy-gate.ts";

const cases = [
  ["explicit pass", "pass", true, "ready_to_copy", true],
  ["explicit caution pass", "pass_with_caution", true, "ready_to_copy", true],
  ["pass with negative flag", "pass", false, "ready_to_copy", false],
  ["caution pass with negative flag", "pass_with_caution", false, "ready_to_copy", false],
  ["pass with missing flag", "pass", undefined, "ready_to_copy", false],
  ["pass with null flag", "pass", null, "ready_to_copy", false],
  ["pass with nonboolean flag", "pass", "true", "ready_to_copy", false],
  ["pass with negative readiness", "pass", true, "not_ready", false],
  ["caution pass with negative readiness", "pass_with_caution", true, "not_ready", false],
  ["pass with missing readiness", "pass", true, undefined, false],
  ["pass with invalid readiness", "pass", true, "ready", false],
  ["revise with positive flags", "revise", true, "ready_to_copy", false],
  ["reject with positive flags", "reject", true, "ready_to_copy", false],
  ["needs evidence with positive flags", "needs_more_evidence", true, "ready_to_copy", false],
  ["unknown verdict with positive flags", "unexpected", true, "ready_to_copy", false],
  ["missing verdict with positive flags", undefined, true, "ready_to_copy", false],
  ["null verdict with positive flags", null, true, "ready_to_copy", false],
];

for (const [name, verdict, safeFlag, readiness, expected] of cases) {
  test(`copy gate: ${name}`, () => {
    assert.equal(isRedTeamCopyPermitted(verdict, safeFlag, readiness), expected);
  });
}
