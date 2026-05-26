import { createContext, useContext } from "react";
import { defaultTokenRegistry, type TokenRegistry } from "@lattix/tokens";

/** React context carrying the token registry for style resolution. */
export const LattixRegistryContext = createContext<TokenRegistry>(
  defaultTokenRegistry,
);

/** Read the current token registry from context. */
export const useTokenRegistry = (): TokenRegistry =>
  useContext(LattixRegistryContext);
