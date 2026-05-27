import type { KatalixDiagnostic } from "../types/diagnostic.js";
import type { KatalixNode } from "../types/node.js";
import { getKatalixConfig } from "../config.js";
import { KatalixValidationError } from "./validate.js";
import { CORE_VALIDATORS } from "./validators.js";

const SKIP_WHEN_SHALLOW = new Set(["screen-root", "duplicate-id", "empty-container"]);

/**
 * Validate a single node at authoring time (before the full tree exists).
 * Attaches issues to the returned node's meta.diagnostics.
 */
export const validateNodeShallow = (
  node: KatalixNode,
  options: { throwOnError?: boolean } = {},
): { node: KatalixNode; diagnostics: readonly KatalixDiagnostic[] } => {
  const context = {
    seenIds: new Map<string, string>(),
    path: node.meta?.path ?? "",
  };

  const diagnostics: KatalixDiagnostic[] = [];
  for (const validator of CORE_VALIDATORS) {
    if (SKIP_WHEN_SHALLOW.has(validator.name)) {
      continue;
    }
    diagnostics.push(...validator.validate(node, context));
  }

  const withDiagnostics: KatalixNode =
    diagnostics.length > 0
      ? {
          ...node,
          meta: { ...node.meta, diagnostics },
        }
      : node;

  const config = getKatalixConfig();
  const throwOnError =
    options.throwOnError ??
    (config.throwOnValidationError && config.validationMode === "strict");

  if (throwOnError && diagnostics.length > 0) {
    throw new KatalixValidationError(diagnostics);
  }

  return { node: withDiagnostics, diagnostics };
};
