import { validateTree, type LattixNode, type LattixTree } from "@lattix/core";
import type { ValidationResult } from "@lattix/core";

/** Run core validators without throwing (internal). */
export const runValidation = (
  tree: LattixTree | LattixNode,
  options: { assignPaths?: boolean } = {},
): ValidationResult =>
  validateTree(tree, { mode: "report", assignPaths: options.assignPaths ?? false });
