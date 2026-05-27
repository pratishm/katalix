import type { KatalixStyleValue } from "@katalix/core";

export type TokenRegistry = Readonly<Record<string, KatalixStyleValue>>;

/** Default design tokens for examples and tests. */
export const defaultTokenRegistry: TokenRegistry = {
  "text.primary": "#111827",
  "text.muted": "#6b7280",
  "text.inverse": "#ffffff",
  "surface.canvas": "#f9fafb",
  "surface.elevated": "#ffffff",
  "surface.overlay": "#101828",
  "border.subtle": "#e5e7eb",
  "brand.primary": "#2563eb",
  "brand.primaryHover": "#1d4ed8",
  "space.1": 4,
  "space.2": 8,
  "space.3": 12,
  "space.4": 16,
  "space.5": 20,
  "space.6": 24,
  "radius.sm": 6,
  "radius.md": 10,
  "radius.lg": 14,
};

export const createTokenRegistry = (
  tokens: Record<string, KatalixStyleValue>,
): TokenRegistry => ({ ...defaultTokenRegistry, ...tokens });

export const hasToken = (ref: string, registry: TokenRegistry): boolean =>
  ref in registry;
