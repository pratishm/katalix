import type {
  LattixDiagnostic,
  LattixSourceLocation,
  ValidationMode,
  ValidationResult,
} from "@lattix/core";

export type LattixDataOperationKind = "query" | "mutation" | "subscription";
export type LattixDataUiState =
  | "idle"
  | "loading"
  | "refreshing"
  | "success"
  | "empty"
  | "error"
  | "stale"
  | "offline";

export interface LattixDataRetryPolicy {
  readonly attempts: number;
  readonly backoff?: "fixed" | "linear" | "exponential";
}

export interface LattixDataOperationManifest {
  readonly id: string;
  readonly kind: LattixDataOperationKind;
  readonly method: string;
  readonly path: string;
  readonly cacheKeys: readonly string[];
  readonly invalidates: readonly string[];
  readonly retry?: LattixDataRetryPolicy;
  readonly cancellation: boolean;
  readonly errorMap?: string;
  readonly requiresAuth: boolean;
  readonly states: readonly LattixDataUiState[];
}

export interface LattixDataResourceManifest {
  readonly id: string;
  readonly operations: readonly LattixDataOperationManifest[];
}

export interface LattixDataManifestMeta {
  readonly source?: LattixSourceLocation;
  readonly path: string;
  readonly builderTrace: readonly string[];
}

export interface LattixDataManifest {
  readonly kind: "data";
  readonly name: string;
  readonly baseUrl?: string;
  readonly authRef?: string;
  readonly resources: readonly LattixDataResourceManifest[];
  readonly meta: LattixDataManifestMeta;
  readonly validation: ValidationResult;
}

export interface ToDataManifestOptions {
  readonly mode?: ValidationMode;
  readonly throwOnError?: boolean;
}

export interface FetchAdapterOperationContract {
  readonly id: string;
  readonly method: string;
  readonly url: string;
  readonly cancellation: boolean;
}

export interface TanStackQueryOperationContract {
  readonly id: string;
  readonly kind: LattixDataOperationKind;
  readonly queryKey: readonly string[];
  readonly method: string;
  readonly path: string;
  readonly invalidates: readonly string[];
  readonly retry?: LattixDataRetryPolicy;
  readonly requiresAuth: boolean;
  readonly errorMap?: string;
  readonly states: readonly LattixDataUiState[];
}

export interface GraphQLAdapterOperationContract {
  readonly id: string;
  readonly operation: LattixDataOperationKind;
  readonly documentRef: string;
}

export interface RpcAdapterOperationContract {
  readonly id: string;
  readonly procedure: string;
  readonly kind: LattixDataOperationKind;
}

interface DataBuilderState {
  readonly name: string;
  readonly baseUrl?: string;
  readonly authRef?: string;
  readonly resources: readonly LattixDataResourceManifest[];
  readonly builderTrace: readonly string[];
}

type MutableOperation = {
  id: string;
  kind: LattixDataOperationKind;
  method: string;
  path: string;
  cacheKeys: string[];
  invalidates: string[];
  retry?: LattixDataRetryPolicy;
  cancellation: boolean;
  errorMap?: string;
  requiresAuth: boolean;
  states: LattixDataUiState[];
};

const VALID_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);
const UNSAFE_MUTATION_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const optionalString = <K extends string>(
  key: K,
  value: string | undefined,
): Record<K, string> | Record<string, never> =>
  value === undefined ? {} : ({ [key]: value } as Record<K, string>);

const runtimeDiagnostic = (
  diagnostic: Omit<LattixDiagnostic, "manifestKind">,
): LattixDiagnostic => ({
  manifestKind: "data",
  ...diagnostic,
});

export class LattixDataValidationError extends Error {
  readonly diagnostics: readonly LattixDiagnostic[];

  constructor(diagnostics: readonly LattixDiagnostic[]) {
    super(diagnostics[0]?.summary ?? "Lattix data manifest validation failed.");
    this.name = "LattixDataValidationError";
    this.diagnostics = diagnostics;
  }
}

