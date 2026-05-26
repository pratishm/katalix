import type {
  LattixAnimation,
  LattixNode,
  LattixNodeKind,
} from "@lattix/core";
import type { LattixStyle, LattixStyleValue } from "@lattix/core";

/** Mutable state while authoring — never stored on semantic nodes. */
export interface BuilderState {
  kind: LattixNodeKind | (string & {});
  id?: string;
  debugLabel?: string;
  props: Record<string, unknown>;
  style: Record<string, LattixStyleValue>;
  animation?: LattixAnimation | readonly LattixAnimation[];
  children: LattixNode[];
  trace: readonly string[];
}

export type StyleInput = LattixStyleValue;
