// Types
export type {
  KatalixAction,
  KatalixActionId,
  KatalixActionPayload,
  KatalixActionProps,
} from "./types/action.js";
export type {
  KatalixAnimation,
  KatalixAnimationFrame,
  KatalixAnimationPreset,
  KatalixAnimationTransition,
  KatalixAnimationTrigger,
  KatalixAnimationValue,
} from "./types/animation.js";
export type {
  KatalixDiagnostic,
  ValidationMode,
  ValidationResult,
} from "./types/diagnostic.js";
export type {
  KatalixNode,
  KatalixNodeKind,
  KatalixTree,
} from "./types/node.js";
export type {
  KatalixNodeMeta,
  KatalixSourceLocation,
} from "./types/source.js";
export type {
  NormalizedKatalixStyle,
  NormalizedStyleValue,
  KatalixStyle,
  KatalixStyleValue,
} from "./types/style.js";
export { isTokenReference } from "./types/style.js";

// Node kinds and factories
export {
  CONTAINER_KINDS,
  isKnownNodeKind,
  LEAF_KINDS,
  KATALIX_NODE_KINDS,
} from "./nodes/kinds.js";
export {
  configureKatalix,
  getKatalixConfig,
  resetKatalixConfig,
  type KatalixConfig,
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
export type { KatalixValidator, ValidationContext } from "./validation/contracts.js";
export { diagnostic } from "./validation/contracts.js";
export { CORE_VALIDATORS } from "./validation/validators.js";
export {
  KatalixValidationError,
  validateTree,
  type ValidateOptions,
} from "./validation/validate.js";
export { validateNodeShallow } from "./validation/validate-node.js";
