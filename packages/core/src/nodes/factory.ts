import type { LattixAction } from "../types/action.js";
import type { LattixAnimation } from "../types/animation.js";
import type { ValidationMode } from "../types/diagnostic.js";
import type { LattixNode, LattixNodeKind, LattixTree } from "../types/node.js";
import type { LattixNodeMeta, LattixSourceLocation } from "../types/source.js";
import type { LattixStyle } from "../types/style.js";
import { getLattixConfig } from "../config.js";
import { assignPaths } from "../tree/paths.js";
import { attachDiagnosticsToNodes } from "../tree/attach-diagnostics.js";
import {
  LattixValidationError,
  validateTree,
} from "../validation/validate.js";

export interface CreateNodeOptions {
  readonly id?: string;
  readonly debugLabel?: string;
  readonly props?: Record<string, unknown>;
  readonly style?: LattixStyle;
  readonly animation?: LattixAnimation | readonly LattixAnimation[];
  readonly children?: readonly LattixNode[];
  readonly meta?: LattixNodeMeta;
  readonly source?: LattixSourceLocation;
  readonly path?: string;
  readonly builderTrace?: readonly string[];
}

export interface CreateTreeOptions {
  readonly mode?: ValidationMode;
  /** When true (default in strict mode), throw if validation fails. */
  readonly throwOnError?: boolean;
  readonly assignPaths?: boolean;
}

const mergeMeta = (
  options: CreateNodeOptions,
): LattixNodeMeta | undefined => {
  const { source, path, builderTrace, meta } = options;
  if (!source && !path && !builderTrace && !meta) {
    return undefined;
  }
  return {
    ...meta,
    ...(source ? { source } : {}),
    ...(path ? { path } : {}),
    ...(builderTrace ? { builderTrace } : {}),
  };
};

/** Create a normalized semantic node. Pure — no fluent state. */
export const createNode = (
  kind: LattixNodeKind | (string & {}),
  options: CreateNodeOptions = {},
): LattixNode => {
  const {
    id,
    debugLabel,
    props = {},
    style,
    animation,
    children,
    meta: _meta,
    ...metaOptions
  } = options;

  const meta = mergeMeta({ ...metaOptions, meta: _meta });

  return {
    kind,
    ...(id !== undefined ? { id } : {}),
    ...(debugLabel !== undefined ? { debugLabel } : {}),
    props,
    ...(style !== undefined ? { style } : {}),
    ...(animation !== undefined ? { animation } : {}),
    ...(children !== undefined && children.length > 0 ? { children } : {}),
    ...(meta !== undefined ? { meta } : {}),
  };
};

/**
 * Build a semantic tree with paths, per-node diagnostics, and validation attached.
 * Throws by default when invalid (strict mode).
 */
export const createTree = (
  root: LattixNode,
  options: CreateTreeOptions = {},
): LattixTree => {
  const config = getLattixConfig();
  const mode = options.mode ?? config.validationMode;
  const throwOnError =
    options.throwOnError ??
    (config.throwOnValidationError && mode === "strict");

  const withPaths =
    options.assignPaths !== false ? assignPaths(root) : root;

  const validation = validateTree(withPaths, {
    mode: mode === "strict" ? "report" : mode,
    assignPaths: false,
  });

  const rootWithDiagnostics = attachDiagnosticsToNodes(
    withPaths,
    validation.diagnostics,
  );

  const tree: LattixTree = {
    root: rootWithDiagnostics,
    version: 1,
    validation,
  };

  if (throwOnError && !validation.valid) {
    throw new LattixValidationError(validation.diagnostics);
  }

  return tree;
};

/** Normalize action shorthand (string id or full action object). */
export const normalizeAction = (
  action: LattixAction | string,
): LattixAction =>
  typeof action === "string" ? { id: action } : action;
