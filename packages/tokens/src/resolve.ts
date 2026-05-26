import type { LattixStyleValue } from "@lattix/core";
import { defaultTokenRegistry, hasToken, type TokenRegistry } from "./registry.js";

/** Resolve a token reference to its concrete value (for renderers in Phase 5+). */
export const resolveToken = (
  ref: string,
  registry: TokenRegistry = defaultTokenRegistry,
): LattixStyleValue | undefined => {
  if (!hasToken(ref, registry)) {
    return undefined;
  }
  return registry[ref];
};
