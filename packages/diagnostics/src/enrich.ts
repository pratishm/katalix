import type { KatalixDiagnostic } from "@katalix/core";
import type { KatalixNode, KatalixTree } from "@katalix/core";
import { findNodeByPath } from "./paths.js";
import { severityForCode } from "./severity.js";
import type { EnrichedDiagnostic } from "./types.js";

export const enrichDiagnostic = (
  diagnostic: KatalixDiagnostic,
  tree: KatalixTree | KatalixNode,
  mode: "strict" | "report" | "tolerant",
): EnrichedDiagnostic => {
  const node = diagnostic.path ? findNodeByPath(tree, diagnostic.path) : undefined;

  return {
    ...diagnostic,
    severity: severityForCode(diagnostic.code, mode),
    ...(node
      ? {
          authoring: {
            ...(node.debugLabel ? { debugLabel: node.debugLabel } : {}),
            ...(node.meta?.builderTrace
              ? { builderTrace: node.meta.builderTrace }
              : {}),
            ...(node.meta?.source ? { source: node.meta.source } : {}),
          },
        }
      : {}),
  };
};

export const enrichDiagnostics = (
  diagnostics: readonly KatalixDiagnostic[],
  tree: KatalixTree | KatalixNode,
  mode: "strict" | "report" | "tolerant",
): EnrichedDiagnostic[] =>
  diagnostics.map((d) => enrichDiagnostic(d, tree, mode));
