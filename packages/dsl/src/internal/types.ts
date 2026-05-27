import type {
  KatalixAnimation,
  KatalixNode,
  KatalixNodeKind,
} from "@katalix/core";
import type { KatalixStyle, KatalixStyleValue } from "@katalix/core";

/** Mutable state while authoring — never stored on semantic nodes. */
export interface BuilderState {
  kind: KatalixNodeKind | (string & {});
  id?: string;
  debugLabel?: string;
  props: Record<string, unknown>;
  style: Record<string, KatalixStyleValue>;
  animation?: KatalixAnimation | readonly KatalixAnimation[];
  children: KatalixNode[];
  trace: readonly string[];
}

export type StyleInput = KatalixStyleValue;
