import { createContext, useContext } from "react";
import type { LattixAction } from "@lattix/core";

/**
 * Handler invoked when a semantic action fires (e.g. button onPress).
 * Receives the normalized action object so consumers can dispatch, navigate, etc.
 */
export type LattixActionHandler = (action: LattixAction) => void;

/** React context carrying the action handler for the current renderer subtree. */
export const LattixActionContext = createContext<LattixActionHandler | undefined>(
  undefined,
);

/** Read the current action handler from context. Returns a no-op if none is provided. */
export const useLattixAction = (): LattixActionHandler => {
  const handler = useContext(LattixActionContext);
  return handler ?? noop;
};

const noop: LattixActionHandler = () => {};
