import type {
  KatalixDiagnostic,
  KatalixSourceLocation,
  ValidationMode,
  ValidationResult,
} from "@katalix/core";

export type KatalixStorageKind =
  | "key-value"
  | "secure-key-value"
  | "document-store"
  | "local-sql"
  | "cache-storage"
  | "offline-queue";

export type KatalixStoragePlatform = "web" | "native";
export type KatalixConflictStrategy =
  | "client-wins"
  | "server-wins"
  | "last-write-wins"
  | "custom";

export interface KatalixStorageMigration {
  readonly version: number;
  readonly id: string;
}

export interface KatalixStorageManifestStore {
  readonly id: string;
  readonly kind: KatalixStorageKind;
  readonly adapter: string;
  readonly migrations: readonly KatalixStorageMigration[];
  readonly optimisticMetadata?: string;
  readonly conflictStrategy?: KatalixConflictStrategy;
}

export interface KatalixStorageManifestMeta {
  readonly source?: KatalixSourceLocation;
  readonly path: string;
  readonly builderTrace: readonly string[];
}

export interface KatalixStorageManifest {
  readonly kind: "storage";
  readonly name: string;
  readonly stores: readonly KatalixStorageManifestStore[];
  readonly meta: KatalixStorageManifestMeta;
  readonly validation: ValidationResult;
}

export interface ToStorageManifestOptions {
  readonly mode?: ValidationMode;
  readonly throwOnError?: boolean;
  readonly platform?: KatalixStoragePlatform;
}

export interface KatalixStorageStoreOptions {
  readonly adapter: string;
}

export interface StorageAdapterPlanEntry {
  readonly id: string;
  readonly kind: KatalixStorageKind;
  readonly adapter: string;
  readonly platform: KatalixStoragePlatform;
}

interface StorageBuilderState {
  readonly name: string;
  readonly stores: readonly KatalixStorageManifestStore[];
  readonly builderTrace: readonly string[];
}

const WEB_ADAPTERS = new Set(["localStorage", "sessionStorage", "indexeddb", "cache-storage"]);
const NATIVE_ADAPTERS = new Set(["async-storage", "mmkv", "secure-store", "keychain", "sqlite"]);
const SHARED_ADAPTERS = new Set(["custom"]);
const SECURE_ADAPTERS = new Set(["secure-store", "keychain"]);
const KIND_ADAPTERS: Record<KatalixStorageKind, ReadonlySet<string>> = {
  "key-value": new Set(["localStorage", "sessionStorage", "async-storage", "mmkv", "custom"]),
  "secure-key-value": new Set(["secure-store", "keychain", "custom"]),
  "document-store": new Set(["indexeddb", "sqlite", "custom"]),
  "local-sql": new Set(["sqlite", "custom"]),
  "cache-storage": new Set(["cache-storage", "custom"]),
  "offline-queue": new Set(["indexeddb", "async-storage", "sqlite", "custom"]),
};

const runtimeDiagnostic = (
  diagnostic: Omit<KatalixDiagnostic, "manifestKind">,
): KatalixDiagnostic => ({
  manifestKind: "storage",
  ...diagnostic,
});

export class KatalixStorageValidationError extends Error {
  readonly diagnostics: readonly KatalixDiagnostic[];

  constructor(diagnostics: readonly KatalixDiagnostic[]) {
    super(diagnostics[0]?.summary ?? "Katalix storage manifest validation failed.");
    this.name = "KatalixStorageValidationError";
    this.diagnostics = diagnostics;
  }
}

const adapterSupportsPlatform = (adapter: string, platform: KatalixStoragePlatform) => {
  if (SHARED_ADAPTERS.has(adapter)) {
    return true;
  }
  return platform === "web" ? WEB_ADAPTERS.has(adapter) : NATIVE_ADAPTERS.has(adapter);
};

const isKnownAdapter = (adapter: string) =>
  WEB_ADAPTERS.has(adapter) || NATIVE_ADAPTERS.has(adapter) || SHARED_ADAPTERS.has(adapter);

