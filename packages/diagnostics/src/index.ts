export type {
  DiagnosticAuthoringContext,
  DiagnosticSeverity,
  DiagnosticsValidationResult,
  EnrichedDiagnostic,
  KatalixDiagnostic,
  ValidateDiagnosticsOptions,
  ValidationMode,
  ValidationResult,
} from "./types.js";

export {
  configureKatalix,
  getKatalixConfig,
  resetKatalixConfig,
  type KatalixConfig,
} from "@katalix/core";

export { formatDiagnostic, formatDiagnostics, printDiagnostics } from "./format.js";
export { printTree, type PrintTreeOptions } from "./print-tree.js";
export { explainNode, type ExplainNodeOptions, type NodeExplanation } from "./explain.js";
export {
  validateWithDiagnostics,
  refreshTreeDiagnostics,
  KatalixValidationError,
} from "./validate.js";
export {
  createTree,
  type CreateTreeOptions,
  type KatalixValidatedTree,
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
} from "@katalix/core";

import { createTree } from "./create-tree.js";

/** @deprecated Use createTree — validation is built in. */
export const toTree = createTree;
