/**
 * A style value is either a semantic token reference (e.g. `text.primary`)
 * or a raw platform-agnostic literal.
 */
export type KatalixStyleValue = string | number | boolean;

/** Token references use dot notation (e.g. `text.primary`, `space.3`). */
export const isTokenReference = (value: KatalixStyleValue): boolean =>
  typeof value === "string" && /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/i.test(value);

/** Authoring-time style bag on a semantic node (tokens + literals mixed). */
export type KatalixStyle = Readonly<Record<string, KatalixStyleValue>>;

/** Discriminated style value after normalization (Phase 4+). */
export type NormalizedStyleValue =
  | { readonly kind: "token"; readonly ref: string }
  | { readonly kind: "literal"; readonly value: KatalixStyleValue };

/** Normalized semantic style — explicit token vs literal entries. */
export type NormalizedKatalixStyle = Readonly<
  Record<string, NormalizedStyleValue>
>;
