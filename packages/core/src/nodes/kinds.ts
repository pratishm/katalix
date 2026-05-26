import type { LattixNodeKind } from "../types/node.js";

/** All built-in node kinds for the initial core set. */
export const LATTIX_NODE_KINDS = [
  "screen",
  "stack",
  "row",
  "box",
  "text",
  "image",
  "button",
  "input",
  "badge",
  "divider",
  "spacer",
  "list",
] as const satisfies readonly LattixNodeKind[];

const kindSet = new Set<string>(LATTIX_NODE_KINDS);

export const isKnownNodeKind = (kind: string): kind is LattixNodeKind =>
  kindSet.has(kind);

/** Node kinds that may contain child nodes. */
export const CONTAINER_KINDS = new Set<LattixNodeKind>([
  "screen",
  "stack",
  "row",
  "box",
  "list",
  "button",
]);

/** Node kinds that must not have children. */
export const LEAF_KINDS = new Set<LattixNodeKind>([
  "text",
  "image",
  "input",
  "badge",
  "divider",
  "spacer",
]);
