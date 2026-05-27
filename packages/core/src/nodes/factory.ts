import type { KatalixAction } from "../types/action.js";
import type { KatalixAnimation } from "../types/animation.js";
import type { ValidationMode } from "../types/diagnostic.js";
import type { KatalixNode, KatalixNodeKind, KatalixTree } from "../types/node.js";
import type { KatalixNodeMeta, KatalixSourceLocation } from "../types/source.js";
import type { KatalixStyle } from "../types/style.js";
import { getKatalixConfig } from "../config.js";
import { assignPaths } from "../tree/paths.js";
import { attachDiagnosticsToNodes } from "../tree/attach-diagnostics.js";
import {
  KatalixValidationError,
  validateTree,
} from "../validation/validate.js";

export interface CreateNodeOptions {
  readonly id?: string;
  readonly debugLabel?: string;
  readonly props?: Record<string, unknown>;
  readonly style?: KatalixStyle;
  readonly animation?: KatalixAnimation | readonly KatalixAnimation[];
  readonly children?: readonly KatalixNode[];
  readonly meta?: KatalixNodeMeta;
  readonly source?: KatalixSourceLocation;
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
): KatalixNodeMeta | undefined => {
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
  kind: KatalixNodeKind | (string & {}),
  options: CreateNodeOptions = {},
): KatalixNode => {
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
  root: KatalixNode,
  options: CreateTreeOptions = {},
): KatalixTree => {
  const config = getKatalixConfig();
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

  const tree: KatalixTree = {
    root: rootWithDiagnostics,
    version: 1,
    validation,
  };

  if (throwOnError && !validation.valid) {
    throw new KatalixValidationError(validation.diagnostics);
  }

  return tree;
};

/** Normalize action shorthand (string id or full action object). */
export const normalizeAction = (
  action: KatalixAction | string,
): KatalixAction =>
  typeof action === "string" ? { id: action } : action;
