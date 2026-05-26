// Types
export type {
  LattixAction,
  LattixActionId,
  LattixActionPayload,
  LattixActionProps,
} from "./types/action.js";
export type {
  LattixAnimation,
  LattixAnimationFrame,
  LattixAnimationPreset,
  LattixAnimationTransition,
  LattixAnimationTrigger,
  LattixAnimationValue,
} from "./types/animation.js";
export type {
  LattixDiagnostic,
  ValidationMode,
  ValidationResult,
} from "./types/diagnostic.js";
export type {
  LattixNode,
  LattixNodeKind,
  LattixTree,
} from "./types/node.js";
export type {
  LattixNodeMeta,
  LattixSourceLocation,
} from "./types/source.js";
export type {
  NormalizedLattixStyle,
  NormalizedStyleValue,
  LattixStyle,
  LattixStyleValue,
} from "./types/style.js";
export { isTokenReference } from "./types/style.js";

// Node kinds and factories
export {
  CONTAINER_KINDS,
  isKnownNodeKind,
  LEAF_KINDS,
  LATTIX_NODE_KINDS,
} from "./nodes/kinds.js";
export {
  configureLattix,
  getLattixConfig,
  resetLattixConfig,
  type LattixConfig,
} from "./config.js";
export {
  createNode,
  createTree,
  normalizeAction,
  type CreateNodeOptions,
  type CreateTreeOptions,
} from "./nodes/factory.js";

// Tree utilities
export { assignPaths, walkNodes } from "./tree/paths.js";
export {
  attachDiagnosticsToNodes,
  collectNodeDiagnostics,
} from "./tree/attach-diagnostics.js";
export { printTree, toTree, type PrintTreeOptions } from "./tree/print.js";

// Validation
export type { LattixValidator, ValidationContext } from "./validation/contracts.js";
export { diagnostic } from "./validation/contracts.js";
export { CORE_VALIDATORS } from "./validation/validators.js";
export {
  LattixValidationError,
  validateTree,
  type ValidateOptions,
} from "./validation/validate.js";
export { validateNodeShallow } from "./validation/validate-node.js";
