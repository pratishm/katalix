import type { KatalixNativeManifest } from "@katalix/native";
import { createNativeCapabilityPlan } from "@katalix/native";
import type { PushAdapter, PushRuntime } from "./types.js";

export type { PushAdapter, PushPayload, PushRuntime } from "./types.js";

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

export {
  createExpoPushAdapter,
  createWebNotificationPushAdapter,
  resolveDefaultPushAdapter,
} from "./default-adapters.js";
