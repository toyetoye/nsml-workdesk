"use server";

import { supabase } from "@/lib/supabase";

type ActivityPayload = {
  projectId: string;
  eventType: string;
  actor?: string;
  title: string;
  detail?: string;
  metadata?: Record<string, unknown>;
};

export async function logActivity({
  projectId,
  eventType,
  actor,
  title,
  detail,
  metadata,
}: ActivityPayload) {
  await supabase.from("activity_events").insert({
    project_id: projectId,
    event_type: eventType,
    actor,
    title,
    detail,
    metadata: metadata ?? {},
  });
}
