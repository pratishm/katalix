import {
  getLattixConfig,
  LattixValidationError,
  type LattixDiagnostic,
  type LattixNode,
} from "@lattix/core";
import { normalizeStyle, type NormalizeStyleOptions } from "./normalize.js";

export interface ValidateNodeStyleResult {
  readonly node: LattixNode;
  readonly diagnostics: readonly LattixDiagnostic[];
}

/** Validate and normalize styles on a single node (built into authoring). */
export const validateNodeStyle = (
  node: LattixNode,
  options: NormalizeStyleOptions = {},
): ValidateNodeStyleResult => {
  const { normalized, diagnostics } = normalizeStyle(node.style, {
    ...options,
    path: node.meta?.path,
    nodeKind: node.kind,
  });

  const updated: LattixNode = {
    ...node,
    ...(Object.keys(normalized).length > 0 ? { normalizedStyle: normalized } : {}),
    ...(diagnostics.length > 0
      ? {
          meta: {
            ...node.meta,
            diagnostics: [...(node.meta?.diagnostics ?? []), ...diagnostics],
          },
        }
      : {}),
  };

  const config = getLattixConfig();
  if (
    config.throwOnValidationError &&
    config.validationMode === "strict" &&
    diagnostics.length > 0
  ) {
    throw new LattixValidationError(diagnostics);
  }

  return { node: updated, diagnostics };
};
