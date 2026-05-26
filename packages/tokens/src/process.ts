import type { LattixDiagnostic, LattixNode, LattixTree } from "@lattix/core";
import { collectStyleDiagnostics, normalizeTreeStyles } from "./normalize.js";
import type { TokenRegistry } from "./registry.js";

export interface ProcessTreeStylesOptions {
  readonly registry?: TokenRegistry;
}

export interface ProcessTreeStylesResult {
  readonly root: LattixNode;
  readonly styleDiagnostics: readonly LattixDiagnostic[];
}

/** Normalize styles on every node and return collected diagnostics. */
export const processTreeStyles = (
  root: LattixNode,
  options: ProcessTreeStylesOptions = {},
): ProcessTreeStylesResult => {
  const styleDiagnostics = collectStyleDiagnostics(root, { registry: options.registry });
  const styledRoot = normalizeTreeStyles(root, { registry: options.registry });
  return { root: styledRoot, styleDiagnostics };
};

export const processValidatedTreeStyles = (
  tree: LattixTree,
  options: ProcessTreeStylesOptions = {},
): LattixTree => {
  const { root, styleDiagnostics } = processTreeStyles(tree.root, options);
  return {
    ...tree,
    root,
    validation: {
      ...tree.validation,
      valid: tree.validation.valid && styleDiagnostics.length === 0,
      diagnostics: [...tree.validation.diagnostics, ...styleDiagnostics],
    },
  };
};
