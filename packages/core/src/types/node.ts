import type { LattixAnimation } from "./animation.js";
import type { ValidationResult } from "./diagnostic.js";
import type { LattixNodeMeta } from "./source.js";
import type { NormalizedLattixStyle, LattixStyle } from "./style.js";

/** Core node kinds for the initial generic set. */
export type LattixNodeKind =
  | "screen"
  | "stack"
  | "row"
  | "box"
  | "text"
  | "image"
  | "button"
  | "input"
  | "badge"
  | "divider"
  | "spacer"
  | "list";

/**
 * Normalized semantic node — the runtime source of truth.
 * Must never store fluent chain internals.
 */
export interface LattixNode {
  readonly kind: LattixNodeKind | (string & {});
  readonly id?: string;
  readonly debugLabel?: string;
  readonly props: Readonly<Record<string, unknown>>;
  readonly style?: LattixStyle;
  /** Populated automatically when styles are normalized (via @lattix/tokens). */
  readonly normalizedStyle?: NormalizedLattixStyle;
  readonly animation?: LattixAnimation | readonly LattixAnimation[];
  readonly children?: readonly LattixNode[];
  readonly meta?: LattixNodeMeta;
}

/** Root of a semantic tree with built-in validation results. */
export interface LattixTree {
  readonly root: LattixNode;
  readonly version: 1;
  /** Always populated by createTree — not optional for consumers. */
  readonly validation: ValidationResult;
}
