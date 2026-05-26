import {
  LattixValidationError,
  assignPaths,
  type LattixNode,
  type LattixTree,
} from "@lattix/core";
import { attachEnrichedDiagnostics } from "./attach-enriched.js";
import { enrichDiagnostics } from "./enrich.js";
import type {
  DiagnosticsValidationResult,
  ValidateDiagnosticsOptions,
} from "./types.js";
import { runValidation } from "./validate-internal.js";

export { LattixValidationError };

/** Validate a tree with enriched diagnostics. */
export const validateWithDiagnostics = (
  tree: LattixTree | LattixNode,
  options: ValidateDiagnosticsOptions = {},
): DiagnosticsValidationResult => {
  const { mode = "report", assignPaths: shouldAssignPaths = true } = options;

  const rawRoot = "root" in tree ? tree.root : tree;
  const withPaths = shouldAssignPaths ? assignPaths(rawRoot) : rawRoot;

  const base = runValidation(withPaths, { assignPaths: false });
  const enriched = enrichDiagnostics(base.diagnostics, withPaths, mode);
  const errorItems = enriched.filter((d) => d.severity === "error");
  const warningItems = enriched.filter((d) => d.severity === "warning");
  const valid = mode === "tolerant" ? errorItems.length === 0 : enriched.length === 0;

  if (mode === "strict" && !valid) {
    throw new LattixValidationError(enriched);
  }

  return {
    valid,
    diagnostics: enriched,
    errors: errorItems,
    warnings: warningItems,
  };
};

/** Re-validate and write enriched diagnostics back onto every node. */
export const refreshTreeDiagnostics = (
  tree: LattixTree,
  options: ValidateDiagnosticsOptions = {},
): LattixTree & { validation: DiagnosticsValidationResult } => {
  const validation = validateWithDiagnostics(tree, {
    ...options,
    assignPaths: false,
  });
  const root = attachEnrichedDiagnostics(tree.root, validation.diagnostics);
  return { ...tree, root, validation };
};
