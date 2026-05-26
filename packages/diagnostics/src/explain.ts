import type { LattixNode, LattixTree } from "@lattix/core";
import { formatDiagnostic } from "./format.js";
import { buildPathTrail, findNodeByPath } from "./paths.js";
import type { LattixDiagnostic } from "@lattix/core";
import type { EnrichedDiagnostic } from "./types.js";
import { validateWithDiagnostics } from "./validate.js";

export interface NodeExplanation {
  readonly found: boolean;
  readonly path: string;
  readonly node?: LattixNode;
  readonly trail: readonly LattixNode[];
  readonly formatted: string;
  readonly relatedDiagnostics: readonly (LattixDiagnostic | EnrichedDiagnostic)[];
}

export interface ExplainNodeOptions {
  readonly diagnostics?: readonly EnrichedDiagnostic[];
}

const formatNodeDetail = (node: LattixNode, trail: readonly LattixNode[]): string => {
  const lines = [
    `kind: ${node.kind}`,
    ...(node.id ? [`id: ${node.id}`] : []),
    ...(node.debugLabel ? [`debugLabel: ${node.debugLabel}`] : []),
    ...(node.meta?.path ? [`semanticPath: ${node.meta.path}`] : []),
    `children: ${node.children?.length ?? 0}`,
    `props: ${JSON.stringify(node.props, null, 2)}`,
  ];

  if (node.style && Object.keys(node.style).length > 0) {
    lines.push(`style: ${JSON.stringify(node.style, null, 2)}`);
  }

  if (node.meta?.builderTrace?.length) {
    lines.push("builderTrace:");
    for (const step of node.meta.builderTrace) {
      lines.push(`  → ${step}`);
    }
  }

  if (node.meta?.source) {
    lines.push(
      `source: ${node.meta.source.file ?? "?"}:${node.meta.source.line ?? "?"}:${node.meta.source.column ?? "?"}`,
    );
  }

  if (node.meta?.diagnostics?.length) {
    lines.push("nodeDiagnostics:");
    for (const d of node.meta.diagnostics) {
      lines.push(`  - [${"severity" in d ? (d as EnrichedDiagnostic).severity : "error"}] ${d.code}: ${d.summary}`);
    }
  }

  if (trail.length > 1) {
    lines.push("parentTrail:");
    for (const ancestor of trail.slice(0, -1)) {
      lines.push(
        `  ${ancestor.meta?.path ?? ancestor.kind} (${ancestor.kind}${ancestor.debugLabel ? ` "${ancestor.debugLabel}"` : ""})`,
      );
    }
  }

  return lines.join("\n");
};

/**
 * Explain a node at a semantic path — uses built-in node diagnostics when present.
 */
export const explainNode = (
  tree: LattixTree | LattixNode,
  path: string,
  options: ExplainNodeOptions = {},
): NodeExplanation => {
  const normalized =
    "root" in tree
      ? tree
      : {
          root: tree,
          version: 1 as const,
          validation: validateWithDiagnostics(tree),
        };

  const node = findNodeByPath(normalized, path);
  const trail = node ? buildPathTrail(normalized, path) : [];

  const relatedDiagnostics: readonly (LattixDiagnostic | EnrichedDiagnostic)[] =
    options.diagnostics ??
    node?.meta?.diagnostics ??
    normalized.validation?.diagnostics?.filter((d) => d.path === path) ??
    [];

  if (!node) {
    return {
      found: false,
      path,
      trail,
      formatted: `No node found at path "${path}".`,
      relatedDiagnostics: [...relatedDiagnostics],
    };
  }

  let formatted = formatNodeDetail(node, trail);

  if (relatedDiagnostics.length > 0) {
    formatted += "\n\nRelated diagnostics:\n";
    formatted += relatedDiagnostics.map((d) => formatDiagnostic(d)).join("\n\n");
  }

  return {
    found: true,
    path,
    node,
    trail,
    formatted,
    relatedDiagnostics: [...relatedDiagnostics],
  };
};
