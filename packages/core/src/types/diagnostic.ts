import type { KatalixSourceLocation } from "./source.js";

/** Structured diagnostic emitted by validation and introspection utilities. */
export interface KatalixDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly summary: string;
  readonly nodeKind?: string;
  readonly manifestKind?: string;
  readonly path?: string;
  readonly field?: string;
  readonly received?: unknown;
  readonly expected?: string;
  readonly suggestion?: string;
  readonly source?: KatalixSourceLocation;
}

export type ValidationMode = "strict" | "report" | "tolerant";

export interface ValidationResult {
  readonly valid: boolean;
  readonly diagnostics: readonly KatalixDiagnostic[];
}
