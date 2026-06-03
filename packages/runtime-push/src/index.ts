import type { KatalixNativeManifest } from "@katalix/native";
import { createNativeCapabilityPlan } from "@katalix/native";

export interface PushPayload {
  readonly title?: string;
  readonly body?: string;
  readonly data?: Readonly<Record<string, unknown>>;
}

export interface PushAdapter {
  readonly requestPermission: () => Promise<boolean>;
  readonly getToken: () => Promise<string | null>;
  readonly onMessage: (handler: (payload: PushPayload) => void) => () => void;
}

export interface PushRuntime {
  readonly capabilityIds: readonly string[];
  readonly requestPermission: () => Promise<boolean>;
  readonly getToken: () => Promise<string | null>;
  readonly onMessage: (handler: (payload: PushPayload) => void) => () => void;
}

const PUSH_CAPABILITY_PATTERN = /notification|push/i;

/** Push notification runtime (GAP-NATIVE-003). */
export const createPushRuntime = (
  manifest: KatalixNativeManifest,
  adapter?: PushAdapter,
): PushRuntime => {
  const plan = createNativeCapabilityPlan(manifest);
  const capabilityIds = plan
    .filter((entry) => PUSH_CAPABILITY_PATTERN.test(entry.id) || entry.module === "expo-notifications")
    .map((entry) => entry.id);

  const noop = async (): Promise<null> => null;
  const noopUnsub = (): void => undefined;

  return {
    capabilityIds,
    requestPermission: () => adapter?.requestPermission() ?? Promise.resolve(false),
    getToken: () => adapter?.getToken() ?? noop(),
    onMessage: (handler) => adapter?.onMessage(handler) ?? noopUnsub,
  };
};
