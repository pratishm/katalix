import {
  getKatalixConfig,
  KatalixValidationError,
  type KatalixDiagnostic,
  type KatalixNode,
} from "@katalix/core";
import { normalizeStyle, type NormalizeStyleOptions } from "./normalize.js";
import { getAuthoringTokenRegistry } from "./registry.js";

export interface ValidateNodeStyleResult {
  readonly node: KatalixNode;
  readonly diagnostics: readonly KatalixDiagnostic[];
}

/** Validate and normalize styles on a single node (built into authoring). */
export const validateNodeStyle = (
  node: KatalixNode,
  options: NormalizeStyleOptions = {},
): ValidateNodeStyleResult => {
  const { normalized, diagnostics } = normalizeStyle(node.style, {
    registry: options.registry ?? getAuthoringTokenRegistry(),
    ...options,
    path: node.meta?.path,
    nodeKind: node.kind,
  });

  const updated: KatalixNode = {
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

  const config = getKatalixConfig();
  if (
    config.throwOnValidationError &&
    config.validationMode === "strict" &&
    diagnostics.length > 0
  ) {
    throw new KatalixValidationError(diagnostics);
  }

  return { node: updated, diagnostics };
};
