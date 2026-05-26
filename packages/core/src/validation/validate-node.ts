import type { LattixDiagnostic } from "../types/diagnostic.js";
import type { LattixNode } from "../types/node.js";
import { getLattixConfig } from "../config.js";
import { LattixValidationError } from "./validate.js";
import { CORE_VALIDATORS } from "./validators.js";

const SKIP_WHEN_SHALLOW = new Set(["screen-root", "duplicate-id", "empty-container"]);

/**
 * Validate a single node at authoring time (before the full tree exists).
 * Attaches issues to the returned node's meta.diagnostics.
 */
export const validateNodeShallow = (
  node: LattixNode,
  options: { throwOnError?: boolean } = {},
): { node: LattixNode; diagnostics: readonly LattixDiagnostic[] } => {
  const context = {
    seenIds: new Map<string, string>(),
    path: node.meta?.path ?? "",
  };

  const diagnostics: LattixDiagnostic[] = [];
  for (const validator of CORE_VALIDATORS) {
    if (SKIP_WHEN_SHALLOW.has(validator.name)) {
      continue;
    }
    diagnostics.push(...validator.validate(node, context));
  }

  const withDiagnostics: LattixNode =
    diagnostics.length > 0
      ? {
          ...node,
          meta: { ...node.meta, diagnostics },
        }
      : node;

  const config = getLattixConfig();
  const throwOnError =
    options.throwOnError ??
    (config.throwOnValidationError && config.validationMode === "strict");

  if (throwOnError && diagnostics.length > 0) {
    throw new LattixValidationError(diagnostics);
  }

  return { node: withDiagnostics, diagnostics };
};
