import {
  isTokenReference,
  type NormalizedLattixStyle,
  type NormalizedStyleValue,
  type LattixDiagnostic,
  type LattixNode,
  type LattixStyle,
  type LattixStyleValue,
} from "@lattix/core";
import { styleDiagnostic } from "./diagnostic.js";
import { hasToken, type TokenRegistry, defaultTokenRegistry } from "./registry.js";
import {
  isAllowedStyleProperty,
  STYLE_PROPERTY_TYPES,
  valueMatchesType,
} from "./schema.js";

export interface NormalizeStyleOptions {
  readonly registry?: TokenRegistry;
  readonly path?: string;
  readonly nodeKind?: string;
}

export interface NormalizeStyleResult {
  readonly normalized: NormalizedLattixStyle;
  readonly diagnostics: readonly LattixDiagnostic[];
}

const toNormalizedEntry = (value: LattixStyleValue): NormalizedStyleValue => {
  if (typeof value === "string" && isTokenReference(value)) {
    return { kind: "token", ref: value };
  }
  return { kind: "literal", value };
};

/** Normalize an authoring style bag into token/literal entries with diagnostics. */
export const normalizeStyle = (
  style: LattixStyle | undefined,
  options: NormalizeStyleOptions = {},
): NormalizeStyleResult => {
  if (!style || Object.keys(style).length === 0) {
    return { normalized: {}, diagnostics: [] };
  }

  const registry = options.registry ?? defaultTokenRegistry;
  const normalized: Record<string, NormalizedStyleValue> = {};
  const diagnostics: LattixDiagnostic[] = [];

  for (const [prop, value] of Object.entries(style)) {
    if (!isAllowedStyleProperty(prop)) {
      diagnostics.push(
        styleDiagnostic({
          code: "LATTIX_UNKNOWN_STYLE_PROP",
          summary: "Unknown style property",
          message: `Style property "${prop}" at "${options.path ?? "node"}" is not supported.`,
          nodeKind: options.nodeKind,
          path: options.path,
          field: prop,
          received: value,
          expected: "a supported style property",
          suggestion: `Use one of: padding, color, background, gap, fontSize, …`,
        }),
      );
      continue;
    }

    const expectedType = STYLE_PROPERTY_TYPES[prop];
    if (!valueMatchesType(value, expectedType)) {
      diagnostics.push(
        styleDiagnostic({
          code: "LATTIX_INVALID_STYLE_VALUE",
          summary: "Invalid style value type",
          message: `Style property "${prop}" received invalid value type at "${options.path ?? "node"}".`,
          nodeKind: options.nodeKind,
          path: options.path,
          field: prop,
          received: value,
          expected: String(expectedType),
          suggestion: "Use a string token ref, number, or boolean as appropriate for this property.",
        }),
      );
      continue;
    }

    if (
      typeof value === "string" &&
      isTokenReference(value) &&
      !hasToken(value, registry)
    ) {
      diagnostics.push(
        styleDiagnostic({
          code: "LATTIX_UNKNOWN_TOKEN",
          summary: "Unknown design token",
          message: `Token reference "${value}" at "${options.path ?? "node"}" is not defined in the registry.`,
          nodeKind: options.nodeKind,
          path: options.path,
          field: prop,
          received: value,
          expected: "a registered token ref",
          suggestion: `Add "${value}" to your token registry or use a raw literal value.`,
        }),
      );
    }

    normalized[prop] = toNormalizedEntry(value);
  }

  return { normalized, diagnostics };
};

/** Walk a tree and attach normalizedStyle + collect style diagnostics. */
export const normalizeTreeStyles = (
  root: LattixNode,
  options: NormalizeStyleOptions & { registry?: TokenRegistry } = {},
): LattixNode => {
  const allDiagnostics: LattixDiagnostic[] = [];

  const visit = (node: LattixNode): LattixNode => {
    const { normalized, diagnostics } = normalizeStyle(node.style, {
      registry: options.registry,
      path: node.meta?.path,
      nodeKind: node.kind,
    });
    allDiagnostics.push(...diagnostics);

    const children = node.children?.map(visit);

    return {
      ...node,
      ...(Object.keys(normalized).length > 0 ? { normalizedStyle: normalized } : {}),
      ...(children ? { children } : {}),
    };
  };

  return visit(root);
};

export const collectStyleDiagnostics = (
  root: LattixNode,
  options: NormalizeStyleOptions = {},
): readonly LattixDiagnostic[] => {
  const diagnostics: LattixDiagnostic[] = [];

  const visit = (node: LattixNode): void => {
    diagnostics.push(
      ...normalizeStyle(node.style, {
        registry: options.registry,
        path: node.meta?.path,
        nodeKind: node.kind,
      }).diagnostics,
    );
    node.children?.forEach(visit);
  };

  visit(root);
  return diagnostics;
};
