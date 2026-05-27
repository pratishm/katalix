import type { KatalixAnimation } from "./animation.js";
import type { ValidationResult } from "./diagnostic.js";
import type { KatalixNodeMeta } from "./source.js";
import type { NormalizedKatalixStyle, KatalixStyle } from "./style.js";

/** Core node kinds for the initial generic set. */
export type KatalixNodeKind =
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
export interface KatalixNode {
  readonly kind: KatalixNodeKind | (string & {});
  readonly id?: string;
  readonly debugLabel?: string;
  readonly props: Readonly<Record<string, unknown>>;
  readonly style?: KatalixStyle;
  /** Populated automatically when styles are normalized (via @katalix/tokens). */
  readonly normalizedStyle?: NormalizedKatalixStyle;
  readonly animation?: KatalixAnimation | readonly KatalixAnimation[];
  readonly children?: readonly KatalixNode[];
  readonly meta?: KatalixNodeMeta;
}

/** Root of a semantic tree with built-in validation results. */
export interface KatalixTree {
  readonly root: KatalixNode;
  readonly version: 1;
  /** Always populated by createTree — not optional for consumers. */
  readonly validation: ValidationResult;
}
