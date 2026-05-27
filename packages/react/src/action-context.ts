import { createContext, useContext } from "react";
import type { KatalixAction } from "@katalix/core";

/**
 * Handler invoked when a semantic action fires (e.g. button onPress).
 * Receives the normalized action object so consumers can dispatch, navigate, etc.
 */
export type KatalixActionHandler = (action: KatalixAction) => void;

/** React context carrying the action handler for the current renderer subtree. */
export const KatalixActionContext = createContext<KatalixActionHandler | undefined>(
  undefined,
);

/** Read the current action handler from context. Returns a no-op if none is provided. */
export const useKatalixAction = (): KatalixActionHandler => {
  const handler = useContext(KatalixActionContext);
  return handler ?? noop;
};

const noop: KatalixActionHandler = () => {};
