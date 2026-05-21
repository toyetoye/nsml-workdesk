import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPersistenceConfig, hasPersistenceConfig } from "./config";
import { createNoopSupabaseClient, type NoopSupabaseClient } from "./noop";
import type { Database } from "./types";

export type PersistenceClient = SupabaseClient<Database> | NoopSupabaseClient;

let cachedClient: PersistenceClient | null = null;
let hasLoggedFallback = false;

export function createPersistenceClient(): PersistenceClient {
  if (cachedClient) {
    return cachedClient;
  }

  if (!hasPersistenceConfig()) {
    if (!hasLoggedFallback) {
      console.info(
        "Supabase persistence is not configured. Using the no-op fallback store.",
      );
      hasLoggedFallback = true;
    }

    cachedClient = createNoopSupabaseClient();
    return cachedClient;
  }

  const { supabaseUrl, serviceRoleKey } = getPersistenceConfig();

  if (!supabaseUrl || !serviceRoleKey) {
    cachedClient = createNoopSupabaseClient();
    return cachedClient;
  }

  cachedClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedClient;
}

export function isPersistenceAvailable() {
  return hasPersistenceConfig();
}
