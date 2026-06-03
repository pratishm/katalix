import type { KatalixNodeKind } from "../types/node.js";

/** All built-in node kinds for the initial core set. */
export const KATALIX_NODE_KINDS = [
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
  "safeArea",
  "scroll",
  "flatList",
  "modal",
  "host",
  "field",
  "checkbox",
  "switch",
  "radio",
  "select",
  "toast",
  "skeleton",
  "carousel",
  "avatar",
  "richText",
  "searchBar",
  "tabs",
  "grid",
  "wrap",
  "errorBoundary",
  "fab",
  "loader",
  "webview",
] as const satisfies readonly KatalixNodeKind[];

const kindSet = new Set<string>(KATALIX_NODE_KINDS);

export const isKnownNodeKind = (kind: string): kind is KatalixNodeKind =>
  kindSet.has(kind);

/** Node kinds that may contain child nodes. */
export const CONTAINER_KINDS = new Set<KatalixNodeKind>([
  "screen",
  "stack",
  "row",
  "box",
  "list",
  "button",
  "safeArea",
  "scroll",
  "flatList",
  "modal",
  "host",
  "field",
  "tabs",
  "grid",
  "wrap",
  "carousel",
  "errorBoundary",
]);

/** Node kinds that must not have children. */
export const LEAF_KINDS = new Set<KatalixNodeKind>([
  "text",
  "image",
  "input",
  "badge",
  "divider",
  "spacer",
  "checkbox",
  "switch",
  "radio",
  "select",
  "toast",
  "skeleton",
  "avatar",
  "richText",
  "searchBar",
  "fab",
  "loader",
  "webview",
]);
