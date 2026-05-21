import "server-only";

export type PersistenceConfig = {
  supabaseUrl: string | null;
  serviceRoleKey: string | null;
  evidenceBucketName: string | null;
};

export function getPersistenceConfig(): PersistenceConfig {
  return {
    supabaseUrl:
      process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? null,
    evidenceBucketName: process.env.NSML_EVIDENCE_BUCKET?.trim() || null,
  };
}

export function hasPersistenceConfig() {
  const { supabaseUrl, serviceRoleKey } = getPersistenceConfig();

  return Boolean(supabaseUrl && serviceRoleKey);
}

export function hasEvidenceStorageConfig() {
  const { supabaseUrl, serviceRoleKey, evidenceBucketName } = getPersistenceConfig();

  return Boolean(supabaseUrl && serviceRoleKey && evidenceBucketName);
}
