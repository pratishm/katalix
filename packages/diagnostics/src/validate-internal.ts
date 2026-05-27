import { validateTree, type KatalixNode, type KatalixTree } from "@katalix/core";
import type { ValidationResult } from "@katalix/core";

/** Run core validators without throwing (internal). */
export const runValidation = (
  tree: KatalixTree | KatalixNode,
  options: { assignPaths?: boolean } = {},
): ValidationResult =>
  validateTree(tree, { mode: "report", assignPaths: options.assignPaths ?? false });
