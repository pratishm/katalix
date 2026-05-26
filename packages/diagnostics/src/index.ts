export type {
  DiagnosticAuthoringContext,
  DiagnosticSeverity,
  DiagnosticsValidationResult,
  EnrichedDiagnostic,
  LattixDiagnostic,
  ValidateDiagnosticsOptions,
  ValidationMode,
  ValidationResult,
} from "./types.js";

export {
  configureLattix,
  getLattixConfig,
  resetLattixConfig,
  type LattixConfig,
} from "@lattix/core";

export { formatDiagnostic, formatDiagnostics, printDiagnostics } from "./format.js";
export { printTree, type PrintTreeOptions } from "./print-tree.js";
export { explainNode, type ExplainNodeOptions, type NodeExplanation } from "./explain.js";
export {
  validateWithDiagnostics,
  refreshTreeDiagnostics,
  LattixValidationError,
} from "./validate.js";
export {
  createTree,
  type CreateTreeOptions,
  type LattixValidatedTree,
} from "./create-tree.js";
export { findNodeByPath, buildPathTrail } from "./paths.js";
export { severityForCode, partitionBySeverity } from "./severity.js";
export { enrichDiagnostic, enrichDiagnostics } from "./enrich.js";

export {
  assignPaths,
  walkNodes,
  createNode,
  normalizeAction,
  validateTree,
  validateNodeShallow,
} from "@lattix/core";

import { createTree } from "./create-tree.js";

/** @deprecated Use createTree — validation is built in. */
export const toTree = createTree;
