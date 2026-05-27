import type { KatalixDiagnostic, KatalixNode, KatalixTree } from "@katalix/core";
import { collectStyleDiagnostics, normalizeTreeStyles } from "./normalize.js";
import type { TokenRegistry } from "./registry.js";

export interface ProcessTreeStylesOptions {
  readonly registry?: TokenRegistry;
}

export interface ProcessTreeStylesResult {
  readonly root: KatalixNode;
  readonly styleDiagnostics: readonly KatalixDiagnostic[];
}

/** Normalize styles on every node and return collected diagnostics. */
export const processTreeStyles = (
  root: KatalixNode,
  options: ProcessTreeStylesOptions = {},
): ProcessTreeStylesResult => {
  const styleDiagnostics = collectStyleDiagnostics(root, { registry: options.registry });
  const styledRoot = normalizeTreeStyles(root, { registry: options.registry });
  return { root: styledRoot, styleDiagnostics };
};

export const processValidatedTreeStyles = (
  tree: KatalixTree,
  options: ProcessTreeStylesOptions = {},
): KatalixTree => {
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
