import {
  assignPaths,
  getLattixConfig,
  type LattixNode,
  type LattixTree,
} from "@lattix/core";
import { processTreeStyles } from "@lattix/tokens";
import { attachEnrichedDiagnostics } from "./attach-enriched.js";
import { enrichDiagnostics } from "./enrich.js";
import type {
  DiagnosticsValidationResult,
  ValidateDiagnosticsOptions,
} from "./types.js";
import { runValidation } from "./validate-internal.js";
import { LattixValidationError } from "./validate.js";

export interface CreateTreeOptions extends ValidateDiagnosticsOptions {
  readonly throwOnError?: boolean;
}

/** Tree with enriched validation — produced by all authoring entry points. */
export interface LattixValidatedTree extends LattixTree {
  readonly validation: DiagnosticsValidationResult;
}

/**
 * Build a semantic tree with validation and per-node diagnostics attached by default.
 * Throws on invalid trees in strict mode unless throwOnError is false.
 */
export const createTree = (
  root: LattixNode,
  options: CreateTreeOptions = {},
): LattixValidatedTree => {
  const config = getLattixConfig();
  const mode = options.mode ?? config.validationMode;
  const throwOnError =
    options.throwOnError ??
    (config.throwOnValidationError && mode === "strict");

  const withPaths =
    options.assignPaths !== false ? assignPaths(root) : root;

  const { root: styledRoot, styleDiagnostics } = processTreeStyles(withPaths);
  const base = runValidation(styledRoot, { assignPaths: false });
  const combinedDiagnostics = [...base.diagnostics, ...styleDiagnostics];
  const enriched = enrichDiagnostics(combinedDiagnostics, styledRoot, mode);
  const { errors, warnings } = {
    errors: enriched.filter((d) => d.severity === "error"),
    warnings: enriched.filter((d) => d.severity === "warning"),
  };
  const valid = mode === "tolerant" ? errors.length === 0 : enriched.length === 0;

  const validation: DiagnosticsValidationResult = {
    valid,
    diagnostics: enriched,
    errors,
    warnings,
  };

  const rootWithDiagnostics = attachEnrichedDiagnostics(styledRoot, enriched);

  const tree: LattixValidatedTree = {
    root: rootWithDiagnostics,
    version: 1,
    validation,
  };

  if (throwOnError && !valid) {
    throw new LattixValidationError(enriched);
  }

  return tree;
};