export const validateDataManifest = (
  manifest: LattixDataManifest,
): ValidationResult => {
  const diagnostics: LattixDiagnostic[] = [];
  const resourceIds = new Set<string>();
  const operationIds = new Set<string>();

  if (manifest.name.trim().length === 0) {
    diagnostics.push(
      runtimeDiagnostic({
        code: "LATTIX_INVALID_DATA_NAME",
        message: "Data manifest name is required.",
        summary: "Data manifest name is required.",
        path: "data.name",
        field: "name",
        received: manifest.name,
        expected: "A non-empty data manifest name.",
        suggestion: 'Pass a non-empty name to Data("Name").',
      }),
    );
  }

  if (!manifest.baseUrl || manifest.baseUrl.trim().length === 0) {
    diagnostics.push(
      runtimeDiagnostic({
        code: "LATTIX_MISSING_DATA_BASE_URL",
        message: "Data base URL is required.",
        summary: "Data manifests need a base URL or environment-backed base URL reference.",
        path: "data.baseUrl",
        field: "baseUrl",
        received: manifest.baseUrl ?? "",
        expected: "A non-empty base URL.",
        suggestion: "Call baseUrl() before adding resources.",
      }),
    );
  }

  manifest.resources.forEach((resource, resourceIndex) => {
    const resourcePath = `data.resources[${resourceIndex}]`;
    if (resourceIds.has(resource.id)) {
      diagnostics.push(
        runtimeDiagnostic({
          code: "LATTIX_DUPLICATE_DATA_RESOURCE_ID",
          message: `Duplicate data resource id "${resource.id}".`,
          summary: `Data resource id "${resource.id}" is declared more than once.`,
          path: resourcePath,
          field: "resources.id",
          received: resource.id,
          expected: "A unique resource id.",
          suggestion: "Use a unique resource id or remove the duplicate resource.",
        }),
      );
    }
    resourceIds.add(resource.id);

    resource.operations.forEach((operation, operationIndex) => {
      const operationPath = `${resourcePath}.operations[${operationIndex}]`;
      const qualifiedOperationId = `${resource.id}.${operation.id}`;

      if (operationIds.has(qualifiedOperationId)) {
        diagnostics.push(
          runtimeDiagnostic({
            code: "LATTIX_DUPLICATE_DATA_OPERATION_ID",
            message: `Duplicate data operation id "${qualifiedOperationId}".`,
            summary: `Data operation "${qualifiedOperationId}" is declared more than once.`,
            path: operationPath,
            field: "operations.id",
            received: qualifiedOperationId,
            expected: "A unique operation id per resource.",
            suggestion: "Use a unique operation id or remove the duplicate operation.",
          }),
        );
      }
      operationIds.add(qualifiedOperationId);

      if (!VALID_METHODS.has(operation.method)) {
        diagnostics.push(
          runtimeDiagnostic({
            code: "LATTIX_INVALID_DATA_METHOD",
            message: `Invalid data method "${operation.method}".`,
            summary: `Data operation "${qualifiedOperationId}" uses an unsupported HTTP method.`,
            path: `${operationPath}.method`,
            field: "method",
            received: operation.method,
            expected: "GET, POST, PUT, PATCH, DELETE, HEAD, or OPTIONS.",
            suggestion: "Use a standard HTTP method or model the call through a custom RPC adapter.",
          }),
        );
      }

      if (
        operation.kind === "mutation" &&
        UNSAFE_MUTATION_METHODS.has(operation.method)
      ) {
        diagnostics.push(
          runtimeDiagnostic({
            code: "LATTIX_UNSAFE_MUTATION_CONFIG",
            message: `Mutation "${qualifiedOperationId}" uses ${operation.method}.`,
            summary: "Mutations should use a write-oriented HTTP method.",
            path: `${operationPath}.method`,
            field: "method",
            received: operation.method,
            expected: "POST, PUT, PATCH, or DELETE.",
            suggestion: "Use a write-oriented method for mutations.",
          }),
        );
      }

      if (operation.requiresAuth && !manifest.authRef) {
        diagnostics.push(
          runtimeDiagnostic({
            code: "LATTIX_UNHANDLED_DATA_AUTH_REQUIREMENT",
            message: `Operation "${qualifiedOperationId}" requires auth but no auth binding exists.`,
            summary: "Authenticated data operations need a manifest-level auth reference.",
            path: `${operationPath}.requiresAuth`,
            field: "requiresAuth",
            received: true,
            expected: "A manifest-level auth reference.",
            suggestion: "Call auth() on the data manifest or remove authRequired() from the operation.",
          }),
        );
      }

      if (!operation.errorMap) {
        diagnostics.push(
          runtimeDiagnostic({
            code: "LATTIX_MISSING_DATA_ERROR_MAP",
            message: `Operation "${qualifiedOperationId}" is missing error normalization.`,
            summary: "Data operations should declare how errors normalize for UI states.",
            path: `${operationPath}.errorMap`,
            field: "errorMap",
            received: undefined,
            expected: "An error map reference.",
            suggestion: "Call errorMap() with a named error normalization contract.",
          }),
        );
      }
    });
  });

  return {
    valid: diagnostics.length === 0,
    diagnostics,
  };
};

