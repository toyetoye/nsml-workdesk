import "server-only";

import {
  createPersistenceClient,
  isPersistenceAvailable,
} from "@/lib/persistence/client";

type LegacyResult<T = any> = {
  data: T;
  error: any;
};

type LegacyQuery<T = any> = PromiseLike<LegacyResult<T>> & {
  select: (...args: unknown[]) => LegacyQuery<any[]>;
  insert: (value: unknown) => LegacyQuery<any[] | Record<string, unknown>>;
  upsert: (value: unknown) => LegacyQuery<any[] | Record<string, unknown>>;
  update: (value: unknown) => LegacyQuery<any[] | Record<string, unknown>>;
  delete: () => LegacyQuery<T>;
  eq: (...args: unknown[]) => LegacyQuery<T>;
  neq: (...args: unknown[]) => LegacyQuery<T>;
  order: (...args: unknown[]) => LegacyQuery<T>;
  limit: (...args: unknown[]) => LegacyQuery<T>;
  range: (...args: unknown[]) => LegacyQuery<T>;
  contains: (...args: unknown[]) => LegacyQuery<T>;
  in: (...args: unknown[]) => LegacyQuery<T>;
  ilike: (...args: unknown[]) => LegacyQuery<T>;
  gte: (...args: unknown[]) => LegacyQuery<T>;
  lte: (...args: unknown[]) => LegacyQuery<T>;
  is: (...args: unknown[]) => LegacyQuery<T>;
  not: (...args: unknown[]) => LegacyQuery<T>;
  or: (...args: unknown[]) => LegacyQuery<T>;
  single: () => Promise<LegacyResult<any>>;
  maybeSingle: () => Promise<LegacyResult<any>>;
};

type LegacyStorageBucket = {
  upload: (...args: unknown[]) => Promise<LegacyResult<Record<string, unknown> | null>>;
  remove: (...args: unknown[]) => Promise<LegacyResult<Record<string, unknown> | null>>;
  list: (...args: unknown[]) => Promise<LegacyResult<any[]>>;
  download: (...args: unknown[]) => Promise<LegacyResult<Record<string, unknown> | null>>;
  createSignedUrl: (...args: unknown[]) => Promise<LegacyResult<Record<string, unknown> | null>>;
  getPublicUrl: (...args: unknown[]) => { data: { publicUrl: string; bucket?: string } };
};

type LegacyStorage = {
  from: (bucket: string) => LegacyStorageBucket;
};

type LegacySupabaseClient = {
  from: (table: string) => LegacyQuery;
  storage: LegacyStorage;
};

export const supabase = createPersistenceClient() as unknown as LegacySupabaseClient;

export { createPersistenceClient, isPersistenceAvailable };
