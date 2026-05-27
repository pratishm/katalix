import type { KatalixNode, KatalixTree } from "../types/node.js";

export interface PrintTreeOptions {
  readonly indent?: number;
  readonly showMeta?: boolean;
}

const indentLine = (depth: number, text: string): string =>
  "  ".repeat(depth) + text;

const formatNodeLine = (node: KatalixNode, showMeta: boolean): string => {
  const parts = [node.kind];
  if (node.id) {
    parts.push(`id=${node.id}`);
  }
  if (node.debugLabel) {
    parts.push(`label="${node.debugLabel}"`);
  }
  if (showMeta && node.meta?.path) {
    parts.push(`path=${node.meta.path}`);
  }
  return parts.join(" ");
};

const printNode = (
  node: KatalixNode,
  depth: number,
  options: PrintTreeOptions,
): string[] => {
  const lines = [indentLine(depth, formatNodeLine(node, options.showMeta ?? true))];
  if (node.children) {
    for (const child of node.children) {
      lines.push(...printNode(child, depth + 1, options));
    }
  }
  return lines;
};

/** Human-readable tree printer for debugging (Phase 1 baseline). */
export const printTree = (
  tree: KatalixTree | KatalixNode,
  options: PrintTreeOptions = {},
): string => {
  const root = "root" in tree ? tree.root : tree;
  return printNode(root, 0, options).join("\n");
};

/** Build a validated tree from a root node (validation runs automatically). */
export { createTree as toTree } from "../nodes/factory.js";
