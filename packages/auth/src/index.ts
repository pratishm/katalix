import type {
  LattixDiagnostic,
  LattixSourceLocation,
  ValidationMode,
  ValidationResult,
} from "@lattix/core";

export type LattixAuthPlatform = "web" | "native";
export type LattixAuthProvider = "jwt" | "cookie" | "oauth" | "magic-link" | "anonymous";
export type LattixRefreshStrategy = "rotation" | "sliding" | "manual";
export type LattixAuthBootstrap = "silent" | "required" | "deferred";

export interface LattixAuthStorageRef {
  readonly id: string;
  readonly secure: boolean;
}

export interface LattixAuthGuardRef {
  readonly id: string;
  readonly routeRef?: string;
}

export interface LattixAuthNavigationManifest {
  readonly guards: readonly LattixAuthGuardRef[];
  readonly loginRoute?: string;
}

export interface LattixAuthHeader {
  readonly resourceRef: string;
  readonly header: string;
}

export interface LattixAuthDataManifest {
  readonly authHeaders: readonly LattixAuthHeader[];
}

export interface LattixAuthRefresh {
  readonly endpoint: string;
  readonly strategy: string;
}

export interface LattixAuthLogout {
  readonly endpoint: string;
}

export interface LattixAuthExpiry {
  readonly idleMinutes?: number;
  readonly absoluteMinutes?: number;
}

export interface LattixSessionManifest {
  readonly id: string;
  readonly provider: string;
  readonly refresh?: LattixAuthRefresh;
  readonly logout?: LattixAuthLogout;
  readonly bootstrap?: LattixAuthBootstrap;
  readonly expiry?: LattixAuthExpiry;
}

export interface LattixOAuthManifest {
  readonly id: string;
  readonly redirectUri: string;
}

export interface LattixMagicLinkManifest {
  readonly id: string;
  readonly redirectUri: string;
}

export interface LattixAnonymousSessionManifest {
  readonly id: string;
}

export interface LattixAuthManifestMeta {
  readonly source?: LattixSourceLocation;
  readonly path: string;
  readonly builderTrace: readonly string[];
}

export interface LattixAuthManifest {
  readonly kind: "auth";
  readonly name: string;
  readonly storage?: LattixAuthStorageRef;
  readonly navigation: LattixAuthNavigationManifest;
  readonly data: LattixAuthDataManifest;
  readonly sessions: readonly LattixSessionManifest[];
  readonly oauth: readonly LattixOAuthManifest[];
  readonly magicLinks: readonly LattixMagicLinkManifest[];
  readonly anonymousSessions: readonly LattixAnonymousSessionManifest[];
  readonly meta: LattixAuthManifestMeta;
  readonly validation: ValidationResult;
}

export interface ToAuthManifestOptions {
  readonly mode?: ValidationMode;
  readonly throwOnError?: boolean;
  readonly platform?: LattixAuthPlatform;
}

export interface AuthAdapterPlan {
  readonly name: string;
  readonly platform: LattixAuthPlatform;
  readonly providers: readonly string[];
  readonly storageRef?: string;
  readonly guards: readonly string[];
  readonly refreshEndpoints: readonly string[];
}

interface AuthBuilderState {
  readonly name: string;
  readonly storage?: LattixAuthStorageRef;
  readonly navigation: LattixAuthNavigationManifest;
  readonly data: LattixAuthDataManifest;
  readonly sessions: readonly LattixSessionManifest[];
  readonly oauth: readonly LattixOAuthManifest[];
  readonly magicLinks: readonly LattixMagicLinkManifest[];
  readonly anonymousSessions: readonly LattixAnonymousSessionManifest[];
  readonly builderTrace: readonly string[];
}

const AUTH_PROVIDERS = new Set(["jwt", "cookie", "oauth", "magic-link", "anonymous"]);
const REF_PATTERN = /^[A-Za-z_]\w*$/;
const REFRESH_STRATEGIES = new Set(["rotation", "sliding", "manual"]);

const runtimeDiagnostic = (
  diagnostic: Omit<LattixDiagnostic, "manifestKind">,
): LattixDiagnostic => ({
  manifestKind: "auth",
  ...diagnostic,
});