export const validateStorageManifest = (
  manifest: KatalixStorageManifest,
  options: ToStorageManifestOptions = {},
): ValidationResult => {
  const diagnostics: KatalixDiagnostic[] = [];
  const storeIds = new Set<string>();

  if (manifest.name.trim().length === 0) {
    diagnostics.push(
      runtimeDiagnostic({
        code: "KATALIX_INVALID_STORAGE_NAME",
        message: "Storage manifest name is required.",
        summary: "Storage manifest name is required.",
        path: "storage.name",
        field: "name",
        received: manifest.name,
        expected: "A non-empty storage manifest name.",
        suggestion: 'Pass a non-empty name to Storage("Name").',
      }),
    );
  }

  manifest.stores.forEach((store, index) => {
    const path = `storage.stores[${index}]`;

    if (storeIds.has(store.id)) {
      diagnostics.push(
        runtimeDiagnostic({
          code: "KATALIX_DUPLICATE_STORAGE_ID",
          message: `Duplicate storage id "${store.id}".`,
          summary: `Storage id "${store.id}" is declared more than once.`,
          path,
          field: "stores.id",
          received: store.id,
          expected: "A unique storage id.",
          suggestion: "Use a unique storage id or remove the duplicate declaration.",
        }),
      );
    }
    storeIds.add(store.id);

    if (!isKnownAdapter(store.adapter)) {
      diagnostics.push(
        runtimeDiagnostic({
          code: "KATALIX_UNKNOWN_STORAGE_ADAPTER",
          message: `Unknown storage adapter "${store.adapter}".`,
          summary: `Storage adapter "${store.adapter}" is not one of Katalix's known adapter targets.`,
          path: `${path}.adapter`,
          field: "adapter",
          received: store.adapter,
          expected: "A known adapter or custom.",
          suggestion: 'Use "custom" for host-defined adapters.',
        }),
      );
    }

    if (options.platform && !adapterSupportsPlatform(store.adapter, options.platform)) {
      diagnostics.push(
        runtimeDiagnostic({
          code: "KATALIX_UNAVAILABLE_STORAGE_ADAPTER",
          message: `${store.adapter} is unavailable on ${options.platform}.`,
          summary: `Storage adapter "${store.adapter}" cannot be used on ${options.platform}.`,
          path: `${path}.adapter`,
          field: "adapter",
          received: store.adapter,
          expected: `An adapter available on ${options.platform}.`,
          suggestion: "Choose a platform-compatible adapter or split manifests by platform.",
        }),
      );
    }

    if (!KIND_ADAPTERS[store.kind].has(store.adapter)) {
      diagnostics.push(
        runtimeDiagnostic({
          code: "KATALIX_UNSUPPORTED_STORAGE_KIND_ADAPTER",
          message: `${store.adapter} cannot back ${store.kind}.`,
          summary: `Storage adapter "${store.adapter}" is not compatible with ${store.kind} stores.`,
          path: `${path}.adapter`,
          field: "adapter",
          received: { kind: store.kind, adapter: store.adapter },
          expected: `An adapter compatible with ${store.kind}.`,
          suggestion: "Choose an adapter whose persistence model matches the declared store kind.",
        }),
      );
    }

    if (store.kind === "secure-key-value" && !SECURE_ADAPTERS.has(store.adapter)) {
      diagnostics.push(
        runtimeDiagnostic({
          code: "KATALIX_INSECURE_STORAGE_ADAPTER",
          message: `${store.adapter} is not a secure storage adapter.`,
          summary: "Secure key-value stores must use an adapter intended for secrets.",
          path: `${path}.adapter`,
          field: "adapter",
          received: store.adapter,
          expected: "secure-store or keychain.",
          suggestion: "Use secure-store/keychain or declare a normal key-value store.",
        }),
      );
    }

    if (
      (store.kind === "document-store" || store.kind === "local-sql") &&
      store.migrations.length === 0
    ) {
      diagnostics.push(
        runtimeDiagnostic({
          code: "KATALIX_MISSING_STORAGE_MIGRATION",
          message: `Store "${store.id}" is missing schema migrations.`,
          summary: "Document and SQL stores should declare a starting migration.",
          path: `${path}.migrations`,
          field: "migrations",
          received: [],
          expected: "At least one migration entry.",
          suggestion: "Call migration() with an initial schema version.",
        }),
      );
    }

    if (store.kind === "offline-queue" && !store.conflictStrategy) {
      diagnostics.push(
        runtimeDiagnostic({
          code: "KATALIX_MISSING_OFFLINE_CONFLICT_STRATEGY",
          message: `Offline queue "${store.id}" is missing a conflict strategy.`,
          summary: "Offline mutation queues must declare how conflicts are resolved.",
          path: `${path}.conflictStrategy`,
          field: "conflictStrategy",
          received: undefined,
          expected: "A conflict strategy.",
          suggestion: "Call conflictStrategy() on the offline queue declaration.",
        }),
      );
    }
  });

  return {
    valid: diagnostics.length === 0,
    diagnostics,
  };
};

const withValidation = (
  manifest: Omit<KatalixStorageManifest, "validation">,
  options: ToStorageManifestOptions = {},
): KatalixStorageManifest => {
  const completeManifest = {
    ...manifest,
    validation: { valid: true, diagnostics: [] },
  } satisfies KatalixStorageManifest;
  const validation = validateStorageManifest(completeManifest, options);
  const validatedManifest = { ...completeManifest, validation };
  const mode = options.mode ?? "strict";
  const throwOnError = options.throwOnError ?? mode === "strict";

  if (!validation.valid && throwOnError) {
    throw new KatalixStorageValidationError(validation.diagnostics);
  }

  return validatedManifest;
};

