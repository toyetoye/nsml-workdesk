import "server-only";

type NoopResult<T> = {
  data: T;
  error: null;
};

class NoopQueryBuilder<T = unknown> implements PromiseLike<NoopResult<T>> {
  private result: NoopResult<T>;

  constructor(initialResult: NoopResult<T>) {
    this.result = initialResult;
  }

  select() {
    return this;
  }

  insert(value: unknown) {
    this.result = {
      data: value as T,
      error: null,
    };
    return this;
  }

  upsert(value: unknown) {
    return this.insert(value);
  }

  update(value: unknown) {
    return this.insert(value);
  }

  delete() {
    return this;
  }

  eq() {
    return this;
  }

  neq() {
    return this;
  }

  order() {
    return this;
  }

  limit() {
    return this;
  }

  range() {
    return this;
  }

  contains() {
    return this;
  }

  in() {
    return this;
  }

  ilike() {
    return this;
  }

  gte() {
    return this;
  }

  lte() {
    return this;
  }

  is() {
    return this;
  }

  not() {
    return this;
  }

  or() {
    return this;
  }

  single() {
    this.result = { data: null as T, error: null };
    return this;
  }

  maybeSingle() {
    return this.single();
  }

  then<TResult1 = NoopResult<T>, TResult2 = never>(
    onfulfilled?: ((value: NoopResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return Promise.resolve(this.result).then(onfulfilled, onrejected);
  }
}

class NoopStorageBucket {
  constructor(private readonly bucketName: string) {}

  upload() {
    return Promise.resolve({
      data: null,
      error: null,
    });
  }

  remove() {
    return Promise.resolve({
      data: null,
      error: null,
    });
  }

  list() {
    return Promise.resolve({
      data: [],
      error: null,
    });
  }

  download() {
    return Promise.resolve({
      data: null,
      error: null,
    });
  }

  createSignedUrl() {
    return Promise.resolve({
      data: { signedUrl: "", path: "" },
      error: null,
    });
  }

  getPublicUrl() {
    return {
      data: { publicUrl: "", bucket: this.bucketName },
    };
  }
}

class NoopStorageClient {
  from(bucketName: string) {
    return new NoopStorageBucket(bucketName);
  }
}

export type NoopSupabaseClient = {
  from: <T = unknown>(table: string) => NoopQueryBuilder<T>;
  storage: NoopStorageClient;
};

export function createNoopSupabaseClient(): NoopSupabaseClient {
  return {
    from<T = unknown>() {
      return new NoopQueryBuilder<T>({
        data: [] as T,
        error: null,
      });
    },
    storage: new NoopStorageClient(),
  };
}
