import type { KatalixDiagnostic } from "../types/diagnostic.js";
import type { KatalixNode } from "../types/node.js";
import { walkNodes } from "./paths.js";

const diagnosticsForPath = (
  diagnostics: readonly KatalixDiagnostic[],
  path: string | undefined,
): readonly KatalixDiagnostic[] => {
  if (!path) {
    return diagnostics.filter((d) => !d.path || d.path === "");
  }
  return diagnostics.filter((d) => d.path === path);
};

/** Attach path-scoped diagnostics to every node in the tree (immutable). */
export const attachDiagnosticsToNodes = (
  root: KatalixNode,
  diagnostics: readonly KatalixDiagnostic[],
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

/** Collect all diagnostics already stored on nodes (e.g. from incremental checks). */
export const collectNodeDiagnostics = (root: KatalixNode): KatalixDiagnostic[] => {
  const collected: KatalixDiagnostic[] = [];
  for (const node of walkNodes(root)) {
    if (node.meta?.diagnostics) {
      collected.push(...node.meta.diagnostics);
    }
  }
  return collected;
};