export class KatalixStorageStoreBuilder {
  private readonly store: {
    id: string;
    kind: KatalixStorageKind;
    adapter: string;
    migrations: KatalixStorageMigration[];
    optimisticMetadata?: string;
    conflictStrategy?: KatalixConflictStrategy;
  };

  constructor(id: string, kind: KatalixStorageKind, adapter: string) {
    this.store = {
      id,
      kind,
      adapter,
      migrations: [],
    };
  }

  migration(version: number, id: string): this {
    this.store.migrations.push({ version, id });
    return this;
  }

  optimisticMetadata(ref: string): this {
    this.store.optimisticMetadata = ref;
    return this;
  }

  conflictStrategy(strategy: KatalixConflictStrategy): this {
    this.store.conflictStrategy = strategy;
    return this;
  }

  toManifest(): KatalixStorageManifestStore {
    return {
      id: this.store.id,
      kind: this.store.kind,
      adapter: this.store.adapter,
      migrations: [...this.store.migrations],
      ...(this.store.optimisticMetadata
        ? { optimisticMetadata: this.store.optimisticMetadata }
        : {}),
      ...(this.store.conflictStrategy
        ? { conflictStrategy: this.store.conflictStrategy }
        : {}),
    };
  }
}

export class KatalixStorageBuilder {
  private state: StorageBuilderState;

  constructor(name: string) {
    this.state = {
      name,
      stores: [],
      builderTrace: [`Storage("${name}")`],
    };
  }

  keyValue(
    id: string,
    options: KatalixStorageStoreOptions,
    author?: (store: KatalixStorageStoreBuilder) => KatalixStorageStoreBuilder,
  ): this {
    return this.addStore("key-value", id, options, author);
  }

  secureKeyValue(
    id: string,
    options: KatalixStorageStoreOptions,
    author?: (store: KatalixStorageStoreBuilder) => KatalixStorageStoreBuilder,
  ): this {
    return this.addStore("secure-key-value", id, options, author);
  }

  documentStore(
    id: string,
    options: KatalixStorageStoreOptions,
    author?: (store: KatalixStorageStoreBuilder) => KatalixStorageStoreBuilder,
  ): this {
    return this.addStore("document-store", id, options, author);
  }

  localSql(
    id: string,
    options: KatalixStorageStoreOptions,
    author?: (store: KatalixStorageStoreBuilder) => KatalixStorageStoreBuilder,
  ): this {
    return this.addStore("local-sql", id, options, author);
  }

  cacheStorage(
    id: string,
    options: KatalixStorageStoreOptions,
    author?: (store: KatalixStorageStoreBuilder) => KatalixStorageStoreBuilder,
  ): this {
    return this.addStore("cache-storage", id, options, author);
  }

  offlineQueue(
    id: string,
    options: KatalixStorageStoreOptions,
    author?: (store: KatalixStorageStoreBuilder) => KatalixStorageStoreBuilder,
  ): this {
    return this.addStore("offline-queue", id, options, author);
  }

  toManifest(options?: ToStorageManifestOptions): KatalixStorageManifest {
    return withValidation(
      {
        kind: "storage",
        name: this.state.name,
        stores: [...this.state.stores],
        meta: {
          path: "storage",
          builderTrace: [...this.state.builderTrace],
        },
      },
      options,
    );
  }

  validate(options?: ToStorageManifestOptions): ValidationResult {
    return this.toManifest({ ...options, throwOnError: false }).validation;
  }

  debug(options?: ToStorageManifestOptions) {
    const manifest = this.toManifest({ ...options, throwOnError: false });
    return {
      manifest,
      validation: manifest.validation,
      printed: printStorageManifest(manifest),
    };
  }

  private addStore(
    kind: KatalixStorageKind,
    id: string,
    options: KatalixStorageStoreOptions,
    author?: (store: KatalixStorageStoreBuilder) => KatalixStorageStoreBuilder,
  ): this {
    const builder = new KatalixStorageStoreBuilder(id, kind, options.adapter);
    const store = author ? author(builder).toManifest() : builder.toManifest();
    this.state = {
      ...this.state,
      stores: [...this.state.stores, store],
      builderTrace: [...this.state.builderTrace, kind],
    };
    return this;
  }
}

export const Storage = (name: string) => new KatalixStorageBuilder(name);

export const createStorageAdapterPlan = (
  manifest: KatalixStorageManifest,
  options: { readonly platform: KatalixStoragePlatform },
): readonly StorageAdapterPlanEntry[] =>
  manifest.stores.map((store) => ({
    id: store.id,
    kind: store.kind,
    adapter: store.adapter,
    platform: options.platform,
  }));

export const printStorageManifest = (manifest: KatalixStorageManifest) =>
  [
    `storage name=${manifest.name} stores=${manifest.stores.length}`,
    ...manifest.stores.map(
      (store) => `  ${store.kind} id=${store.id} adapter=${store.adapter}`,
    ),
  ].join("\n");