const withValidation = (
  manifest: Omit<LattixDataManifest, "validation">,
  options: ToDataManifestOptions = {},
): LattixDataManifest => {
  const completeManifest = {
    ...manifest,
    validation: { valid: true, diagnostics: [] },
  } satisfies LattixDataManifest;
  const validation = validateDataManifest(completeManifest);
  const validatedManifest = { ...completeManifest, validation };
  const mode = options.mode ?? "strict";
  const throwOnError = options.throwOnError ?? mode === "strict";

  if (!validation.valid && throwOnError) {
    throw new LattixDataValidationError(validation.diagnostics);
  }

  return validatedManifest;
};

export class LattixDataOperationBuilder {
  private readonly operation: MutableOperation;

  constructor(kind: LattixDataOperationKind, id: string, method: string, path: string) {
    this.operation = {
      id,
      kind,
      method,
      path,
      cacheKeys: [],
      invalidates: [],
      cancellation: true,
      requiresAuth: false,
      states: [],
    };
  }

  cacheKey(key: string): this {
    this.operation.cacheKeys.push(key);
    return this;
  }

  invalidates(key: string): this {
    this.operation.invalidates.push(key);
    return this;
  }

  retry(policy: LattixDataRetryPolicy): this {
    this.operation.retry = policy;
    return this;
  }

  disableCancellation(): this {
    this.operation.cancellation = false;
    return this;
  }

  errorMap(ref: string): this {
    this.operation.errorMap = ref;
    return this;
  }

  authRequired(): this {
    this.operation.requiresAuth = true;
    return this;
  }

  state(state: LattixDataUiState): this {
    this.operation.states.push(state);
    return this;
  }

  toManifest(): LattixDataOperationManifest {
    return {
      id: this.operation.id,
      kind: this.operation.kind,
      method: this.operation.method,
      path: this.operation.path,
      cacheKeys: [...this.operation.cacheKeys],
      invalidates: [...this.operation.invalidates],
      ...(this.operation.retry ? { retry: this.operation.retry } : {}),
      cancellation: this.operation.cancellation,
      ...(this.operation.errorMap ? { errorMap: this.operation.errorMap } : {}),
      requiresAuth: this.operation.requiresAuth,
      states: [...this.operation.states],
    };
  }
}

export class LattixDataResourceBuilder {
  private readonly id: string;
  private readonly operations: LattixDataOperationManifest[] = [];

  constructor(id: string) {
    this.id = id;
  }

  query(
    id: string,
    method: string,
    path: string,
    author?: (operation: LattixDataOperationBuilder) => LattixDataOperationBuilder,
  ): this {
    return this.addOperation("query", id, method, path, author);
  }

  mutation(
    id: string,
    method: string,
    path: string,
    author?: (operation: LattixDataOperationBuilder) => LattixDataOperationBuilder,
  ): this {
    return this.addOperation("mutation", id, method, path, author);
  }

  subscription(
    id: string,
    path: string,
    author?: (operation: LattixDataOperationBuilder) => LattixDataOperationBuilder,
  ): this {
    return this.addOperation("subscription", id, "GET", path, author);
  }

  toManifest(): LattixDataResourceManifest {
    return {
      id: this.id,
      operations: [...this.operations],
    };
  }

  private addOperation(
    kind: LattixDataOperationKind,
    id: string,
    method: string,
    path: string,
    author?: (operation: LattixDataOperationBuilder) => LattixDataOperationBuilder,
  ): this {
    const builder = new LattixDataOperationBuilder(kind, id, method, path);
    const operation = author ? author(builder).toManifest() : builder.toManifest();
    this.operations.push(operation);
    return this;
  }
}

