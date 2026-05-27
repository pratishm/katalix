import type { KatalixNode } from "@katalix/core";
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
  root: KatalixNode,
  diagnostics: readonly EnrichedDiagnostic[],
): KatalixNode => {
  const attach = (node: KatalixNode): KatalixNode => {
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
