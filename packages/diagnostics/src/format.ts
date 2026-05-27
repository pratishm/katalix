import type { KatalixDiagnostic } from "@katalix/core";
import type { EnrichedDiagnostic } from "./types.js";

const formatReceived = (received: unknown): string => {
  if (received === undefined) {
    return "undefined";
  }
  if (typeof received === "string") {
    return JSON.stringify(received);
  }
  try {
    return JSON.stringify(received);
  } catch {
    return String(received);
  }
};

const formatAuthoring = (
  authoring: EnrichedDiagnostic["authoring"],
): string[] => {
  if (!authoring) {
    return [];
  }

  const lines: string[] = [];
  if (authoring.debugLabel) {
    lines.push(`  Debug label: ${authoring.debugLabel}`);
  }
  if (authoring.source?.file) {
    const loc = [
      authoring.source.file,
      authoring.source.line !== undefined ? `:${authoring.source.line}` : "",
      authoring.source.column !== undefined ? `:${authoring.source.column}` : "",
    ].join("");
    lines.push(`  Source: ${loc}`);
  }
  if (authoring.builderTrace && authoring.builderTrace.length > 0) {
    lines.push(`  Builder trace:`);
    for (const step of authoring.builderTrace) {
      lines.push(`    → ${step}`);
    }
  }
  return lines;
};

/** Format one diagnostic for terminal or log output. */
export const formatDiagnostic = (
  diagnostic: KatalixDiagnostic | EnrichedDiagnostic,
): string => {
  const severity =
    "severity" in diagnostic ? `[${diagnostic.severity.toUpperCase()}] ` : "";
  const lines = [
    `${severity}${diagnostic.code}: ${diagnostic.summary}`,
    `  ${diagnostic.message}`,
  ];

  if (diagnostic.path) {
    lines.push(`  Path: ${diagnostic.path}`);
  }
  if (diagnostic.nodeKind) {
    lines.push(`  Node: ${diagnostic.nodeKind}`);
  }
  if (diagnostic.field) {
    lines.push(
      `  Field: ${diagnostic.field} (received ${formatReceived(diagnostic.received)}, expected ${diagnostic.expected ?? "valid value"})`,
    );
  }
  if ("authoring" in diagnostic) {
    lines.push(...formatAuthoring(diagnostic.authoring));
  }
  if (diagnostic.suggestion) {
    lines.push(`  Suggestion: ${diagnostic.suggestion}`);
  }

  return lines.join("\n");
};

/** Format multiple diagnostics separated by blank lines. */
export const formatDiagnostics = (
  diagnostics: readonly (KatalixDiagnostic | EnrichedDiagnostic)[],
): string => diagnostics.map(formatDiagnostic).join("\n\n");

/** Print-ready alias for formatDiagnostics. */
export const printDiagnostics = formatDiagnostics;
