import type { LattixNode, LattixTree } from "@lattix/core";
import { walkNodes } from "@lattix/core";

/** Find a node by exact semantic path (as assigned by assignPaths). */
export const findNodeByPath = (
  tree: LattixTree | LattixNode,
  path: string,
): LattixNode | undefined => {
  const root = "root" in tree ? tree.root : tree;
  if (path === "" || path === root.meta?.path) {
    return root;
  }

  for (const node of walkNodes(root)) {
    if (node.meta?.path === path) {
      return node;
    }
  }

  return undefined;
};

/** Build parent trail from root to the target path. */
export const buildPathTrail = (
  tree: LattixTree | LattixNode,
  path: string,
): readonly LattixNode[] => {
  const root = "root" in tree ? tree.root : tree;
  const trail: LattixNode[] = [];

  const visit = (node: LattixNode, ancestors: LattixNode[]): boolean => {
    const nodePath = node.meta?.path ?? (node === root ? "screen" : undefined);
    const nextAncestors = [...ancestors, node];

    if (nodePath === path) {
      trail.push(...nextAncestors);
      return true;
    }

    if (node.children) {
      for (const child of node.children) {
        if (visit(child, nextAncestors)) {
          return true;
        }
      }
    }

    return false;
  };

  visit(root, []);
  return trail;
};
