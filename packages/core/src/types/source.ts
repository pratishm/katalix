/** Source location captured during authoring (when available). */
export interface KatalixSourceLocation {
  readonly file?: string;
  readonly line?: number;
  readonly column?: number;
}

import type { KatalixDiagnostic } from "./diagnostic.js";

/** Metadata attached to every semantic node. */
export interface KatalixNodeMeta {
  readonly source?: KatalixSourceLocation;
  /** Dot-separated path in the semantic tree, e.g. `screen.home/stack[0]/text[1]`. */
  readonly path?: string;
  /** Fluent builder operation trail (dev-mode). */
  readonly builderTrace?: readonly string[];
  /** Validation issues for this node (populated automatically on createTree / toTree). */
  readonly diagnostics?: readonly KatalixDiagnostic[];
}
