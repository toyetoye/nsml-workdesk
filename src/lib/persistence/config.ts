import "server-only";

export type PersistenceConfig = {
  supabaseUrl: string | null;
  serviceRoleKey: string | null;
};

export function getPersistenceConfig(): PersistenceConfig {
  return {
    supabaseUrl:
      process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? null,
  };
}

export function hasPersistenceConfig() {
  const { supabaseUrl, serviceRoleKey } = getPersistenceConfig();

  return Boolean(supabaseUrl && serviceRoleKey);
}
