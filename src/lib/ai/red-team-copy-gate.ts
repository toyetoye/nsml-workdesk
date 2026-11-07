/**
 * Require mutually consistent, explicit red-team permission before manual copy.
 * This does not approve or send any correspondence.
 */
export function isRedTeamCopyPermitted(
  verdict: unknown,
  safeToCopy: unknown,
  readinessStatus: unknown,
): boolean {
  return (
    (verdict === "pass" || verdict === "pass_with_caution") &&
    safeToCopy === true &&
    readinessStatus === "ready_to_copy"
  );
}
