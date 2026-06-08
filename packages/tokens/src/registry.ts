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
  "type.heading.lg": 24,
  "type.heading.md": 20,
  "type.body.md": 16,
  "type.body.sm": 14,
  "elevation.sm": "0 1px 2px rgba(0,0,0,0.05)",
  "elevation.md": "0 4px 6px rgba(0,0,0,0.1)",
  "button.primary.background": "#2563eb",
  "button.primary.color": "#ffffff",
  "button.secondary.background": "#e5e7eb",
  "button.secondary.color": "#111827",
  "button.ghost.background": "transparent",
  "button.ghost.color": "#2563eb",
  "badge.background": "#f1f5f9",
  "badge.color": "#334155",
  "badge.padding": 10,
  "badge.radius": 999,
  "input.border": "#d1d5db",
  "input.background": "#ffffff",
  "theme.dark.surface.canvas": "#0f172a",
  "theme.dark.surface.elevated": "#1e293b",
  "theme.dark.text.primary": "#f8fafc",
  "theme.dark.text.muted": "#94a3b8",
  "theme.dark.border.subtle": "#334155",
};

export const createTokenRegistry = (
  tokens: Record<string, KatalixStyleValue>,
): TokenRegistry => ({ ...defaultTokenRegistry, ...tokens });

let authoringRegistry: TokenRegistry | undefined;

/** Registry used during DSL finalize (cleared after toTree when set via options). */
export const setAuthoringTokenRegistry = (registry: TokenRegistry | undefined): void => {
  authoringRegistry = registry;
};

export const getAuthoringTokenRegistry = (): TokenRegistry =>
  authoringRegistry ?? defaultTokenRegistry;

export const hasToken = (ref: string, registry: TokenRegistry): boolean =>
  ref in registry;
