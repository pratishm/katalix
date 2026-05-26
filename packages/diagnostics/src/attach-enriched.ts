import type { LattixNode } from "@lattix/core";
import type { EnrichedDiagnostic } from "./types.js";

const diagnosticsForPath = (
  diagnostics: readonly EnrichedDiagnostic[],
  path: string | undefined,
): readonly EnrichedDiagnostic[] => {
  if (!path) {
    return diagnostics.filter((d) => !d.path || d.path === "");
  }
  return diagnostics.filter((d) => d.path === path);
};

/** Attach enriched diagnostics to each node by semantic path. */
export const attachEnrichedDiagnostics = (
  root: LattixNode,
  diagnostics: readonly EnrichedDiagnostic[],
): LattixNode => {
  const attach = (node: LattixNode): LattixNode => {
    const path = node.meta?.path;
    const nodeDiagnostics = diagnosticsForPath(diagnostics, path);
    const children = node.children?.map(attach);

    return {
      ...node,
      meta: {
        ...node.meta,
        ...(nodeDiagnostics.length > 0 ? { diagnostics: nodeDiagnostics } : {}),
      },
      ...(children ? { children } : {}),
    };
  };

  return attach(root);
};
