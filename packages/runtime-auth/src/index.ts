import type { KatalixAuthManifest } from "@katalix/auth";
import type { KeyValueStore, StorageRuntime } from "@katalix/runtime-storage";

export interface AuthSession {
  readonly accessToken?: string;
  readonly refreshToken?: string;
  readonly userId?: string;
}

export interface AuthSessionRuntime {
  readonly session: AuthSession | null;
  readonly isAuthenticated: () => boolean;
  readonly bootstrap: () => Promise<void>;
  readonly login: (tokens: AuthSession) => Promise<void>;
  readonly logout: () => Promise<void>;
  readonly getAuthHeader: () => string | undefined;
}

export interface CreateAuthSessionRuntimeOptions {
  readonly storage: StorageRuntime;
  readonly secureStoreId?: string;
  readonly sessionKey?: string;
}

const SESSION_KEY = "katalix.session";

/** Session runtime with secure storage binding (GAP-AUTH-001, GAP-AUTH-004). */
export const createAuthSessionRuntime = (
  manifest: KatalixAuthManifest,
  options: CreateAuthSessionRuntimeOptions,
): AuthSessionRuntime => {
  const storeId = options.secureStoreId ?? manifest.storage?.id;
  if (!storeId) {
    throw new Error("Auth manifest requires at least one storage reference");
  }
  const kv: KeyValueStore = options.storage.store(storeId);
  const key = options.sessionKey ?? SESSION_KEY;
  let session: AuthSession | null = null;

  const persist = async (value: AuthSession | null): Promise<void> => {
    if (value === null) {
      await kv.removeItem(key);
      return;
    }
    await kv.setItem(key, JSON.stringify(value));
  };

  return {
    get session() {
      return session;
    },
    isAuthenticated: () => session?.accessToken !== undefined,
    bootstrap: async () => {
      const raw = await kv.getItem(key);
      if (!raw) {
        session = null;
        return;
      }
      session = JSON.parse(raw) as AuthSession;
    },
    login: async (tokens) => {
      session = tokens;
      await persist(tokens);
    },
    logout: async () => {
      session = null;
      await persist(null);
    },
    getAuthHeader: () =>
      session?.accessToken ? `Bearer ${session.accessToken}` : undefined,
  };
};