export class LattixDataBuilder {
  private state: DataBuilderState;

  constructor(name: string) {
    this.state = {
      name,
      resources: [],
      builderTrace: [`Data("${name}")`],
    };
  }

  baseUrl(baseUrl: string): this {
    this.state = {
      ...this.state,
      baseUrl,
      builderTrace: [...this.state.builderTrace, "baseUrl"],
    };
    return this;
  }

  auth(ref: string): this {
    this.state = {
      ...this.state,
      authRef: ref,
      builderTrace: [...this.state.builderTrace, "auth"],
    };
    return this;
  }

  resource(
    id: string,
    author: (resource: LattixDataResourceBuilder) => LattixDataResourceBuilder,
  ): this {
    const builder = author(new LattixDataResourceBuilder(id));
    this.state = {
      ...this.state,
      resources: [...this.state.resources, builder.toManifest()],
      builderTrace: [...this.state.builderTrace, "resource"],
    };
    return this;
  }

  toManifest(options?: ToDataManifestOptions): LattixDataManifest {
    return withValidation(
      {
        kind: "data",
        name: this.state.name,
        ...optionalString("baseUrl", this.state.baseUrl),
        ...optionalString("authRef", this.state.authRef),
        resources: [...this.state.resources],
        meta: {
          path: "data",
          builderTrace: [...this.state.builderTrace],
        },
      },
      options,
    );
  }

  validate(options?: ToDataManifestOptions): ValidationResult {
    return this.toManifest({ ...options, throwOnError: false }).validation;
  }

  debug(options?: ToDataManifestOptions) {
    const manifest = this.toManifest({ ...options, throwOnError: false });
    return {
      manifest,
      validation: manifest.validation,
      printed: printDataManifest(manifest),
    };
  }
}

export const Data = (name: string) => new LattixDataBuilder(name);

const qualifiedOperationId = (
  resource: LattixDataResourceManifest,
  operation: LattixDataOperationManifest,
) => `${resource.id}.${operation.id}`;

const joinUrl = (baseUrl: string, path: string) =>
  `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

export const createFetchAdapterContract = (
  manifest: LattixDataManifest,
): readonly FetchAdapterOperationContract[] =>
  manifest.resources.flatMap((resource) =>
    resource.operations.map((operation) => ({
      id: qualifiedOperationId(resource, operation),
      method: operation.method,
      url: joinUrl(manifest.baseUrl ?? "", operation.path),
      cancellation: operation.cancellation,
    })),
  );

export const createTanStackQueryContract = (
  manifest: LattixDataManifest,
): readonly TanStackQueryOperationContract[] =>
  manifest.resources.flatMap((resource) =>
    resource.operations.map((operation) => ({
      id: qualifiedOperationId(resource, operation),
      kind: operation.kind,
      queryKey:
        operation.cacheKeys.length > 0
          ? [...operation.cacheKeys]
          : [resource.id, operation.id],
      method: operation.method,
      path: operation.path,
      invalidates: [...operation.invalidates],
      retry: operation.retry,
      requiresAuth: operation.requiresAuth,
      errorMap: operation.errorMap,
      states: [...operation.states],
    })),
  );

export const createGraphQLAdapterContract = (
  manifest: LattixDataManifest,
): readonly GraphQLAdapterOperationContract[] =>
  manifest.resources.flatMap((resource) =>
    resource.operations.map((operation) => ({
      id: qualifiedOperationId(resource, operation),
      operation: operation.kind,
      documentRef: qualifiedOperationId(resource, operation),
    })),
  );

export const createRpcAdapterContract = (
  manifest: LattixDataManifest,
): readonly RpcAdapterOperationContract[] =>
  manifest.resources.flatMap((resource) =>
    resource.operations.map((operation) => ({
      id: qualifiedOperationId(resource, operation),
      procedure: qualifiedOperationId(resource, operation),
      kind: operation.kind,
    })),
  );

export const printDataManifest = (manifest: LattixDataManifest) =>
  [
    `data name=${manifest.name} resources=${manifest.resources.length}`,
    ...manifest.resources.flatMap((resource) => [
      `  resource id=${resource.id}`,
      ...resource.operations.map(
        (operation) =>
          `    ${operation.kind} id=${operation.id} method=${operation.method} path=${operation.path}`,
      ),
    ]),
  ].join("\n");