export class LattixAuthValidationError extends Error {
  readonly diagnostics: readonly LattixDiagnostic[];

  constructor(diagnostics: readonly LattixDiagnostic[]) {
    super(diagnostics[0]?.summary ?? "Lattix auth manifest validation failed.");
    this.name = "LattixAuthValidationError";
    this.diagnostics = diagnostics;
  }
}

export const validateAuthManifest = (
  manifest: LattixAuthManifest,
  options: ToAuthManifestOptions = {},
): ValidationResult => {
  const diagnostics: LattixDiagnostic[] = [];
  const sessionIds = new Set<string>();

  if (manifest.name.trim().length === 0) {
    diagnostics.push(
      runtimeDiagnostic({
        code: "LATTIX_INVALID_AUTH_NAME",
        message: "Auth manifest name is required.",
        summary: "Auth manifest name is required.",
        path: "auth.name",
        field: "name",
        received: manifest.name,
        expected: "A non-empty auth manifest name.",
        suggestion: 'Pass a non-empty name to Auth("Name").',
      }),
    );
  }

  if (manifest.sessions.length > 0 && !manifest.storage) {
    diagnostics.push(
      runtimeDiagnostic({
        code: "LATTIX_MISSING_AUTH_STORAGE",
        message: "Auth sessions need a storage reference.",
        summary: "Session auth should declare where tokens/session metadata are stored.",
        path: "auth.storage",
        field: "storage",
        received: undefined,
        expected: "A storage reference.",
        suggestion: "Call storage() with a secure storage ref.",
      }),
    );
  }

  manifest.navigation.guards.forEach((guard, index) => {
    if (!REF_PATTERN.test(guard.id)) {
      diagnostics.push(
        runtimeDiagnostic({
          code: "LATTIX_INVALID_AUTH_GUARD_REF",
          message: `Invalid auth guard ref "${guard.id}".`,
          summary: "Auth guard refs must be portable identifiers.",
          path: `auth.navigation.guards[${index}].id`,
          field: "navigation.guards.id",
          received: guard.id,
          expected: "A valid identifier.",
          suggestion: "Rename the guard ref, for example authenticated.",
        }),
      );
    }
  });

  manifest.sessions.forEach((session, index) => {
    const path = `auth.sessions[${index}]`;
    if (sessionIds.has(session.id)) {
      diagnostics.push(
        runtimeDiagnostic({
          code: "LATTIX_DUPLICATE_AUTH_SESSION_ID",
          message: `Duplicate auth session id "${session.id}".`,
          summary: "Auth session IDs must be unique.",
          path,
          field: "sessions.id",
          received: session.id,
          expected: "A unique session id.",
          suggestion: "Use a unique session id or remove the duplicate session.",
        }),
      );
    }
    sessionIds.add(session.id);

    if (!AUTH_PROVIDERS.has(session.provider)) {
      diagnostics.push(
        runtimeDiagnostic({
          code: "LATTIX_UNKNOWN_AUTH_PROVIDER",
          message: `Unknown auth provider "${session.provider}".`,
          summary: "Auth manifests only declare known provider contracts.",
          path: `${path}.provider`,
          field: "provider",
          received: session.provider,
          expected: "jwt, cookie, oauth, magic-link, or anonymous.",
          suggestion: "Use a supported provider or model provider-specific details in host code.",
        }),
      );
    }

    if (session.refresh && !REFRESH_STRATEGIES.has(session.refresh.strategy)) {
      diagnostics.push(
        runtimeDiagnostic({
          code: "LATTIX_UNSUPPORTED_AUTH_REFRESH_STRATEGY",
          message: `Unsupported auth refresh strategy "${session.refresh.strategy}".`,
          summary: "Refresh strategies must be portable across supported app targets.",
          path: `${path}.refresh.strategy`,
          field: "refresh.strategy",
          received: session.refresh.strategy,
          expected: "rotation, sliding, or manual.",
          suggestion: "Use a supported refresh strategy or implement provider-specific refresh in host code.",
        }),
      );
    }

    if (options.platform === "native" && session.refresh?.strategy.includes("cookie")) {
      diagnostics.push(
        runtimeDiagnostic({
          code: "LATTIX_UNSAFE_AUTH_PLATFORM_CHOICE",
          message: "Cookie refresh strategy is unsafe for native auth manifests.",
          summary: "Native auth should not rely on browser cookie refresh assumptions.",
          path: `${path}.refresh.strategy`,
          field: "refresh.strategy",
          received: { platform: options.platform, strategy: session.refresh.strategy },
          expected: "A native-safe refresh strategy.",
          suggestion: "Use token rotation or a native provider integration.",
        }),
      );
    }

    if (options.platform === "native" && session.provider === "cookie") {
      diagnostics.push(
        runtimeDiagnostic({
          code: "LATTIX_UNSAFE_AUTH_PLATFORM_CHOICE",
          message: "Cookie-backed sessions are unsafe for native auth manifests.",
          summary: "Native auth should not rely on browser cookie session assumptions.",
          path: `${path}.provider`,
          field: "provider",
          received: { platform: options.platform, provider: session.provider },
          expected: "A native-safe token, OAuth, magic-link, or anonymous provider.",
          suggestion: "Use a native-safe auth provider or handle cookies in host-specific code.",
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
  manifest: Omit<LattixAuthManifest, "validation">,
  options: ToAuthManifestOptions = {},
): LattixAuthManifest => {
  const completeManifest = {
    ...manifest,
    validation: { valid: true, diagnostics: [] },
  } satisfies LattixAuthManifest;
  const validation = validateAuthManifest(completeManifest, options);
  const validatedManifest = { ...completeManifest, validation };
  const mode = options.mode ?? "strict";
  const throwOnError = options.throwOnError ?? mode === "strict";

  if (!validation.valid && throwOnError) {
    throw new LattixAuthValidationError(validation.diagnostics);
  }

  return validatedManifest;
};

export class LattixAuthNavigationBuilder {
  private readonly guards: LattixAuthGuardRef[] = [];
  private loginRouteRef: string | undefined;

  guard(id: string, options: Omit<LattixAuthGuardRef, "id"> = {}): this {
    this.guards.push({ id, ...options });
    return this;
  }

  loginRoute(routeRef: string): this {
    this.loginRouteRef = routeRef;
    return this;
  }

  toManifest(): LattixAuthNavigationManifest {
    return {
      guards: [...this.guards],
      ...(this.loginRouteRef ? { loginRoute: this.loginRouteRef } : {}),
    };
  }
}

export class LattixAuthDataBuilder {
  private readonly authHeaders: LattixAuthHeader[] = [];

  authHeader(resourceRef: string, header: string): this {
    this.authHeaders.push({ resourceRef, header });
    return this;
  }

  toManifest(): LattixAuthDataManifest {
    return { authHeaders: [...this.authHeaders] };
  }
}

export class LattixSessionBuilder {
  private readonly session: {
    id: string;
    provider: string;
    refresh?: LattixAuthRefresh;
    logout?: LattixAuthLogout;
    bootstrap?: LattixAuthBootstrap;
    expiry?: LattixAuthExpiry;
  };

  constructor(id: string, provider: string) {
    this.session = { id, provider };
  }

  refresh(endpoint: string, options: { readonly strategy?: string } = {}): this {
    this.session.refresh = { endpoint, strategy: options.strategy ?? "rotation" };
    return this;
  }

  logout(endpoint: string): this {
    this.session.logout = { endpoint };
    return this;
  }

  bootstrap(mode: LattixAuthBootstrap): this {
    this.session.bootstrap = mode;
    return this;
  }

  expiry(expiry: LattixAuthExpiry): this {
    this.session.expiry = expiry;
    return this;
  }

  toManifest(): LattixSessionManifest {
    return {
      id: this.session.id,
      provider: this.session.provider,
      ...(this.session.refresh ? { refresh: this.session.refresh } : {}),
      ...(this.session.logout ? { logout: this.session.logout } : {}),
      ...(this.session.bootstrap ? { bootstrap: this.session.bootstrap } : {}),
      ...(this.session.expiry ? { expiry: this.session.expiry } : {}),
    };
  }
}

export class LattixAuthBuilder {
  private state: AuthBuilderState;

  constructor(name: string) {
    this.state = {
      name,
      navigation: { guards: [] },
      data: { authHeaders: [] },
      sessions: [],
      oauth: [],
      magicLinks: [],
      anonymousSessions: [],
      builderTrace: [`Auth("${name}")`],
    };
  }

  storage(id: string, options: { readonly secure?: boolean } = {}): this {
    this.state = {
      ...this.state,
      storage: { id, secure: options.secure ?? false },
      builderTrace: [...this.state.builderTrace, "storage"],
    };
    return this;
  }

  navigation(
    author: (navigation: LattixAuthNavigationBuilder) => LattixAuthNavigationBuilder,
  ): this {
    const builder = author(new LattixAuthNavigationBuilder());
    this.state = {
      ...this.state,
      navigation: builder.toManifest(),
      builderTrace: [...this.state.builderTrace, "navigation"],
    };
    return this;
  }

  data(author: (data: LattixAuthDataBuilder) => LattixAuthDataBuilder): this {
    const builder = author(new LattixAuthDataBuilder());
    this.state = {
      ...this.state,
      data: builder.toManifest(),
      builderTrace: [...this.state.builderTrace, "data"],
    };
    return this;
  }

  session(
    id: string,
    provider: string,
    author?: (session: LattixSessionBuilder) => LattixSessionBuilder,
  ): this {
    const builder = new LattixSessionBuilder(id, provider);
    const session = author ? author(builder).toManifest() : builder.toManifest();
    this.state = {
      ...this.state,
      sessions: [...this.state.sessions, session],
      builderTrace: [...this.state.builderTrace, "session"],
    };
    return this;
  }

  oauth(id: string, options: { readonly redirectUri: string }): this {
    this.state = {
      ...this.state,
      oauth: [...this.state.oauth, { id, redirectUri: options.redirectUri }],
      builderTrace: [...this.state.builderTrace, "oauth"],
    };
    return this;
  }

  magicLink(id: string, options: { readonly redirectUri: string }): this {
    this.state = {
      ...this.state,
      magicLinks: [...this.state.magicLinks, { id, redirectUri: options.redirectUri }],
      builderTrace: [...this.state.builderTrace, "magicLink"],
    };
    return this;
  }

  anonymous(id: string): this {
    this.state = {
      ...this.state,
      anonymousSessions: [...this.state.anonymousSessions, { id }],
      builderTrace: [...this.state.builderTrace, "anonymous"],
    };
    return this;
  }

  toManifest(options?: ToAuthManifestOptions): LattixAuthManifest {
    return withValidation(
      {
        kind: "auth",
        name: this.state.name,
        ...(this.state.storage ? { storage: this.state.storage } : {}),
        navigation: this.state.navigation,
        data: this.state.data,
        sessions: [...this.state.sessions],
        oauth: [...this.state.oauth],
        magicLinks: [...this.state.magicLinks],
        anonymousSessions: [...this.state.anonymousSessions],
        meta: {
          path: "auth",
          builderTrace: [...this.state.builderTrace],
        },
      },
      options,
    );
  }

  validate(options?: ToAuthManifestOptions): ValidationResult {
    return this.toManifest({ ...options, throwOnError: false }).validation;
  }

  debug(options?: ToAuthManifestOptions) {
    const manifest = this.toManifest({ ...options, throwOnError: false });
    return {
      manifest,
      validation: manifest.validation,
      printed: printAuthManifest(manifest),
    };
  }
}

export const Auth = (name: string) => new LattixAuthBuilder(name);

export const createAuthAdapterPlan = (
  manifest: LattixAuthManifest,
  options: { readonly platform: LattixAuthPlatform },
): AuthAdapterPlan => ({
  name: manifest.name,
  platform: options.platform,
  providers: manifest.sessions.map((session) => session.provider),
  ...(manifest.storage ? { storageRef: manifest.storage.id } : {}),
  guards: manifest.navigation.guards.map((guard) => guard.id),
  refreshEndpoints: manifest.sessions
    .map((session) => session.refresh?.endpoint)
    .filter((endpoint): endpoint is string => Boolean(endpoint)),
});

export const printAuthManifest = (manifest: LattixAuthManifest) =>
  [
    `auth name=${manifest.name} sessions=${manifest.sessions.length}`,
    ...manifest.sessions.map(
      (session) => `  session id=${session.id} provider=${session.provider}`,
    ),
  ].join("\n");
