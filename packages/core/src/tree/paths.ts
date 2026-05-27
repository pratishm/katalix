import type { KatalixNode } from "../types/node.js";

/** Assign semantic paths to every node in the tree (immutable). */
export const assignPaths = (
  node: KatalixNode,
  parentPath = "",
  indexInParent?: number,
): KatalixNode => {
  const segment =
    indexInParent !== undefined
      ? `${node.kind}[${indexInParent}]`
      : node.id
        ? `${node.kind}#${node.id}`
        : node.kind;

  const path = parentPath ? `${parentPath}/${segment}` : segment;

  const children = node.children?.map((child, index) =>
    assignPaths(child, path, index),
  );

  return {
    ...node,
    meta: { ...node.meta, path },
    ...(children ? { children } : {}),
  };
};

/** Collect all nodes in depth-first order. */
export const walkNodes = (node: KatalixNode): KatalixNode[] => {
  const result: KatalixNode[] = [node];
  if (node.children) {
    for (const child of node.children) {
      result.push(...walkNodes(child));
    }
  }
  return result;
};
