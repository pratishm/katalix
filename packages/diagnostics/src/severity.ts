import type { LattixDiagnostic } from "@lattix/core";
import type { DiagnosticSeverity } from "./types.js";

/** Codes that are warnings in tolerant mode (tree may still be usable). */
const WARNING_CODES = new Set<string>([
  "LATTIX_EMPTY_CONTAINER",
]);

export const severityForCode = (
  code: string,
  mode: "strict" | "report" | "tolerant",
): DiagnosticSeverity => {
  if (mode === "tolerant" && WARNING_CODES.has(code)) {
    return "warning";
  }
  return "error";
};

export const partitionBySeverity = (
  diagnostics: readonly LattixDiagnostic[],
  mode: "strict" | "report" | "tolerant",
): { errors: LattixDiagnostic[]; warnings: LattixDiagnostic[] } => {
  const errors: LattixDiagnostic[] = [];
  const warnings: LattixDiagnostic[] = [];

  for (const diagnostic of diagnostics) {
    const severity = severityForCode(diagnostic.code, mode);
    if (severity === "warning") {
      warnings.push(diagnostic);
    } else {
      errors.push(diagnostic);
    }
  }

  return { errors, warnings };
};
