"use server";

import { redirect } from "next/navigation";
import {
  getAccessGateStatus,
  normalizeRedirectTarget,
} from "@/lib/access-gate";
import {
  clearAccessSessionCookie,
  getExpectedAccessPassword,
  getLoginRedirectTarget,
  getSubmittedPassword,
  setAccessSessionCookie,
} from "@/lib/auth-session";

export async function loginAction(formData: FormData) {
  const gate = getAccessGateStatus();

  if (gate.mode !== "configured") {
    redirect("/login?error=setup");
  }

  const submittedPassword = getSubmittedPassword(formData);
  const expectedPassword = getExpectedAccessPassword();

  if (!submittedPassword || submittedPassword !== expectedPassword) {
    const redirectTarget = normalizeRedirectTarget(String(formData.get("redirectTo") ?? "/dashboard"));
    redirect(`/login?error=invalid&redirectTo=${encodeURIComponent(redirectTarget)}`);
  }

  await setAccessSessionCookie();
  redirect(getLoginRedirectTarget(formData));
}

export async function logoutAction() {
  await clearAccessSessionCookie();
  redirect("/login?status=logged-out");
}
